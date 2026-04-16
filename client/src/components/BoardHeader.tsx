import type { Board, DueFilter, FilterState } from "../types";

type BoardHeaderProps = {
  board: Board;
  dragDisabled: boolean;
  filters: FilterState;
  isStarred: boolean;
  showFilters: boolean;
  totalVisibleCards: number;
  onClearFilters: () => void;
  onDueFilterChange: (value: DueFilter) => void;
  onOpenBoardPicker: () => void;
  onOpenBoardTools: () => void;
  onOpenMembers: () => void;
  onOpenPowerUps: () => void;
  onSearchChange: (value: string) => void;
  onShareBoard: () => void;
  onToggleFilters: () => void;
  onToggleLabel: (labelId: string) => void;
  onToggleMember: (memberId: string) => void;
  onToggleStar: () => void;
};

export function BoardHeader({
  board,
  dragDisabled,
  filters,
  isStarred,
  showFilters,
  totalVisibleCards,
  onClearFilters,
  onDueFilterChange,
  onOpenBoardPicker,
  onOpenBoardTools,
  onOpenMembers,
  onOpenPowerUps,
  onSearchChange,
  onShareBoard,
  onToggleFilters,
  onToggleLabel,
  onToggleMember,
  onToggleStar,
}: BoardHeaderProps) {
  const activeFilterCount =
    filters.labelIds.length +
    filters.memberIds.length +
    (filters.search.trim() ? 1 : 0) +
    (filters.due !== "all" ? 1 : 0);

  return (
    <header className="board-header">
      <div className="board-header__bar">
        <div className="board-header__left">
          <button className="board-title-button" onClick={onOpenBoardPicker} type="button">
            <span>{board.title}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="m8 10 4 4 4-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          <button
            className={`board-action-icon ${isStarred ? "is-active" : ""}`}
            onClick={onToggleStar}
            type="button"
            aria-label={isStarred ? "Remove board star" : "Star board"}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="m12 4 2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 4Z"
                fill={isStarred ? "currentColor" : "none"}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>

        <div className="board-header__right">
          <div className="board-header__avatars">
            {board.members.slice(0, 4).map((member) => (
              <span key={member.id} className="card-member board-member" style={{ backgroundColor: member.color }}>
                {member.avatar}
              </span>
            ))}
          </div>

          <button className="board-action-icon" onClick={onOpenPowerUps} type="button" aria-label="Power-Ups">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="m12 4-1.7 6H15l-5.1 10L11.6 13H8L12 4Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
          <button className="board-action-icon" onClick={onToggleFilters} type="button" aria-label="Toggle filters">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M5 7.5h14M8 12h8m-5 4.5h2"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          <button className="board-action-icon" onClick={onOpenMembers} type="button" aria-label="Invite members">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M16.5 18a3.5 3.5 0 0 0-7 0m11.5 0a3.5 3.5 0 0 0-2.7-3.4m-12.6 3.4a3.5 3.5 0 0 1 2.7-3.4M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6-1a2.5 2.5 0 1 0 0-5m-12 5a2.5 2.5 0 1 1 0-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
          <button className="board-action-chip board-action-chip--primary" onClick={onShareBoard} type="button">
            Share
          </button>
          <button className="board-action-icon" onClick={onOpenBoardTools} type="button" aria-label="Board menu">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="6.5" r="1.4" fill="currentColor" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" />
              <circle cx="12" cy="17.5" r="1.4" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {showFilters || activeFilterCount > 0 ? (
        <div className="board-filter-drawer">
          <div className="board-filter-drawer__top">
            <label className="field field--search board-search">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M15.5 15.5 20 20m-2.5-9a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
              <input
                placeholder="Search cards"
                value={filters.search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </label>

            <label className="field board-inline-select">
              <span>Due</span>
              <select value={filters.due} onChange={(event) => onDueFilterChange(event.target.value as DueFilter)}>
                <option value="all">All cards</option>
                <option value="overdue">Overdue</option>
                <option value="due-soon">Due in 7 days</option>
                <option value="no-date">No date</option>
              </select>
            </label>

            <div className="board-filter-drawer__status">
              <span>{activeFilterCount > 0 ? `${activeFilterCount} filters active` : "No active filters"}</span>
              <span>{totalVisibleCards} visible cards</span>
              <span>{dragDisabled ? "Dragging paused" : "Dragging enabled"}</span>
            </div>
          </div>

          <div className="toolbar-grid">
            <div className="chip-group-card">
              <span>Labels</span>
              <div className="chip-row">
                {board.labels.map((label) => (
                  <button
                    key={label.id}
                    className={`filter-chip ${filters.labelIds.includes(label.id) ? "is-selected" : ""}`}
                    onClick={() => onToggleLabel(label.id)}
                    type="button"
                  >
                    <span className="filter-chip__dot" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="chip-group-card">
              <span>Members</span>
              <div className="chip-row">
                {board.members.map((member) => (
                  <button
                    key={member.id}
                    className={`filter-chip ${filters.memberIds.includes(member.id) ? "is-selected" : ""}`}
                    onClick={() => onToggleMember(member.id)}
                    type="button"
                  >
                    <span className="avatar-chip" style={{ backgroundColor: member.color }}>
                      {member.avatar}
                    </span>
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="board-filter-drawer__actions">
              <button className="ghost-button" onClick={onClearFilters} type="button">
                Clear filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
