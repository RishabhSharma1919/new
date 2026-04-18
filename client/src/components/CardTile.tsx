import type { Card } from "../types";
import { formatDueDate, getChecklistStats, isOverdue } from "../lib/utils";

type CardTileProps = {
  card: Card;
  onOpen: (cardId: string) => void;
  isDragging?: boolean;
};

export function CardTile({ card, onOpen, isDragging }: CardTileProps) {
  const checklistStats = getChecklistStats(card);
  const overdue = isOverdue(card.dueDate);

  function handleOpen() {
    onOpen(card.id);
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

      <strong className="card-tile__title">{card.title}</strong>

      <div className="card-tile__footer">
        <div className="card-tile__badges">
          {card.dueDate ? (
            <div className={`badge badge--due ${overdue ? "is-overdue" : ""}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>{formatDueDate(card.dueDate)}</span>
            </div>
          ) : null}

          {card.description ? (
            <div className="badge" title="This card has a description.">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
            </div>
          ) : null}

          {card.comments.length > 0 ? (
            <div className="badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>{card.comments.length}</span>
            </div>
          ) : null}

          {card.attachments.length > 0 ? (
            <div className="badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <span>{card.attachments.length}</span>
            </div>
          ) : null}

          {checklistStats.total > 0 ? (
            <div className={`badge badge--checklist ${checklistStats.completed === checklistStats.total ? "is-complete" : ""}`}>
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