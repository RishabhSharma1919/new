import React, { useEffect, useMemo, useState } from "react";
import type { Board, BoardSummary, Card } from "../types";
import { cleanCardTitle, getCardPriority } from "../lib/utils";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  boards: BoardSummary[];
  currentBoard: Board | null;
  onSelectBoard: (boardId: string) => void;
  onOpenCard: (cardId: string) => void;
  onToggleTheme: () => void;
  currentTheme: string;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onToggleFilter: () => void;
};

export function CommandPalette({
  isOpen,
  onClose,
  boards,
  currentBoard,
  onSelectBoard,
  onOpenCard,
  onToggleTheme,
  currentTheme,
  onExportMarkdown,
  onExportJson,
  onToggleFilter,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const allCards = useMemo(() => {
    if (!currentBoard) return [];
    const list: Array<{ card: Card; listTitle: string }> = [];
    for (const l of currentBoard.lists) {
      for (const c of l.cards) {
        list.push({ card: c, listTitle: l.title });
      }
    }
    return list;
  }, [currentBoard]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const actions = [
      {
        id: "theme",
        type: "action" as const,
        title: `Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`,
        subtitle: "Toggle visual theme",
        icon: currentTheme === "dark" ? "☀️" : "🌙",
        run: onToggleTheme,
      },
      {
        id: "export-md",
        type: "action" as const,
        title: "Export Board to Markdown",
        subtitle: "Download summary report",
        icon: "📝",
        run: onExportMarkdown,
      },
      {
        id: "export-json",
        type: "action" as const,
        title: "Export Board to JSON",
        subtitle: "Full data backup",
        icon: "💾",
        run: onExportJson,
      },
      {
        id: "filter",
        type: "action" as const,
        title: "Toggle Search & Filters",
        subtitle: "Filter cards by member, label, or due date",
        icon: "🔍",
        run: onToggleFilter,
      },
    ].filter((a) => !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));

    const matchedBoards = boards
      .filter((b) => !q || b.title.toLowerCase().includes(q))
      .map((b) => ({
        id: `board-${b.id}`,
        type: "board" as const,
        title: `Go to Board: ${b.title}`,
        subtitle: `${b.listCount} lists · ${b.cardCount} cards`,
        icon: "📋",
        run: () => onSelectBoard(b.id),
      }));

    const matchedCards = allCards
      .filter(
        ({ card, listTitle }) =>
          !q ||
          card.title.toLowerCase().includes(q) ||
          card.description.toLowerCase().includes(q) ||
          listTitle.toLowerCase().includes(q),
      )
      .slice(0, 10)
      .map(({ card, listTitle }) => {
        const priority = getCardPriority(card);
        const prioTag = priority ? ` [${priority.toUpperCase()}]` : "";
        return {
          id: `card-${card.id}`,
          type: "card" as const,
          title: cleanCardTitle(card.title) + prioTag,
          subtitle: `in ${listTitle}${card.isComplete ? " · Completed" : ""}`,
          icon: card.isComplete ? "✅" : "🗂️",
          run: () => onOpenCard(card.id),
        };
      });

    return [...actions, ...matchedBoards, ...matchedCards];
  }, [query, currentTheme, boards, allCards, onToggleTheme, onExportMarkdown, onExportJson, onToggleFilter, onSelectBoard, onOpenCard]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  if (!isOpen) return null;

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-modal" onClick={(e) => e.stopPropagation()}>
        <div className="palette-header">
          <span className="palette-icon">⚡</span>
          <input
            autoFocus
            className="palette-input"
            placeholder="Type a command or search cards and boards... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onClose();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
              } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
                e.preventDefault();
                filteredItems[selectedIndex].run();
                onClose();
              }
            }}
          />
          <kbd className="palette-kbd">ESC</kbd>
        </div>

        <div className="palette-results">
          {filteredItems.length === 0 ? (
            <div className="palette-empty">No matching commands or items found</div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`palette-item ${index === selectedIndex ? "is-active" : ""}`}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="palette-item__icon">{item.icon}</span>
                <div className="palette-item__content">
                  <div className="palette-item__title">{item.title}</div>
                  <div className="palette-item__subtitle">{item.subtitle}</div>
                </div>
                {index === selectedIndex && <span className="palette-item__action">Select ↵</span>}
              </div>
            ))
          )}
        </div>

        <div className="palette-footer">
          <span>
            Navigate with <kbd>↑</kbd> <kbd>↓</kbd>
          </span>
          <span>
            Select with <kbd>↵</kbd>
          </span>
          <span>
            Open anytime with <kbd>Ctrl</kbd> + <kbd>K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
