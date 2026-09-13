import React, { useState, useRef, useEffect } from "react";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  color: string;
  description?: string;
  memberCount: number;
};

export const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: "ws-engineering",
    name: "Engineering Corp",
    slug: "engineering",
    color: "#0c66e4",
    description: "Core product development, bug tracking, and release sprints.",
    memberCount: 5,
  },
  {
    id: "ws-design",
    name: "Design Studio",
    slug: "design",
    color: "#8247e5",
    description: "UI/UX prototypes, branding guidelines, and design systems.",
    memberCount: 3,
  },
  {
    id: "ws-marketing",
    name: "Growth & Marketing",
    slug: "marketing",
    color: "#1f845a",
    description: "Campaigns, content calendar, and product launch roadmaps.",
    memberCount: 4,
  },
];

type Props = {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (name: string, color: string, description?: string) => void;
};

const WORKSPACE_COLORS = [
  "#0c66e4", // Blue
  "#8247e5", // Purple
  "#1f845a", // Green
  "#e56910", // Orange
  "#e53935", // Red
  "#0891b2", // Cyan
  "#475569", // Slate
];

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(WORKSPACE_COLORS[0]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? DEFAULT_WORKSPACES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateWorkspace(newName.trim(), newColor, newDesc.trim());
    setNewName("");
    setNewDesc("");
    setIsModalOpen(false);
    setIsOpen(false);
  }

  return (
    <div className="workspace-switcher-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="workspace-switcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Switch organization"
      >
        <span
          className="workspace-badge"
          style={{ backgroundColor: activeWorkspace.color }}
        >
          {activeWorkspace.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="workspace-label-col">
          <span className="workspace-eyebrow">Workspace</span>
          <span className="workspace-active-title">{activeWorkspace.name}</span>
        </div>
        <svg
          className={`workspace-chevron ${isOpen ? "is-open" : ""}`}
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-dropdown__header">
            <span className="workspace-dropdown__title">Workspaces</span>
            <span className="workspace-dropdown__count">{workspaces.length} teams</span>
          </div>

          <div className="workspace-dropdown__list">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspace.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  className={`workspace-item ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                >
                  <span
                    className="workspace-badge workspace-badge--item"
                    style={{ backgroundColor: ws.color }}
                  >
                    {ws.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="workspace-item__info">
                    <strong className="workspace-item__name">{ws.name}</strong>
                    <span className="workspace-item__desc">
                      {ws.description || `${ws.memberCount} members`}
                    </span>
                  </div>
                  {isActive && (
                    <svg
                      className="workspace-active-check"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="workspace-dropdown__footer">
            <button
              type="button"
              className="workspace-create-trigger"
              onClick={() => {
                setIsModalOpen(true);
                setIsOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
              </svg>
              <span>Create new workspace</span>
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="workspace-modal-overlay">
          <div className="workspace-modal-card">
            <div className="workspace-modal__header">
              <h3>Create Workspace</h3>
              <button
                type="button"
                className="workspace-modal__close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="workspace-modal__form">
              <label className="workspace-field">
                <span>Workspace Name</span>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </label>

              <label className="workspace-field">
                <span>Description (optional)</span>
                <textarea
                  placeholder="What is this workspace for?"
                  value={newDesc}
                  rows={2}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </label>

              <div className="workspace-field">
                <span>Accent Color</span>
                <div className="workspace-color-picker">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`workspace-color-dot ${newColor === color ? "is-selected" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div className="workspace-modal__actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!newName.trim()}
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
