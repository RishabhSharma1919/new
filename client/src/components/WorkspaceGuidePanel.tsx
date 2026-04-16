type WorkspaceGuidePanelProps = {
  isOpen: boolean;
  mode: "guide" | "updates";
  onClose: () => void;
  onMinimize: () => void;
  onOpenBoards: () => void;
  onOpenInbox: () => void;
  onOpenPlanner: () => void;
};

const GUIDE_ITEMS = [
  "Use the launcher to jump back to the workspace home screen.",
  "Open the board picker from the board title or the Search field.",
  "Use Inbox for comments and activity, and Planner for due dates.",
  "Open any card to manage labels, members, checklists, files, and comments.",
];

const UPDATE_ITEMS = [
  "Navigation buttons now route into working product views instead of acting as placeholders.",
  "Board actions support starring, sharing, power-up details, and member overview.",
  "Card quick actions now jump to real sections inside the modal.",
];

export function WorkspaceGuidePanel({
  isOpen,
  mode,
  onClose,
  onMinimize,
  onOpenBoards,
  onOpenInbox,
  onOpenPlanner,
}: WorkspaceGuidePanelProps) {
  if (!isOpen) {
    return null;
  }

  const title = mode === "guide" ? "Starter guide" : "What changed";
  const items = mode === "guide" ? GUIDE_ITEMS : UPDATE_ITEMS;

  return (
    <div className="utility-backdrop" onClick={onClose} role="presentation">
      <aside className="utility-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="utility-panel__header">
          <div>
            <p className="workspace-view__eyebrow">{mode === "guide" ? "Guide" : "Updates"}</p>
            <h2>{title}</h2>
          </div>
          <div className="utility-panel__controls">
            {mode === "guide" ? (
              <button
                className="icon-button utility-panel__minimize"
                onClick={onMinimize}
                type="button"
                aria-label="Minimize starter guide"
              >
                <span aria-hidden="true">-</span>
              </button>
            ) : null}
            <button className="ghost-button" onClick={onClose} type="button" aria-label="Close guide">
              Close
            </button>
          </div>
        </div>

        <div className="utility-stack">
          <div className="workspace-card">
            <div className="workspace-card__header">
              <h3>{mode === "guide" ? "Quick ways to move around" : "Recent improvements"}</h3>
            </div>
            <div className="utility-bullets">
              {items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="utility-actions">
            <button className="primary-button" onClick={onOpenBoards} type="button">
              Switch boards
            </button>
            <button className="ghost-button" onClick={onOpenInbox} type="button">
              Open inbox
            </button>
            <button className="ghost-button" onClick={onOpenPlanner} type="button">
              Open planner
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
