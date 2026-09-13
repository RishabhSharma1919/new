import { useState, useRef, useEffect } from "react";
import type { Board } from "../types";

export type NotificationItem = {
  id: string;
  cardId?: string;
  title: string;
  description: string;
  actorName: string;
  createdAt: string;
  isRead: boolean;
  type: "comment" | "assignment" | "due" | "update";
};

type Props = {
  board?: Board | null;
  onOpenCard?: (cardId: string) => void;
};

export function NotificationCenter({ board, onOpenCard }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Generate notifications from recent card activities and comments
  const notifications: NotificationItem[] = [];

  if (board) {
    board.lists.forEach((list) => {
      list.cards.forEach((card) => {
        // Comments
        card.comments.forEach((comment) => {
          notifications.push({
            id: `notif-comment-${comment.id}`,
            cardId: card.id,
            title: `New comment on "${card.title}"`,
            description: comment.message,
            actorName: comment.actorName || "Team Member",
            createdAt: comment.createdAt,
            isRead: readIds.has(`notif-comment-${comment.id}`),
            type: "comment",
          });
        });

        // Due soon
        if (card.dueDate && !card.isComplete) {
          const diffHours = (new Date(card.dueDate).getTime() - Date.now()) / (1000 * 3600);
          if (diffHours > 0 && diffHours <= 48) {
            notifications.push({
              id: `notif-due-${card.id}`,
              cardId: card.id,
              title: `Approaching deadline: "${card.title}"`,
              description: `Due on ${new Date(card.dueDate).toLocaleDateString()}`,
              actorName: "System Scheduler",
              createdAt: card.updatedAt,
              isRead: readIds.has(`notif-due-${card.id}`),
              type: "due",
            });
          }
        }
      });
    });
  }

  // Sort by newest
  notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handleMarkAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  function handleNotificationClick(item: NotificationItem) {
    setReadIds((prev) => new Set([...prev, item.id]));
    if (item.cardId && onOpenCard) {
      onOpenCard(item.cardId);
      setIsOpen(false);
    }
  }

  return (
    <div className="notification-center-wrapper" ref={popoverRef}>
      <button
        type="button"
        className="nav-icon-button notification-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge-pulse">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover">
          <div className="notification-popover__header">
            <div className="notification-popover__title-row">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notification-unread-tag">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="ghost-button ghost-button--small"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-popover__list">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notification-item ${item.isRead ? "is-read" : "is-unread"}`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notification-item__icon">
                    {item.type === "comment" && "💬"}
                    {item.type === "due" && "⏰"}
                    {item.type === "assignment" && "👤"}
                    {item.type === "update" && "⚡"}
                  </div>
                  <div className="notification-item__content">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                    <small>
                      {item.actorName} • {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </div>
                  {!item.isRead && <span className="notification-unread-dot" />}
                </button>
              ))
            ) : (
              <div className="notification-empty">
                <span style={{ fontSize: "1.8rem" }}>🎉</span>
                <strong>All caught up!</strong>
                <p>No new notifications or unread activities.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
