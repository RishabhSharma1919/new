import { type FormEvent, useEffect, useState } from "react";
import type { Board } from "../types";
import { api } from "../lib/api";

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
  onInviteMember: (boardId: string, payload: { email: string; name?: string }) => Promise<void>;
  onExportMarkdown?: () => void;
  onExportJson?: () => void;
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
    title: "Filters & Priorities",
    description: "Search by title and narrow cards by due date, priority, label, or assignee.",
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
  onInviteMember,
  onExportMarkdown,
  onExportJson,
}: BoardToolsPanelProps) {
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState(backgrounds[0] ?? "ocean");
  const [view, setView] = useState<BoardToolsView>(initialView);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleGenerateInvite() {
    if (!board?.id) return;
    try {
      const res = await api.generateInviteCode(board.id);
      setInviteLink(`${window.location.origin}/#invite=${res.inviteCode}`);
      setInviteMessage(null);
    } catch (err: any) {
      setInviteMessage(err.message || "Failed to generate invite link. Ensure you are a board admin.");
    }
  }

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

  async function invite(event: FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await onInviteMember(activeBoard.id, { email: inviteEmail.trim() });
      setInviteMessage(`Invitation recorded for ${inviteEmail.trim()}`);
      setInviteEmail("");
    } catch {
      setInviteMessage("Failed to invite member.");
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setIsSaving(true);
    try {
      await onUpdateBoard(activeBoard.id, { title: nextTitle, background });
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
            Power-Ups & Exports
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
              {onExportMarkdown && (
                <button className="ghost-button" onClick={onExportMarkdown} type="button">
                  Export Markdown
                </button>
              )}
              {onExportJson && (
                <button className="ghost-button" onClick={onExportJson} type="button">
                  Export JSON
                </button>
              )}
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
            <form className="workspace-card invite-form" onSubmit={invite}>
              <div className="workspace-card__header"><h3>Invite to workspace</h3><span>Live access</span></div>
              <p>Invite a teammate by email. They can create an account with that email to join.</p>
              <div className="invite-form__row"><input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="teammate@company.com" /><button className="primary-button" type="submit">Invite</button></div>
              {inviteMessage ? <p className="invite-form__message">{inviteMessage}</p> : null}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <p style={{ marginBottom: "0.5rem" }}>Or share an invite link (Admins only):</p>
                {inviteLink ? (
                  <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)" }} />
                ) : (
                  <button type="button" className="ghost-button" onClick={handleGenerateInvite}>Generate Invite Link</button>
                )}
              </div>
            </form>
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
            <article className="workspace-card">
              <div className="workspace-card__header">
                <h3>Export & Backup</h3>
                <span>Tools</span>
              </div>
              <p>Download your complete project board in standard formats for reports or backups.</p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                {onExportMarkdown && (
                  <button className="ghost-button" onClick={onExportMarkdown} type="button">
                    Download .md Report
                  </button>
                )}
                {onExportJson && (
                  <button className="ghost-button" onClick={onExportJson} type="button">
                    Download .json Backup
                  </button>
                )}
              </div>
            </article>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
