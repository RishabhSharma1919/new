import { useState, useMemo } from "react";
import type { Board, Card } from "../types";

type Props = {
  board: Board;
  onOpenCard: (cardId: string) => void;
  onToggleCardComplete: (cardId: string, isComplete: boolean) => void;
};

type SortField = "title" | "list" | "dueDate" | "status";
type SortOrder = "asc" | "desc";

export function TableView({ board, onOpenCard, onToggleCardComplete }: Props) {
  const [search, setSearch] = useState("");
  const [selectedList, setSelectedList] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("list");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const allCards = useMemo(() => {
    return board.lists.flatMap((list) =>
      list.cards
        .filter((card) => !card.isArchived)
        .map((card) => ({ ...card, listTitle: list.title }))
    );
  }, [board.lists]);

  const filteredCards = useMemo(() => {
    let result = allCards;

    if (selectedList !== "all") {
      result = result.filter((c) => c.listId === selectedList);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.labels.some((l) => l.name.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === "list") {
        comparison = a.listTitle.localeCompare(b.listTitle);
      } else if (sortField === "dueDate") {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = timeA - timeB;
      } else if (sortField === "status") {
        comparison = (a.isComplete ? 1 : 0) - (b.isComplete ? 1 : 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [allCards, selectedList, search, sortField, sortOrder]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function getPriority(card: Card) {
    const priorityLabel = card.labels.find((l) =>
      ["urgent", "high", "medium", "low"].includes(l.name.toLowerCase())
    );
    if (priorityLabel) return priorityLabel.name.toUpperCase();
    return "NORMAL";
  }

  const completedCount = allCards.filter((c) => c.isComplete).length;
  const overdueCount = allCards.filter(
    (c) => c.dueDate && new Date(c.dueDate).getTime() < Date.now() && !c.isComplete
  ).length;

  return (
    <div className="table-view">
      <div className="table-toolbar">
        <div className="table-toolbar__left">
          <div className="table-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search cards in table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="table-search-clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="table-list-filter"
            value={selectedList}
            onChange={(e) => setSelectedList(e.target.value)}
          >
            <option value="all">All Lists ({allCards.length})</option>
            {board.lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title} ({l.cards.filter((c) => !c.isArchived).length})
              </option>
            ))}
          </select>
        </div>

        <div className="table-toolbar__stats">
          <span className="table-stat-badge">Total: {allCards.length}</span>
          <span className="table-stat-badge table-stat-badge--success">Completed: {completedCount}</span>
          {overdueCount > 0 && (
            <span className="table-stat-badge table-stat-badge--danger">Overdue: {overdueCount}</span>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th className="sortable-th" onClick={() => handleSort("title")}>
                Card Title {sortField === "title" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="sortable-th" onClick={() => handleSort("list")}>
                List / Stage {sortField === "list" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th>Priority</th>
              <th className="sortable-th" onClick={() => handleSort("dueDate")}>
                Due Date {sortField === "dueDate" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th>Checklist</th>
              <th>Assignees</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.length > 0 ? (
              filteredCards.map((card) => {
                const isOverdue =
                  card.dueDate &&
                  new Date(card.dueDate).getTime() < Date.now() &&
                  !card.isComplete;

                const totalChecklistItems = card.checklists.reduce(
                  (acc, cl) => acc + cl.items.length,
                  0
                );
                const completedChecklistItems = card.checklists.reduce(
                  (acc, cl) => acc + cl.items.filter((i) => i.isComplete).length,
                  0
                );

                const priority = getPriority(card);

                return (
                  <tr key={card.id} className={card.isComplete ? "is-row-completed" : ""}>
                    <td className="table-cell-check">
                      <input
                        type="checkbox"
                        checked={card.isComplete}
                        onChange={(e) => onToggleCardComplete(card.id, e.target.checked)}
                        title="Toggle complete"
                      />
                    </td>
                    <td className="table-cell-title">
                      <button
                        type="button"
                        className="table-title-link"
                        onClick={() => onOpenCard(card.id)}
                      >
                        {card.title}
                      </button>
                    </td>
                    <td>
                      <span className="table-list-pill">{card.listTitle}</span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-badge--${priority.toLowerCase()}`}>
                        {priority}
                      </span>
                    </td>
                    <td>
                      {card.dueDate ? (
                        <span className={`due-badge ${isOverdue ? "is-overdue" : ""} ${card.isComplete ? "is-completed" : ""}`}>
                          {new Date(card.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="table-empty-val">—</span>
                      )}
                    </td>
                    <td>
                      {totalChecklistItems > 0 ? (
                        <span className={`checklist-badge ${completedChecklistItems === totalChecklistItems ? "is-complete" : ""}`}>
                          ✓ {completedChecklistItems}/{totalChecklistItems}
                        </span>
                      ) : (
                        <span className="table-empty-val">—</span>
                      )}
                    </td>
                    <td>
                      <div className="table-members-stack">
                        {card.members.map((m) => (
                          <span
                            key={m.id}
                            className="avatar-chip table-member-avatar"
                            style={{ backgroundColor: m.color }}
                            title={m.name}
                          >
                            {m.avatar}
                          </span>
                        ))}
                        {card.members.length === 0 && (
                          <span className="table-empty-val">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="table-empty-row">
                  No cards match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
