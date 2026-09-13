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
  onOpenCommandPalette?: () => void;
  onToggleTheme?: () => void;
  currentTheme?: string;
  onExportMarkdown?: () => void;
  currentView?: "board" | "calendar" | "table" | "analytics";
  onViewChange?: (view: "board" | "calendar" | "table" | "analytics") => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
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
  onOpenCommandPalette,
  onToggleTheme,
  currentTheme,
  onExportMarkdown,
  currentView = "board",
  onViewChange,
  onExportCSV,
  onExportJSON,
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

          {onViewChange && (
            <div className="board-view-tabs">
              <button
                type="button"
                className={`board-view-tab ${currentView === "board" ? "is-active" : ""}`}
                onClick={() => onViewChange("board")}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="18" rx="1" />
                  <rect x="14" y="3" width="7" height="10" rx="1" />
                </svg>
                <span>Board</span>
              </button>
              <button
                type="button"
                className={`board-view-tab ${currentView === "calendar" ? "is-active" : ""}`}
                onClick={() => onViewChange("calendar")}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Calendar</span>
              </button>
              <button
                type="button"
                className={`board-view-tab ${currentView === "table" ? "is-active" : ""}`}
                onClick={() => onViewChange("table")}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span>Table</span>
              </button>
              <button
                type="button"
                className={`board-view-tab ${currentView === "analytics" ? "is-active" : ""}`}
                onClick={() => onViewChange("analytics")}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span>Analytics</span>
              </button>
            </div>
          )}
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
          {onOpenCommandPalette && (
            <button
              className="board-action-icon board-action-icon--highlight"
              onClick={onOpenCommandPalette}
              type="button"
              title="Command Palette (Ctrl + K)"
              aria-label="Command Palette"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          )}

          {onToggleTheme && (
            <button
              className="board-action-icon"
              onClick={onToggleTheme}
              type="button"
              title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle theme"
            >
              {currentTheme === "dark" ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          )}

          {onExportCSV && (
            <button
              className="board-action-icon"
              onClick={onExportCSV}
              type="button"
              title="Export cards to CSV spreadsheet"
              aria-label="Export CSV"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
              </svg>
            </button>
          )}

          {onExportJSON && (
            <button
              className="board-action-icon"
              onClick={onExportJSON}
              type="button"
              title="Backup board as JSON"
              aria-label="Backup JSON"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
          )}

          {onExportMarkdown && (
            <button
              className="board-action-icon"
              onClick={onExportMarkdown}
              type="button"
              title="Export board as Markdown"
              aria-label="Export board"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          )}

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
