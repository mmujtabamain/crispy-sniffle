const PRIORITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseDateOnly(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const candidate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
}

function resolveSmartRange(smartFilter) {
  const now = new Date();
  const today = startOfDay(now);

  if (smartFilter === 'today') {
    return { start: today, end: today };
  }

  if (smartFilter === 'overdue') {
    return { overdueBefore: today };
  }

  if (smartFilter === 'thisWeek') {
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

/**
 * @param {Array<object>} todos - Todo items where each item may contain a `tags` array.
 * @returns {string[]} Alphabetically sorted unique tag names.
 */
export function collectTags(todos) {
  const tags = new Set();
  todos.forEach((todo) => {
    (todo.tags || []).forEach((tag) => {
      if (typeof tag === 'string' && tag.trim()) {
        tags.add(tag.trim());
      }
    });
  });
  return [...tags].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {Array<object>} todos - Todo items to filter and sort.
 * @param {object} filters - Filter options.
 * @param {string} [filters.completion] - Completion mode (`active`, `completed`, `pending`, `archived`).
 * @param {string} [filters.priority] - Priority filter (`all`, `low`, `medium`, `high`, `critical`).
 * @param {string} [filters.status] - Status filter (`all`, `todo`, `doing`, `done`, `blocked`).
 * @param {string} [filters.startDate] - Inclusive due-date start in `YYYY-MM-DD` format.
 * @param {string} [filters.endDate] - Inclusive due-date end in `YYYY-MM-DD` format.
 * @param {string[]} [filters.tags] - Required tags (all must match).
 * @param {string} [filters.searchText] - Full-text query.
 * @param {string} [filters.searchTag] - Tag substring query.
 * @param {string} [filters.smartFilter] - Smart date filter (`none`, `today`, `thisWeek`, `overdue`).
 * @param {string} [filters.sortBy] - Sort mode (`manual`, `created-desc`, `created-asc`, `due-asc`, `priority-desc`, `alpha-asc`).
 * @returns {Array<object>} Filtered and sorted todos.
 */
export function applyFiltersAndSort(todos, filters) {
  const safeFilters = {
    completion: 'active',
    priority: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    tags: [],
    searchText: '',
    searchTag: '',
    smartFilter: 'none',
    sortBy: 'manual',
    ...filters
  };

  const selectedTags = Array.isArray(safeFilters.tags)
    ? safeFilters.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
    : [];
  const searchText = String(safeFilters.searchText || '').trim().toLowerCase();
  const searchTag = String(safeFilters.searchTag || '').trim().toLowerCase();

  const startDate = parseDateOnly(safeFilters.startDate);
  const endDate = parseDateOnly(safeFilters.endDate);
  const smartRange = resolveSmartRange(safeFilters.smartFilter);

  const filtered = todos.filter((todo) => {
    if (safeFilters.completion === 'active' && todo.archived) {
      return false;
    }
    if (safeFilters.completion === 'completed' && !todo.completed) {
      return false;
    }
    if (safeFilters.completion === 'pending' && todo.completed) {
      return false;
    }
    if (safeFilters.completion === 'archived' && !todo.archived) {
      return false;
    }

    if (safeFilters.priority !== 'all' && todo.priority !== safeFilters.priority) {
      return false;
    }

    if (safeFilters.status !== 'all' && todo.status !== safeFilters.status) {
      return false;
    }

    if (selectedTags.length > 0) {
      const todoTags = (todo.tags || []).map((tag) => String(tag).toLowerCase());
      const hasAllTags = selectedTags.every((tag) => todoTags.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }

    if (searchTag) {
      const todoTags = (todo.tags || []).map((tag) => String(tag).toLowerCase());
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
        ...(todo.links || [])
      ]
        .join(' ')
        .toLowerCase();

      if (!bundle.includes(searchText)) {
        return false;
      }
    }

    const due = parseDateOnly(todo.dueDate);

    if (startDate && (!due || due < startDate)) {
      return false;
    }

    if (endDate && (!due || due > endDate)) {
      return false;
    }

    if (smartRange?.overdueBefore) {
      if (!due || due >= smartRange.overdueBefore || todo.completed) {
        return false;
      }
    }

    if (smartRange?.start && smartRange?.end) {
      if (!due || due < smartRange.start || due > smartRange.end) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  if (safeFilters.sortBy === 'manual') {
    return sorted.sort((a, b) => a.order - b.order);
  }

  if (safeFilters.sortBy === 'created-desc') {
    return sorted.sort((a, b) => {
      const bTime = new Date(b.createdAt).getTime();
      const aTime = new Date(a.createdAt).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }

  if (safeFilters.sortBy === 'created-asc') {
    return sorted.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
    });
  }

  if (safeFilters.sortBy === 'due-asc') {
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

  if (safeFilters.sortBy === 'priority-desc') {
    return sorted.sort((a, b) => {
      const bRank = PRIORITY_RANK[b.priority] || 0;
      const aRank = PRIORITY_RANK[a.priority] || 0;
      return bRank - aRank;
    });
  }

  if (safeFilters.sortBy === 'alpha-asc') {
    return sorted.sort((a, b) => a.text.localeCompare(b.text));
  }

  return sorted;
}

/**
 * @returns {object} Default filter state object expected by `applyFiltersAndSort`.
 */
export function createDefaultFilters() {
  return {
    completion: 'active',
    priority: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    tags: [],
    searchText: '',
    searchTag: '',
    smartFilter: 'none',
    sortBy: 'manual'
  };
}
