import { type FormEvent, useState } from "react";
import type { BoardSummary } from "../types";

type BoardHomeProps = {
  backgrounds: string[];
  boards: BoardSummary[];
  onCreateBoard: (payload: { title: string; background: string }) => Promise<void>;
  onSelectBoard: (boardId: string) => void;
};

export function BoardHome({ backgrounds, boards, onCreateBoard, onSelectBoard }: BoardHomeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(backgrounds[0] ?? "ocean");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    await onCreateBoard({ title: trimmed, background });
    setTitle("");
    setIsCreating(false);
  }

  return (
    <div className="board-home">
      <header className="board-home__header">
        <h1>Welcome back to your workspace</h1>
        <p>You have {boards.length} active boards in this project.</p>
      </header>

      <div className="board-home__grid">
        {boards.map((board) => (
          <button
            key={board.id}
            className={`board-home__tile board-home__tile--${board.background}`}
            onClick={() => onSelectBoard(board.id)}
            type="button"
          >
            <div className="board-home__tile-overlay" />
            <div className="board-home__tile-content">
              <h3>{board.title}</h3>
              <div className="board-home__tile-stats">
                <span>{board.listCount} lists</span>
                <span className="dot" />
                <span>{board.cardCount} cards</span>
              </div>
            </div>
          </button>
        ))}

        {isCreating ? (
          <div className="board-home__tile board-home__tile--form glass-panel">
            <form onSubmit={handleCreate}>
              <input
                autoFocus
                placeholder="Name this board"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="background-selector__grid">
                {backgrounds.map((bg) => (
                  <button
                    key={bg}
                    className={`bg-pill bg-pill--${bg} ${background === bg ? "is-active" : ""}`}
                    onClick={() => setBackground(bg)}
                    type="button"
                  />
                ))}
              </div>
              <div className="board-home__form-actions">
                <button className="primary-button" type="submit">Create</button>
                <button className="ghost-button" onClick={() => setIsCreating(false)} type="button">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <button
            className="board-home__tile board-home__tile--add"
            onClick={() => setIsCreating(true)}
            type="button"
          >
            <div className="board-home__tile-content">
              <span>+ Create new board</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
