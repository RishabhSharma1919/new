import type { Board } from "../types";

type InboxViewProps = {
  board: Board | null;
  onOpenBoard: () => void;
  onOpenCard: (cardId: string) => void;
};

type FeedEntry = {
  id: string;
  actorName: string | null;
  cardId: string;
  cardTitle: string;
  createdAt: string;
  kind: "activity" | "comment";
  listTitle: string;
  message: string;
};

export function InboxView({ board, onOpenBoard, onOpenCard }: InboxViewProps) {
  const entries = board
    ? board.lists
        .flatMap((list) =>
          list.cards.flatMap((card) => [
            ...card.comments.map<FeedEntry>((comment) => ({
              id: comment.id,
              actorName: comment.actorName,
              cardId: card.id,
              cardTitle: card.title,
              createdAt: comment.createdAt,
              kind: "comment",
              listTitle: list.title,
              message: comment.message,
            })),
            ...card.activity.map<FeedEntry>((activity) => ({
              id: activity.id,
              actorName: activity.actorName,
              cardId: card.id,
              cardTitle: card.title,
              createdAt: activity.createdAt,
              kind: "activity",
              listTitle: list.title,
              message: activity.message,
            })),
          ]),
        )
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    : [];

  if (!board) {
    return (
      <div className="workspace-empty-state">
        <h2>No board selected</h2>
        <p>Select a board to review card updates, comments, and recent activity.</p>
      </div>
    );
  }

  return (
    <section className="workspace-view">
      <div className="workspace-view__hero">
        <div>
          <p className="workspace-view__eyebrow">Inbox</p>
          <h1>{board.title}</h1>
          <p>Review the most recent comments and activity across the current board.</p>
        </div>
        <button className="primary-button" onClick={onOpenBoard} type="button">
          Open board
        </button>
      </div>

      <section className="workspace-card">
        <div className="workspace-card__header">
          <h2>Recent updates</h2>
          <span>{entries.length}</span>
        </div>

        <div className="workspace-feed">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <button className="workspace-feed-item" key={`${entry.kind}-${entry.id}`} onClick={() => onOpenCard(entry.cardId)} type="button">
                <div className="workspace-feed-item__meta">
                  <span className={`workspace-tag ${entry.kind === "comment" ? "is-primary" : ""}`}>
                    {entry.kind === "comment" ? "Comment" : "Activity"}
                  </span>
                  <small>{new Date(entry.createdAt).toLocaleString()}</small>
                </div>
                <strong>{entry.actorName ?? "Someone"}</strong>
                <p>{entry.message}</p>
                <span>
                  {entry.cardTitle} in {entry.listTitle}
                </span>
              </button>
            ))
          ) : (
            <p className="workspace-list__empty">No comments or activity yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
