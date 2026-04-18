import { type FormEvent, type ReactNode, useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import type { BoardList } from "../types";
import { CardTile } from "./CardTile";

type ListColumnProps = {
  dragDisabled: boolean;
  index: number;
  list: BoardList;
  onAddCard: (listId: string, title: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onOpenCard: (cardId: string) => void;
  onRenameList: (listId: string, title: string) => Promise<void>;
};

export function ListColumn({
  dragDisabled,
  index,
  list,
  onAddCard,
  onDeleteList,
  onOpenCard,
  onRenameList,
}: ListColumnProps) {
  const themeClass = LIST_THEME_CLASSES[index % LIST_THEME_CLASSES.length];
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(list.title);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  async function handleRenameList() {
    const trimmed = draftTitle.trim();

    if (!trimmed || trimmed === list.title) {
      setDraftTitle(list.title);
      setIsEditingTitle(false);
      return;
    }

    await onRenameList(list.id, trimmed);
    setIsEditingTitle(false);
  }

  async function handleAddCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newCardTitle.trim();

    if (!trimmed) {
      return;
    }

    await onAddCard(list.id, trimmed);
    setNewCardTitle("");
    setIsAddingCard(false);
  }

  return (
    <Draggable draggableId={list.id.toString()} index={index} isDragDisabled={dragDisabled}>
      {(provided, snapshot) => (
        <section
          className={`list-column ${themeClass} ${snapshot.isDragging ? "is-dragging" : ""} ${
            isCollapsed ? "is-collapsed" : ""
          }`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          {isCollapsed ? (
            <div className="list-column__collapsed-header" {...provided.dragHandleProps}>
              <button
                className="list-column__collapsed-expand"
                onClick={() => setIsCollapsed(false)}
                type="button"
                aria-label="Expand list"
                title="Expand list"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12h20 M5 9l-3 3 3 3 M19 9l3 3-3 3" />
                </svg>
              </button>
              <div className="list-column__collapsed-title">{list.title}</div>
              <div className="list-column__collapsed-count">{list.cards.length}</div>
            </div>
          ) : (
            <div className="list-column__header" {...provided.dragHandleProps}>
              <div className="list-column__heading">
                <div className="drag-handle">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>

                {isEditingTitle ? (
                  <input
                    autoFocus
                    className="list-title-input"
                    value={draftTitle}
                    onBlur={() => void handleRenameList()}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void handleRenameList();
                      }
                      if (event.key === "Escape") {
                        setDraftTitle(list.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                ) : (
                  <button className="list-title-button" onClick={() => setIsEditingTitle(true)} type="button">
                    {list.title}
                  </button>
                )}
              </div>

              <div className="list-column__actions">
                <button
                  className="list-column__menu"
                  onClick={() => setIsCollapsed(true)}
                  type="button"
                  aria-label="Collapse list"
                  title="Collapse list"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12h6 M7 9l3 3-3 3 M20 12h-6 M17 9l-3 3 3 3" />
                  </svg>
                </button>
                <button
                  className="list-column__menu"
                  onClick={() => void onDeleteList(list.id)}
                  type="button"
                  aria-label="Delete list"
                  title="Delete list"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M6.5 12h.01M12 12h.01M17.5 12h.01"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.9"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: isCollapsed ? "none" : "block" }}>
            <Droppable droppableId={list.id.toString()} type="CARD" isDropDisabled={dragDisabled || isCollapsed}>
              {(droppableProvided, droppableSnapshot) => (
                <div
                  className={`list-column__cards ${droppableSnapshot.isDraggingOver ? "is-over" : ""}`}
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {list.cards.map((card, cardIndex) => (
                    <Draggable key={card.id} draggableId={card.id} index={cardIndex} isDragDisabled={dragDisabled}>
                      {(cardProvided, cardSnapshot) => {
                        const cardNode = (
                          <div
                            ref={cardProvided.innerRef}
                            {...cardProvided.draggableProps}
                            {...cardProvided.dragHandleProps}
                            className="draggable-card"
                          >
                            <CardTile card={card} onOpen={onOpenCard} isDragging={cardSnapshot.isDragging} />
                          </div>
                        );

                        return cardSnapshot.isDragging ? createDragPortal(cardNode) : cardNode;
                      }}
                    </Draggable>
                  ))}

                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>

            {isAddingCard ? (
              <form className="new-card-form" onSubmit={handleAddCard}>
                <textarea
                  autoFocus
                  placeholder="Enter a title for this card..."
                  rows={3}
                  value={newCardTitle}
                  onChange={(event) => setNewCardTitle(event.target.value)}
                />
                <div className="new-card-form__actions">
                  <button className="primary-button" type="submit">
                    Add card
                  </button>
                  <button className="ghost-button" onClick={() => setIsAddingCard(false)} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="list-column__footer-button" onClick={() => setIsAddingCard(true)} type="button">
                <span>+</span> Add a card
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M8 8h8v8M16 8 8 16"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
              </button>
            )}
          </div>
        </section>
      )}
    </Draggable>
  );
}

function createDragPortal(node: ReactNode) {
  if (typeof document === "undefined") {
    return node;
  }

  return createPortal(node, document.body);
}

const LIST_THEME_CLASSES = ["list-column--gold", "list-column--green", "list-column--olive", "list-column--plum"];
