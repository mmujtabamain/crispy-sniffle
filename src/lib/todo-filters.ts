import type { Todo } from "./workspace";

type CompletionFilter = "active" | "completed" | "pending" | "archived" | "all";
type PriorityFilter = "all" | "low" | "medium" | "high" | "critical";
type StatusFilter = "all" | "todo" | "doing" | "done" | "blocked";
type SmartFilter = "none" | "today" | "thisWeek" | "overdue";
type SortFilter =
  | "manual"
  | "created-desc"
  | "created-asc"
  | "due-asc"
  | "priority-desc"
  | "alpha-asc";

export interface TodoFilters {
  completion: CompletionFilter;
  priority: PriorityFilter;
  status: StatusFilter;
  startDate: string;
  endDate: string;
  tags: string[];
  searchText: string;
  searchTag: string;
  smartFilter: SmartFilter;
  sortBy: SortFilter;
}

const PRIORITY_RANK: Record<"low" | "medium" | "high" | "critical", number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseDateOnly(value: string): Date | null {
  if (!value) {
    return null;
  }

  const candidate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }

  return candidate;
}

function resolveSmartRange(
  smartFilter: SmartFilter,
): { start: Date; end: Date } | { overdueBefore: Date } | null {
  const now = new Date();
  const today = startOfDay(now);

  if (smartFilter === "today") {
    return { start: today, end: today };
  }

  if (smartFilter === "overdue") {
    return { overdueBefore: today };
  }

  if (smartFilter === "thisWeek") {
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  }

  return null;
}

export function collectTags(todos: Todo[]): string[] {
  const tags: Set<string> = new Set();

  todos.forEach((todo) => {
    (todo.tags || []).forEach((tag) => {
      if (typeof tag === "string" && tag.trim()) {
        tags.add(tag.trim());
      }
    });
  });

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function applyFiltersAndSort(
  todos: Todo[],
  filters: Partial<TodoFilters>,
): Todo[] {
  const safeFilters: TodoFilters = {
    ...createDefaultFilters(),
    ...filters,
    tags: Array.isArray(filters.tags) ? filters.tags : [],
  };

  const selectedTags = safeFilters.tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean);
  const searchText = String(safeFilters.searchText || "")
    .trim()
    .toLowerCase();
  const searchTag = String(safeFilters.searchTag || "")
    .trim()
    .toLowerCase();

  const startDate = parseDateOnly(safeFilters.startDate);
  const endDate = parseDateOnly(safeFilters.endDate);
  const smartRange = resolveSmartRange(safeFilters.smartFilter);

  const filtered = todos.filter((todo) => {
    if (safeFilters.completion === "active" && todo.archived) {
      return false;
    }
    if (safeFilters.completion === "completed" && !todo.completed) {
      return false;
    }
    if (safeFilters.completion === "pending" && todo.completed) {
      return false;
    }
    if (safeFilters.completion === "archived" && !todo.archived) {
      return false;
    }

    if (
      safeFilters.priority !== "all" &&
      todo.priority !== safeFilters.priority
    ) {
      return false;
    }

    if (safeFilters.status !== "all" && todo.status !== safeFilters.status) {
      return false;
    }

    if (selectedTags.length > 0) {
      const todoTags = (todo.tags || []).map((tag) =>
        String(tag).toLowerCase(),
      );
      const hasAllTags = selectedTags.every((tag) => todoTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    if (searchTag) {
      const todoTags = (todo.tags || []).map((tag) =>
        String(tag).toLowerCase(),
      );
      const hasMatch = todoTags.some((tag) => tag.includes(searchTag));
      if (!hasMatch) {
        return false;
      }
    }

    if (searchText) {
      const bundle = [
        todo.text,
        todo.description,
        todo.category,
        todo.notes,
        ...(todo.tags || []),
        ...(todo.links || []),
      ]
        .join(" ")
        .toLowerCase();

      if (!bundle.includes(searchText)) {
        return false;
      }
    }

    const due = parseDateOnly(todo.dueDate || "");

    if (startDate && (!due || due < startDate)) {
      return false;
    }

    if (endDate && (!due || due > endDate)) {
      return false;
    }

    if (smartRange && "overdueBefore" in smartRange) {
      if (!due || due >= smartRange.overdueBefore || todo.completed) {
        return false;
      }
    }

    if (smartRange && "start" in smartRange) {
      if (!due || due < smartRange.start || due > smartRange.end) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];

  if (safeFilters.sortBy === "manual") {
    return sorted.sort((a, b) => a.order - b.order);
  }

  if (safeFilters.sortBy === "created-desc") {
    return sorted.sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime();
      const aTime = new Date(a.createdAt).getTime();
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });
  }

  if (safeFilters.sortBy === "created-asc") {
    return sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return (
        (Number.isFinite(aTime) ? aTime : 0) -
        (Number.isFinite(bTime) ? bTime : 0)
      );
    });
  }

  if (safeFilters.sortBy === "due-asc") {
    return sorted.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) {
        return 0;
      }
      if (!a.dueDate) {
        return 1;
      }
      if (!b.dueDate) {
        return -1;
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  if (safeFilters.sortBy === "priority-desc") {
    return sorted.sort((a, b) => {
      const bRank = PRIORITY_RANK[b.priority] || 0;
      const aRank = PRIORITY_RANK[a.priority] || 0;
      return bRank - aRank;
    });
  }

  if (safeFilters.sortBy === "alpha-asc") {
    return sorted.sort((a, b) => a.text.localeCompare(b.text));
  }

  return sorted;
}

export function createDefaultFilters(): TodoFilters {
  return {
    completion: "active",
    priority: "all",
    status: "all",
    startDate: "",
    endDate: "",
    tags: [],
    searchText: "",
    searchTag: "",
    smartFilter: "none",
    sortBy: "manual",
  };
}
