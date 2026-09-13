import { useState } from "react";
import type { Board, Card } from "../types";

type Props = {
  board: Board;
  onOpenCard: (cardId: string) => void;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ board, onOpenCard }: Props) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Collect all cards across all non-archived lists
  const allCards: (Card & { listTitle: string })[] = board.lists.flatMap((list) =>
    list.cards
      .filter((card) => !card.isArchived)
      .map((card) => ({ ...card, listTitle: list.title }))
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  // Calendar cells
  const calendarCells: {
    day: number;
    monthOffset: number; // -1 = prev, 0 = current, 1 = next
    dateKey: string;
    isToday: boolean;
  }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    calendarCells.push({
      day,
      monthOffset: -1,
      dateKey: d.toISOString().split("T")[0],
      isToday: isSameDay(d, new Date()),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarCells.push({
      day,
      monthOffset: 0,
      dateKey: d.toISOString().split("T")[0],
      isToday: isSameDay(d, new Date()),
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(year, month + 1, day);
    calendarCells.push({
      day,
      monthOffset: 1,
      dateKey: d.toISOString().split("T")[0],
      isToday: isSameDay(d, new Date()),
    });
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Cards with due dates
  const cardsWithDueDates = allCards.filter((c) => !!c.dueDate);
  const unscheduledCount = allCards.length - cardsWithDueDates.length;

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-header__left">
          <h2 className="calendar-title">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="calendar-nav-buttons">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              type="button"
              className="calendar-nav-btn calendar-nav-btn--today"
              onClick={handleToday}
            >
              Today
            </button>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <div className="calendar-header__stats">
          <span className="calendar-stat-pill">
            📅 {cardsWithDueDates.length} scheduled cards
          </span>
          {unscheduledCount > 0 && (
            <span className="calendar-stat-pill calendar-stat-pill--muted">
              ⏳ {unscheduledCount} unscheduled
            </span>
          )}
        </div>
      </div>

      <div className="calendar-grid-wrapper">
        <div className="calendar-weekdays">
          {WEEKDAYS.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {calendarCells.map((cell, idx) => {
            // Cards on this date
            const dayCards = allCards.filter((card) => {
              if (!card.dueDate) return false;
              const cardDateStr = new Date(card.dueDate).toISOString().split("T")[0];
              return cardDateStr === cell.dateKey;
            });

            return (
              <div
                key={idx}
                className={`calendar-cell ${
                  cell.monthOffset !== 0 ? "is-outside-month" : ""
                } ${cell.isToday ? "is-today" : ""}`}
              >
                <div className="calendar-cell__header">
                  <span className={`calendar-day-number ${cell.isToday ? "today-badge" : ""}`}>
                    {cell.day}
                  </span>
                  {dayCards.length > 0 && (
                    <span className="calendar-cell__count">{dayCards.length}</span>
                  )}
                </div>

                <div className="calendar-cell__cards">
                  {dayCards.map((card) => {
                    const isOverdue =
                      new Date(card.dueDate!).getTime() < Date.now() && !card.isComplete;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        className={`calendar-card-chip ${
                          card.isComplete ? "is-complete" : ""
                        } ${isOverdue ? "is-overdue" : ""}`}
                        onClick={() => onOpenCard(card.id)}
                        title={`${card.title} (${card.listTitle})`}
                      >
                        <span className="calendar-card-chip__status-dot" />
                        <span className="calendar-card-chip__title">{card.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
