import { type FormEvent, useEffect, useState } from "react";
import type { Board } from "../types";

export type BoardToolsView = "overview" | "members" | "powerups";

type BoardToolsPanelProps = {
  backgrounds: string[];
  board: Board | null;
  initialView: BoardToolsView;
  isOpen: boolean;
  isStarred: boolean;
  onClose: () => void;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onShareBoard: () => void;
  onToggleStar: () => void;
  onUpdateBoard: (boardId: string, payload: { title?: string; background?: string }) => Promise<void>;
};

const POWER_UPS = [
  {
    title: "Planner",
    description: "See due dates and unscheduled work in the planner view.",
  },
  {
    title: "Inbox",
    description: "Review recent comments and activity without opening each card.",
  },
  {
    title: "Attachments",
    description: "Upload files, manage cover images, and download attachments from cards.",
  },
  {
    title: "Filters",
    description: "Search by title and narrow cards by due date, label, or assignee.",
  },
];

export function BoardToolsPanel({
  backgrounds,
  board,
  initialView,
  isOpen,
  isStarred,
  onClose,
  onDeleteBoard,
  onShareBoard,
  onToggleStar,
  onUpdateBoard,
}: BoardToolsPanelProps) {
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(backgrounds[0] ?? "ocean");
  const [view, setView] = useState<BoardToolsView>(initialView);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!board) {
      return;
    }

    setTitle(board.title);
    setBackground(board.background);
  }, [board?.background, board?.id, board?.title]);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [initialView, isOpen]);

  if (!isOpen || !board) {
    return null;
  }

  const activeBoard = board;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const nextTitle = trimmedTitle && trimmedTitle !== activeBoard.title ? trimmedTitle : undefined;
    const nextBackground = background !== activeBoard.background ? background : undefined;

    if (!nextTitle && !nextBackground) {
      onClose();
      return;
    }

    setIsSaving(true);

    try {
      await onUpdateBoard(activeBoard.id, {
        title: nextTitle,
        background: nextBackground,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="utility-backdrop" onClick={onClose} role="presentation">
      <aside className="utility-panel utility-panel--wide" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="utility-panel__header">
          <div>
            <p className="workspace-view__eyebrow">Board tools</p>
            <h2>{activeBoard.title}</h2>
          </div>
          <button className="ghost-button" onClick={onClose} type="button" aria-label="Close board tools">
            Close
          </button>
        </div>

        <div className="utility-tabs">
          <button className={`board-picker-tab ${view === "overview" ? "is-active" : ""}`} onClick={() => setView("overview")} type="button">
            Overview
          </button>
          <button className={`board-picker-tab ${view === "members" ? "is-active" : ""}`} onClick={() => setView("members")} type="button">
            Members
          </button>
          <button className={`board-picker-tab ${view === "powerups" ? "is-active" : ""}`} onClick={() => setView("powerups")} type="button">
            Power-Ups
          </button>
        </div>

        {view === "overview" ? (
          <form className="utility-stack" onSubmit={handleSave}>
            <label className="field">
              <span>Board title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <div className="field">
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
            </div>

            <div className="workspace-summary-grid">
              <article className="workspace-summary-card">
                <span>Lists</span>
                <strong>{activeBoard.lists.length}</strong>
              </article>
              <article className="workspace-summary-card">
                <span>Cards</span>
                <strong>{activeBoard.lists.reduce((total, list) => total + list.cards.length, 0)}</strong>
              </article>
              <article className="workspace-summary-card">
                <span>Members</span>
                <strong>{activeBoard.members.length}</strong>
              </article>
              <article className="workspace-summary-card">
                <span>Labels</span>
                <strong>{activeBoard.labels.length}</strong>
              </article>
            </div>

            <div className="utility-actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save board changes"}
              </button>
              <button className="ghost-button" onClick={onShareBoard} type="button">
                Share board link
              </button>
              <button className="ghost-button" onClick={onToggleStar} type="button">
                {isStarred ? "Remove star" : "Star board"}
              </button>
              <button className="danger-button" onClick={() => void onDeleteBoard(activeBoard.id)} type="button">
                Delete board
              </button>
            </div>
          </form>
        ) : null}

        {view === "members" ? (
          <div className="utility-stack">
            <div className="workspace-card">
              <div className="workspace-card__header">
                <h3>Board members</h3>
                <span>{activeBoard.members.length}</span>
              </div>
              <div className="utility-list">
                {activeBoard.members.map((member) => (
                  <div className="utility-list-item" key={member.id}>
                    <span className="avatar-chip" style={{ backgroundColor: member.color }}>
                      {member.avatar}
                    </span>
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.role ?? "member"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {view === "powerups" ? (
          <div className="utility-stack">
            {POWER_UPS.map((powerUp) => (
              <article className="workspace-card" key={powerUp.title}>
                <div className="workspace-card__header">
                  <h3>{powerUp.title}</h3>
                  <span>Enabled</span>
                </div>
                <p>{powerUp.description}</p>
              </article>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  );
}