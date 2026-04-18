import type { Card } from "../types";
import { formatDueDate, getChecklistStats, isOverdue } from "../lib/utils";

type CardTileProps = {
  card: Card;
  onOpen: (cardId: string) => void;
  isDragging?: boolean;
  onToggleComplete?: (cardId: string, isComplete: boolean) => void;
};

export function CardTile({ card, onOpen, isDragging, onToggleComplete }: CardTileProps) {
  const checklistStats = getChecklistStats(card);
  const overdue = isOverdue(card.dueDate);

  function handleOpen() {
    onOpen(card.id);
  }

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(card.id, !card.isComplete);
    }
  }

  return (
    <div
      className={`card-tile ${isDragging ? "is-dragging" : ""}`}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {card.coverImage ? <img className="card-tile__cover" src={card.coverImage} alt={`${card.title} cover`} /> : null}

      <div className="card-tile__top">
        <div className="card-tile__labels">
          {card.labels.map((label) => (
            <span key={label.id} className="card-label" style={{ backgroundColor: label.color }} title={`Color: ${label.color}, title: ${label.name || "none"}`}>
              {label.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card-tile__title-row">
        {onToggleComplete && (
          <button 
            type="button"
            className={`card-tile__complete-btn ${card.isComplete ? "is-completed" : ""}`}
            onClick={handleComplete}
            title={card.isComplete ? "Mark uncompleted" : "Mark completed"}
            aria-label={card.isComplete ? "Mark uncompleted" : "Mark completed"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
        )}
        <strong className={`card-tile__title ${card.isComplete ? "is-completed" : ""}`}>{card.title}</strong>
      </div>

      <div className="card-tile__footer">
        <div className="card-tile__badges">
          {card.dueDate ? (
            <div className={`due-badge ${card.isComplete ? "is-completed" : overdue ? "is-overdue" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>{formatDueDate(card.dueDate)}</span>
            </div>
          ) : null}

          {checklistStats.total > 0 ? (
            <div className={`checklist-badge ${checklistStats.completed === checklistStats.total ? "is-complete" : ""}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
              <span>{checklistStats.completed}/{checklistStats.total}</span>
            </div>
          ) : null}
        </div>

        <div className="card-members">
          {card.members.map((member, i) => (
            <div 
              key={member.id} 
              className="card-member" 
              style={{ backgroundColor: member.color, zIndex: card.members.length - i }}
              title={member.name}
            >
              {member.avatar}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}