import { formatDueDate, isDueSoon, isOverdue } from "../lib/utils";
import type { Board } from "../types";

type PlannerViewProps = {
  board: Board | null;
  onOpenBoard: () => void;
  onOpenCard: (cardId: string) => void;
};

type PlannedCard = {
  id: string;
  title: string;
  dueDate: string | null;
  listTitle: string;
};

export function PlannerView({ board, onOpenBoard, onOpenCard }: PlannerViewProps) {
  const cards = board
    ? board.lists.flatMap((list) =>
        list.cards.map((card) => ({
          id: card.id,
          title: card.title,
          dueDate: card.dueDate,
          listTitle: list.title,
        })),
      )
    : [];

  const overdueCards = cards
    .filter((card) => card.dueDate && isOverdue(card.dueDate))
    .sort((left, right) => new Date(left.dueDate ?? 0).getTime() - new Date(right.dueDate ?? 0).getTime());
  const upcomingCards = cards
    .filter((card) => card.dueDate && !isOverdue(card.dueDate))
    .sort((left, right) => new Date(left.dueDate ?? 0).getTime() - new Date(right.dueDate ?? 0).getTime());
  const dueSoonCount = upcomingCards.filter((card) => isDueSoon(card.dueDate)).length;
  const noDateCards = cards.filter((card) => !card.dueDate);

  if (!board) {
    return (
      <div className="workspace-empty-state">
        <h2>No board selected</h2>
        <p>Open a board to see due dates and upcoming work in the planner.</p>
      </div>
    );
  }

  return (
    <section className="workspace-view">
      <div className="workspace-view__hero">
        <div>
          <p className="workspace-view__eyebrow">Planner</p>
          <h1>{board.title}</h1>
          <p>Track overdue work, near-term due dates, and cards that still need scheduling.</p>
        </div>
        <button className="primary-button" onClick={onOpenBoard} type="button">
          Open board
        </button>
      </div>

      <div className="workspace-summary-grid">
        <article className="workspace-summary-card is-danger">
          <span>Overdue</span>
          <strong>{overdueCards.length}</strong>
        </article>
        <article className="workspace-summary-card is-primary">
          <span>Due soon</span>
          <strong>{dueSoonCount}</strong>
        </article>
        <article className="workspace-summary-card">
          <span>Scheduled</span>
          <strong>{cards.length - noDateCards.length}</strong>
        </article>
        <article className="workspace-summary-card">
          <span>No date</span>
          <strong>{noDateCards.length}</strong>
        </article>
      </div>

      <div className="workspace-columns">
        <PlannerSection
          cards={overdueCards}
          emptyCopy="Nothing is overdue right now."
          onOpenCard={onOpenCard}
          title="Needs attention"
        />
        <PlannerSection
          cards={upcomingCards}
          emptyCopy="No scheduled cards yet."
          onOpenCard={onOpenCard}
          title="Upcoming"
        />
        <PlannerSection
          cards={noDateCards}
          emptyCopy="Every visible card already has a due date."
          onOpenCard={onOpenCard}
          title="Still unscheduled"
        />
      </div>
    </section>
  );
}

type PlannerSectionProps = {
  cards: PlannedCard[];
  emptyCopy: string;
  onOpenCard: (cardId: string) => void;
  title: string;
};

function PlannerSection({ cards, emptyCopy, onOpenCard, title }: PlannerSectionProps) {
  return (
    <section className="workspace-card">
      <div className="workspace-card__header">
        <h2>{title}</h2>
        <span>{cards.length}</span>
      </div>

      <div className="workspace-list">
        {cards.length > 0 ? (
          cards.map((card) => (
            <button className="workspace-list-item" key={card.id} onClick={() => onOpenCard(card.id)} type="button">
              <strong>{card.title}</strong>
              <p>{card.listTitle}</p>
              <span>{formatDueDate(card.dueDate)}</span>
            </button>
          ))
        ) : (
          <p className="workspace-list__empty">{emptyCopy}</p>
        )}
      </div>
    </section>
  );
}
