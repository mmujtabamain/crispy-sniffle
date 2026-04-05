import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Archive,
  FilePlus2,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import type { List } from "../../../lib/workspace";
import type { ListsPanelProps } from "./types";

export default function ListsPanel({
  lists,
  activeListId,
  onCreateList,
  onSelectList,
  onRenameList,
  onDeleteList,
  onMoveList,
  onArchiveList,
  onRestoreList,
}: ListsPanelProps) {
  const [showArchivedLists, setShowArchivedLists] = useState(false);

  const visibleLists = lists.filter((list: List) =>
    showArchivedLists ? true : !list.archived,
  );

  return (
    <div className="panel">
      <div className="flex justify-between items-center gap-2">
        <h2>Lists</h2>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            const name = window.prompt("New list name", "New list");
            if (!name) {
              return;
            }
            const icon = window.prompt("List icon or emoji", "🗂️") || "🗂️";
            const color = window.prompt("List color (hex)", "#b08968") || "#b08968";
            onCreateList({ name, icon, color });
          }}
        >
          <FilePlus2 size={15} /> Add list
        </button>
      </div>

      <label className="inline-toggle">
        <input
          type="checkbox"
          checked={showArchivedLists}
          onChange={(event) => setShowArchivedLists(event.target.checked)}
        />
        <span>Show archived lists</span>
      </label>

      <ul className="list-none grid gap-2">
        {visibleLists.map((list: List, index: number) => (
          <li
            key={list.id}
            className={`list-row ${list.id === activeListId ? "active" : ""}`}
          >
            <button
              type="button"
              className="list-select"
              onClick={() => onSelectList(list.id)}
            >
              <span className="list-icon" style={{ background: list.color }}>
                {list.icon}
              </span>
              <span>
                {list.name}
                {list.archived ? <small> archived</small> : null}
              </span>
            </button>
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                className="ghost-button"
                onClick={() => onMoveList(list.id, -1)}
                disabled={index === 0}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onMoveList(list.id, 1)}
                disabled={index === visibleLists.length - 1}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onRenameList(list.id)}
              >
                <Star size={14} />
              </button>
              {list.archived ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onRestoreList(list.id)}
                >
                  <Undo2 size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onArchiveList(list.id)}
                >
                  <Archive size={14} />
                </button>
              )}
              <button
                type="button"
                className="ghost-button danger"
                onClick={() => onDeleteList(list.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
