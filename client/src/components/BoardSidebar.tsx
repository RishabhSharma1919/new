import { type FormEvent, useMemo, useState } from "react";
import type { BoardSummary } from "../types";

type BoardSidebarProps = {
  backgrounds: string[];
  boards: BoardSummary[];
  isOpen: boolean;
  selectedBoardId: string | null;
  starredBoardIds: string[];
  onClose: () => void;
  onCreateBoard: (payload: { title: string; background: string }) => Promise<void>;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onSelectBoard: (boardId: string) => void;
};

export function BoardSidebar({
  backgrounds,
  boards,
  isOpen,
  selectedBoardId,
  starredBoardIds,
  onClose,
  onCreateBoard,
  onDeleteBoard,
  onSelectBoard,
}: BoardSidebarProps) {
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(backgrounds[0] ?? "ocean");
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const searchedBoards = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return boards;
    }

    return boards.filter((board) => board.title.toLowerCase().includes(search));
  }, [boards, query]);

  const starredBoards = useMemo(
    () => searchedBoards.filter((board) => starredBoardIds.includes(board.id)),
    [searchedBoards, starredBoardIds],
  );

  const filteredBoards = showStarredOnly ? starredBoards : searchedBoards;
  const recentBoards = filteredBoards.slice(0, 3);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateBoard({ title: trimmedTitle, background });
      setTitle("");
      setQuery("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="board-picker-backdrop" onClick={onClose} role="presentation">
      <aside className="board-picker-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="board-picker-search-row">
          <label className="board-picker-search">
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
              autoFocus
              placeholder="Search your boards"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <button
            className={`board-picker-toolbar-button ${layout === "grid" ? "is-active" : ""}`}
            onClick={() => setLayout((current) => (current === "grid" ? "list" : "grid"))}
            type="button"
            aria-label="Toggle board layout"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M5.5 5.5h4.5v4.5H5.5Zm8.5 0h4.5v4.5H14Zm-8.5 8.5h4.5v4.5H5.5Zm8.5 0h4.5v4.5H14Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
          <button
            className={`board-picker-toolbar-button ${showStarredOnly ? "is-active" : ""}`}
            onClick={() => setShowStarredOnly((current) => !current)}
            type="button"
            aria-label="Toggle starred boards"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M9 5.5h6l-1.4 4.1 3 2.4H7.4l3-2.4L9 5.5Zm3 6.5v6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>

        <div className="board-picker-tabs">
          <button className={`board-picker-tab ${!showStarredOnly ? "is-active" : ""}`} onClick={() => setShowStarredOnly(false)} type="button">
            All
          </button>
          <button className={`board-picker-tab ${showStarredOnly ? "is-active" : ""}`} onClick={() => setShowStarredOnly(true)} type="button">
            Starred
          </button>
        </div>

        <section className="board-picker-section">
          <div className="board-picker-section__header">
            <h3>Recent</h3>
          </div>
          <div className={`board-picker-grid ${layout === "list" ? "is-list" : ""}`}>
            {recentBoards.length > 0 ? (
              recentBoards.map((board) => (
                <BoardTile
                  key={board.id}
                  board={board}
                  isActive={board.id === selectedBoardId}
                  isStarred={starredBoardIds.includes(board.id)}
                  onDeleteBoard={onDeleteBoard}
                  onSelectBoard={onSelectBoard}
                />
              ))
            ) : (
              <p className="workspace-list__empty">No boards match this filter yet.</p>
            )}
          </div>
        </section>

        <section className="board-picker-section">
          <div className="board-picker-section__header">
            <h3>{showStarredOnly ? "Starred boards" : "All boards"}</h3>
          </div>
          <div className={`board-picker-grid ${layout === "list" ? "is-list" : ""}`}>
            {filteredBoards.length > 0 ? (
              filteredBoards.map((board) => (
                <BoardTile
                  key={board.id}
                  board={board}
                  isActive={board.id === selectedBoardId}
                  isStarred={starredBoardIds.includes(board.id)}
                  onDeleteBoard={onDeleteBoard}
                  onSelectBoard={onSelectBoard}
                />
              ))
            ) : (
              <p className="workspace-list__empty">No boards match this filter yet.</p>
            )}
          </div>
        </section>

        <section className="board-picker-create">
          <div className="board-picker-section__header">
            <h3>Create board</h3>
          </div>

          <form className="create-board-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Board title</span>
              <input
                placeholder="My Trello board"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Background</span>
              <div className="background-grid">
                {backgrounds.map((option) => (
                  <button
                    key={option}
                    className={`background-pill background-pill--${option} ${background === option ? "is-selected" : ""}`}
                    onClick={() => setBackground(option)}
                    type="button"
                    aria-label={`Choose ${option} background`}
                  />
                ))}
              </div>
            </label>

            <div className="board-picker-create__actions">
              <button className="primary-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating..." : "Create board"}
              </button>
              <button className="ghost-button" onClick={onClose} type="button">
                Close
              </button>
            </div>
          </form>
        </section>
      </aside>
    </div>
  );
}

type BoardTileProps = {
  board: BoardSummary;
  isActive: boolean;
  isStarred: boolean;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onSelectBoard: (boardId: string) => void;
};

function BoardTile({ board, isActive, isStarred, onDeleteBoard, onSelectBoard }: BoardTileProps) {
  return (
    <div className={`board-tile ${isActive ? "is-active" : ""}`}>
      <button className="board-tile__surface" onClick={() => onSelectBoard(board.id)} type="button">
        <span className={`board-tile__cover board-swatch--${board.background}`} />
        <span className="board-tile__title">{board.title}</span>
        {isStarred ? <span className="board-tile__badge">Starred</span> : null}
      </button>
      <button
        className="board-tile__delete"
        onClick={(event) => {
          event.stopPropagation();
          void onDeleteBoard(board.id);
        }}
        type="button"
        aria-label={`Delete ${board.title}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M10 11v6m4-6v6m-7-9h10m-9.2 0 .7-1.8A1 1 0 0 1 9.4 5h5.2a1 1 0 0 1 .9.6L16.2 8M8 8l.5 10a1 1 0 0 0 1 .9h4.9a1 1 0 0 0 1-.9L16 8"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </button>
    </div>
  );
}
