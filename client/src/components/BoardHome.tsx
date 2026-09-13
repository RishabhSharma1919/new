import { type FormEvent, useState } from "react";
import type { BoardSummary } from "../types";
import { BOARD_TEMPLATES, type BoardTemplate } from "../lib/templates";

type BoardHomeProps = {
  backgrounds: string[];
  boards: BoardSummary[];
  onCreateBoard: (payload: { title: string; background: string }) => Promise<void>;
  onSelectBoard: (boardId: string) => void;
  onCreateFromTemplate?: (template: BoardTemplate) => Promise<void>;
};

export function BoardHome({
  backgrounds,
  boards,
  onCreateBoard,
  onSelectBoard,
  onCreateFromTemplate,
}: BoardHomeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(backgrounds[0] ?? "ocean");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setCreateError(null);

    try {
      await onCreateBoard({ title: trimmed, background });
      setTitle("");
      setIsCreating(false);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Could not create this board.");
    }
  }

  async function handleSelectTemplate(template: BoardTemplate) {
    if (!onCreateFromTemplate || isCreatingTemplate) return;
    setIsCreatingTemplate(template.id);
    try {
      await onCreateFromTemplate(template);
    } finally {
      setIsCreatingTemplate(null);
    }
  }

  return (
    <div className="board-home">
      <header className="board-home__header">
        <h1>Welcome back to your workspace</h1>
        <p>You have {boards.length} active boards in this workspace.</p>
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
              {createError ? <p className="inline-error">{createError}</p> : null}
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

      {onCreateFromTemplate && (
        <div className="templates-section">
          <div className="templates-section__header">
            <div>
              <h2>Start with a popular template</h2>
              <p>Jumpstart your workflow with pre-configured lists, labels, and example cards.</p>
            </div>
          </div>

          <div className="templates-grid">
            {BOARD_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                className="template-card"
                onClick={() => void handleSelectTemplate(tmpl)}
                disabled={isCreatingTemplate === tmpl.id}
              >
                <div className="template-card__icon">{tmpl.icon}</div>
                <div className="template-card__body">
                  <strong>{tmpl.name}</strong>
                  <p>{tmpl.description}</p>
                  <div className="template-card__lists">
                    {tmpl.lists.slice(0, 3).map((l) => (
                      <span key={l.title} className="template-list-tag">
                        {l.title}
                      </span>
                    ))}
                    {tmpl.lists.length > 3 && (
                      <span className="template-list-tag template-list-tag--more">
                        +{tmpl.lists.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="template-card__action">
                  <span>{isCreatingTemplate === tmpl.id ? "Creating..." : "Use template"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
