import { type FormEvent, useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import useSWR, { useSWRConfig } from "swr";
import { api, fetcher, type BoardsPayload } from "./lib/api";
import { countVisibleCards, filterBoard } from "./lib/utils";
import type { Board, BoardResponse, FilterState } from "./types";
import { BoardHeader } from "./components/BoardHeader";
import { BoardHome } from "./components/BoardHome";
import { BoardSidebar } from "./components/BoardSidebar";
import { BoardToolsPanel, type BoardToolsView } from "./components/BoardToolsPanel";
import { CardModal } from "./components/CardModal";
import { InboxView } from "./components/InboxView";
import { ListColumn } from "./components/ListColumn";
import { PlannerView } from "./components/PlannerView";
import { WorkspaceGuidePanel } from "./components/WorkspaceGuidePanel";

const EMPTY_FILTERS: FilterState = {
  search: "",
  labelIds: [],
  memberIds: [],
  due: "all",
};

const STARRED_BOARDS_STORAGE_KEY = "trellis-starred-boards";

type WorkspaceView = "home" | "board" | "inbox" | "planner";
type GuideMode = "guide" | "updates";

export default function App() {
  const { mutate: globalMutate } = useSWRConfig();
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(() => getHashState().view ?? "board");
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(() => getHashState().boardId ?? null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [activeCardId, setActiveCardId] = useState<string | null>(() => getHashState().cardId ?? null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [isAddingList, setIsAddingList] = useState(false);
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [starredBoardIds, setStarredBoardIds] = useState<string[]>(() => readStoredStringArray(STARRED_BOARDS_STORAGE_KEY));
  const [isBoardToolsOpen, setIsBoardToolsOpen] = useState(false);
  const [boardToolsView, setBoardToolsView] = useState<BoardToolsView>("overview");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<GuideMode>("guide");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: boardsData, isLoading: isLoadingBoards } = useSWR<BoardsPayload>("/boards", fetcher);
  const { data: boardData, mutate: mutateBoard } = useSWR<BoardResponse>(
    selectedBoardId ? `/boards/${selectedBoardId}` : null,
    fetcher,
  );

  const boards = boardsData?.boards ?? [];
  const backgrounds = boardsData?.backgrounds ?? ["ocean", "sunset", "forest", "graphite"];
  const currentBoard = boardData?.board ?? null;
  const currentBoardIsStarred = currentBoard ? starredBoardIds.includes(currentBoard.id) : false;

  useEffect(() => {
    if (boards.length === 0) {
      setSelectedBoardId(null);
      return;
    }

    if (!selectedBoardId || !boards.some((board) => board.id === selectedBoardId)) {
      setSelectedBoardId(boards[0].id);
    }
  }, [boards, selectedBoardId]);

  useEffect(() => {
    writeStoredStringArray(STARRED_BOARDS_STORAGE_KEY, starredBoardIds);
  }, [starredBoardIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncFromHash = () => {
      const hashState = getHashState();

      if (hashState.view) {
        setWorkspaceView(hashState.view);
      }

      if (typeof hashState.boardId !== "undefined") {
        setSelectedBoardId(hashState.boardId);
      }

      if (typeof hashState.cardId !== "undefined") {
        setActiveCardId(hashState.cardId);
      }
    };

    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);

  useEffect(() => {
    writeHashState({
      boardId: selectedBoardId,
      cardId: activeCardId,
      view: workspaceView,
    });
  }, [activeCardId, selectedBoardId, workspaceView]);

  useEffect(() => {
    if (!toastMessage || typeof window === "undefined") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  const visibleBoard = useMemo(() => {
    if (!currentBoard) {
      return null;
    }

    return filterBoard(currentBoard, filters);
  }, [currentBoard, filters]);

  const activeCard = useMemo(() => {
    if (!currentBoard || !activeCardId) {
      return null;
    }

    for (const list of currentBoard.lists) {
      const match = list.cards.find((card) => card.id === activeCardId);
      if (match) {
        return match;
      }
    }

    return null;
  }, [activeCardId, currentBoard]);

  useEffect(() => {
    if (activeCardId && !activeCard) {
      setActiveCardId(null);
    }
  }, [activeCard, activeCardId]);

  const dragDisabled = visibleBoard !== currentBoard;

  async function loadBoard(boardId: string, resetFilters = true) {
    setErrorMessage(null);
    setWorkspaceView("board");
    setSelectedBoardId(boardId);
    setIsAddingList(false);
    setNewListTitle("");

    if (resetFilters) {
      setFilters(EMPTY_FILTERS);
      setShowFilters(false);
    }
  }

  async function syncBoardMutation(operation: Promise<BoardResponse>, fallbackBoardId = selectedBoardId) {
    setErrorMessage(null);

    try {
      const response = await operation;
      applyBoardResponse(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      if (fallbackBoardId) {
        void mutateBoard();
      }
    }
  }

  function applyBoardResponse(response: BoardResponse) {
    void mutateBoard(response, false);
    if (response.boards) {
      void globalMutate("/boards", { boards: response.boards, backgrounds }, false);
    } else {
      void globalMutate("/boards");
    }
  }

  async function handleCreateBoard(payload: { title: string; background: string }) {
    const response = await api.createBoard(payload);
    applyBoardResponse(response);
    setWorkspaceView("board");
    setSelectedBoardId(response.board.id);
    setFilters(EMPTY_FILTERS);
    setIsAddingList(false);
    setNewListTitle("");
    setShowFilters(false);
    setIsBoardPickerOpen(false);
    setToastMessage(`Created ${response.board.title}`);
  }

  async function handleDeleteBoard(boardId: string) {
    if (!window.confirm("Are you sure you want to delete this board and all of its content? This cannot be undone.")) {
      return;
    }

    setErrorMessage(null);

    try {
      const response = await api.deleteBoard(boardId);
      void globalMutate("/boards", response, false);
      void globalMutate(`/boards/${boardId}`, null, false);
      setStarredBoardIds((current) => current.filter((id) => id !== boardId));
      setIsBoardToolsOpen(false);

      if (selectedBoardId === boardId) {
        const nextBoardId = response.boards[0]?.id ?? null;
        setSelectedBoardId(nextBoardId);
        setActiveCardId(null);

        if (!nextBoardId) {
          setWorkspaceView("home");
        }
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleUpdateBoard(boardId: string, payload: { title?: string; background?: string }) {
    await syncBoardMutation(api.updateBoard(boardId, payload), boardId);
  }

  function toggleBoardStar(boardId: string) {
    setStarredBoardIds((current) =>
      current.includes(boardId) ? current.filter((id) => id !== boardId) : [...current, boardId],
    );
  }

  function openGuide(mode: GuideMode) {
    setGuideMode(mode);
    setIsGuideOpen(true);
  }

  function openBoardTools(view: BoardToolsView) {
    setBoardToolsView(view);
    setIsBoardToolsOpen(true);
  }

  async function handleShareBoard() {
    if (!currentBoard || typeof window === "undefined") {
      return;
    }

    const shareUrl = buildShareUrl({
      boardId: currentBoard.id,
      view: "board",
    });

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToastMessage("Board link copied to clipboard");
    } catch {
      window.prompt("Copy this board link:", shareUrl);
    }
  }

  function openCard(cardId: string) {
    setWorkspaceView("board");
    setActiveCardId(cardId);
  }

  async function handleAddList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentBoard) {
      return;
    }

    const trimmedTitle = newListTitle.trim();
    if (!trimmedTitle) {
      return;
    }

    await syncBoardMutation(api.createList({ boardId: currentBoard.id, title: trimmedTitle }), currentBoard.id);
    setNewListTitle("");
    setIsAddingList(false);
  }

  async function handleDeleteList(listId: string) {
    if (!window.confirm("Delete this list and all of its cards?")) {
      return;
    }

    await syncBoardMutation(api.deleteList(listId));
  }

  async function handleArchiveCard(cardId: string) {
    await syncBoardMutation(api.archiveCard(cardId));
    setActiveCardId(null);
  }

  async function handleDeleteCard(cardId: string) {
    if (!window.confirm("Delete this card permanently?")) {
      return;
    }

    await syncBoardMutation(api.deleteCard(cardId));
    setActiveCardId(null);
  }

  async function handleDragEnd(result: DropResult) {
    if (!currentBoard || dragDisabled || !boardData || !visibleBoard) {
      return;
    }

    const { destination, source, type } = result;

    if (!destination) {
      return;
    }

    if (type === "COLUMN") {
      if (destination.index === source.index) {
        return;
      }

      const nextBoard = reorderLists(currentBoard, visibleBoard, source.index, destination.index);
      const optimisticData: BoardResponse = { ...boardData, board: nextBoard };

      void mutateBoard(
        api.reorderLists({
          boardId: currentBoard.id,
          orderedListIds: nextBoard.lists.map((list) => list.id),
        }),
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
          populateCache: (response) => ({ ...boardData, board: response.board, boards: response.boards }),
        },
      ).then((response) => {
        if (response?.boards) {
          void globalMutate("/boards", { boards: response.boards, backgrounds }, false);
        }
      });

      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const nextBoard = moveCard(
      currentBoard,
      visibleBoard,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index,
    );

    const sourceCardIds =
      nextBoard.lists.find((list) => list.id === source.droppableId)?.cards.map((card) => card.id) ?? [];
    const destinationCardIds =
      nextBoard.lists.find((list) => list.id === destination.droppableId)?.cards.map((card) => card.id) ?? [];

    const optimisticData: BoardResponse = { ...boardData, board: nextBoard };

    void mutateBoard(
      api.reorderCards({
        boardId: currentBoard.id,
        sourceListId: source.droppableId,
        destinationListId: destination.droppableId,
        sourceCardIds,
        destinationCardIds,
      }),
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
        populateCache: (response) => ({ ...boardData, board: response.board, boards: response.boards }),
      },
    ).then((response) => {
      if (response?.boards) {
        void globalMutate("/boards", { boards: response.boards, backgrounds }, false);
      }
    });
  }

  if (isLoadingBoards && !boardsData) {
    return <div className="app-loader">Loading workspace...</div>;
  }

  return (
    <div className="app-shell" data-background={currentBoard?.background ?? "ocean"}>
      <header className="global-nav">
        <div className="global-nav__left">
          <button className="nav-launcher" onClick={() => setWorkspaceView("home")} type="button" aria-label="Open workspace home">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M5.5 5.5h4.5v4.5H5.5Zm8.5 0h4.5v4.5H14Zm-8.5 8.5h4.5v4.5H5.5Zm8.5 0h4.5v4.5H14Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>

          <button className="global-nav__brand" onClick={() => setIsBoardPickerOpen(true)} type="button">
            <span className="global-nav__brand-mark">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <rect x="4.5" y="5.5" width="15" height="13" rx="3" fill="currentColor" opacity="0.16" />
                <rect x="6.5" y="7.5" width="4.2" height="9" rx="1.2" fill="currentColor" />
                <rect x="13.2" y="7.5" width="4.2" height="6" rx="1.2" fill="currentColor" />
              </svg>
            </span>
            <span className="global-nav__brand-text">Trello</span>
          </button>

          <button className="global-nav__searchbar" onClick={() => setIsBoardPickerOpen(true)} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M15.5 15.5 20 20m-2.5-9a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <span>Search boards</span>
          </button>

          <button className="nav-pill nav-pill--primary" onClick={() => setWorkspaceView("home")} type="button">
            Create
          </button>
        </div>

        <div className="global-nav__right">
          <button className="trial-pill" onClick={() => openGuide("guide")} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="m12 4 1.8 4.5L18 10l-4.2 2 1.6 4.5L12 14l-3.4 2.5L10.2 12 6 10l4.2-1.5L12 4Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            14 days left
          </button>
          <button className="nav-icon-button" onClick={() => openGuide("updates")} type="button" aria-label="Announcements">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M5.5 11.5h3l7-4v9l-7-4h-3v-1Zm3 3.5 1.5 4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
          <button className="nav-icon-button" onClick={() => setWorkspaceView("inbox")} type="button" aria-label="Notifications">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M12 4.5a5 5 0 0 0-5 5v2.4c0 .7-.2 1.4-.6 2L5 16.5h14l-1.4-2.6a4 4 0 0 1-.6-2V9.5a5 5 0 0 0-5-5Zm-2 14a2 2 0 0 0 4 0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
          <button className="nav-icon-button" onClick={() => openGuide("guide")} type="button" aria-label="Help">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path
                d="M9.2 9a3 3 0 1 1 5.7 1.3c-.6.8-1.4 1.2-2 1.8-.6.5-.9 1-.9 2"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="17.25" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            className="nav-member-avatar nav-member-avatar--button"
            onClick={() => openBoardTools("members")}
            type="button"
            aria-label="Open board members"
          >
            AP
          </button>
        </div>
      </header>

      <main className="workspace-main">
        {toastMessage ? <div className="notice-banner notice-banner--info">{toastMessage}</div> : null}
        {errorMessage ? <div className="notice-banner">{errorMessage}</div> : null}

        {workspaceView === "home" ? (
          <BoardHome
            backgrounds={backgrounds}
            boards={boards}
            onCreateBoard={handleCreateBoard}
            onSelectBoard={(boardId) => {
              void loadBoard(boardId);
            }}
          />
        ) : null}

        {workspaceView === "inbox" ? (
          <InboxView
            board={currentBoard}
            onOpenBoard={() => setWorkspaceView("board")}
            onOpenCard={openCard}
          />
        ) : null}

        {workspaceView === "planner" ? (
          <PlannerView
            board={currentBoard}
            onOpenBoard={() => setWorkspaceView("board")}
            onOpenCard={openCard}
          />
        ) : null}

        {workspaceView === "board" ? (
          currentBoard && visibleBoard ? (
            <>
              <BoardHeader
                board={currentBoard}
                dragDisabled={dragDisabled}
                filters={filters}
                isStarred={currentBoardIsStarred}
                showFilters={showFilters}
                totalVisibleCards={countVisibleCards(visibleBoard)}
                onClearFilters={() => setFilters(EMPTY_FILTERS)}
                onDueFilterChange={(due) => setFilters((current) => ({ ...current, due }))}
                onOpenBoardPicker={() => setIsBoardPickerOpen(true)}
                onOpenBoardTools={() => openBoardTools("overview")}
                onOpenMembers={() => openBoardTools("members")}
                onOpenPowerUps={() => openBoardTools("powerups")}
                onSearchChange={(search) => setFilters((current) => ({ ...current, search }))}
                onShareBoard={() => void handleShareBoard()}
                onToggleFilters={() => setShowFilters((current) => !current)}
                onToggleLabel={(labelId) =>
                  setFilters((current) => ({
                    ...current,
                    labelIds: current.labelIds.includes(labelId)
                      ? current.labelIds.filter((id) => id !== labelId)
                      : [...current.labelIds, labelId],
                  }))
                }
                onToggleMember={(memberId) =>
                  setFilters((current) => ({
                    ...current,
                    memberIds: current.memberIds.includes(memberId)
                      ? current.memberIds.filter((id) => id !== memberId)
                      : [...current.memberIds, memberId],
                  }))
                }
                onToggleStar={() => toggleBoardStar(currentBoard.id)}
              />

              <div className="board-stage">
                <button
                  aria-label="Open starter guide"
                  className="starter-guide-pill"
                  onClick={() => openGuide("guide")}
                  type="button"
                >
                  <span className="starter-guide-pill__badge" aria-hidden="true">
                    ↗
                  </span>
                  <span className="starter-guide-pill__label">Starter guide</span>
                  <span className="starter-guide-pill__hint">Open</span>
                </button>

                <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
                  <Droppable
                    direction="horizontal"
                    droppableId="board-columns"
                    isDropDisabled={dragDisabled}
                    type="COLUMN"
                  >
                    {(provided) => (
                      <div className="board-canvas" ref={provided.innerRef} {...provided.droppableProps}>
                        <div className="board-canvas__scroll">
                          {visibleBoard.lists.map((list, index) => (
                            <ListColumn
                              key={list.id}
                              dragDisabled={dragDisabled}
                              index={index}
                              list={list}
                              onAddCard={(listId, title) =>
                                syncBoardMutation(api.createCard({ listId, title }), currentBoard.id)
                              }
                              onDeleteList={handleDeleteList}
                              onOpenCard={setActiveCardId}
                              onRenameList={(listId, title) =>
                                syncBoardMutation(api.updateList(listId, { title }), currentBoard.id)
                              }
                              onToggleCardComplete={(cardId, isComplete) =>
                                syncBoardMutation(api.updateCard(cardId, { isComplete }), currentBoard.id)
                              }
                            />
                          ))}

                          {provided.placeholder}

                          {isAddingList ? (
                            <form className="add-list-panel is-open" onSubmit={handleAddList}>
                              <textarea
                                autoFocus
                                placeholder="Enter list title..."
                                rows={3}
                                value={newListTitle}
                                onChange={(event) => setNewListTitle(event.target.value)}
                              />
                              <div className="add-list-panel__actions">
                                <button className="primary-button" type="submit">
                                  Add list
                                </button>
                                <button
                                  className="ghost-button"
                                  onClick={() => {
                                    setIsAddingList(false);
                                    setNewListTitle("");
                                  }}
                                  type="button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button className="add-list-panel add-list-panel--collapsed" onClick={() => setIsAddingList(true)} type="button">
                              + Add another list
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {countVisibleCards(visibleBoard) === 0 ? (
                <div className="board-empty">
                  <div className="board-empty__card">
                    <h3>No cards match the current filters</h3>
                    <p>Clear the active search or filters to reveal the full board again.</p>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="board-empty">
              <div className="board-empty__card">
                <h3>{selectedBoardId ? "Loading board" : "No board selected"}</h3>
                <p>
                  {selectedBoardId
                    ? "Fetching the latest board state."
                    : "Open the board switcher to jump into a board or create a new one."}
                </p>
              </div>
            </div>
          )
        ) : null}
      </main>

      <div className="floating-dock">
        <button
          className={`floating-dock__button ${workspaceView === "inbox" ? "is-active" : ""}`}
          onClick={() => setWorkspaceView("inbox")}
          type="button"
        >
          Inbox
        </button>
        <button
          className={`floating-dock__button ${workspaceView === "planner" ? "is-active" : ""}`}
          onClick={() => setWorkspaceView("planner")}
          type="button"
        >
          Planner
        </button>
        <button
          className={`floating-dock__button ${workspaceView === "board" ? "is-active" : ""}`}
          onClick={() => setWorkspaceView("board")}
          type="button"
        >
          Board
        </button>
        <button className="floating-dock__button" onClick={() => setIsBoardPickerOpen(true)} type="button">
          Switch boards
        </button>
      </div>

      <BoardSidebar
        backgrounds={backgrounds}
        boards={boards}
        isOpen={isBoardPickerOpen}
        selectedBoardId={selectedBoardId}
        starredBoardIds={starredBoardIds}
        onClose={() => setIsBoardPickerOpen(false)}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
        onSelectBoard={(boardId) => {
          setIsBoardPickerOpen(false);
          void loadBoard(boardId);
        }}
      />

      <BoardToolsPanel
        backgrounds={backgrounds}
        board={currentBoard}
        initialView={boardToolsView}
        isOpen={isBoardToolsOpen}
        isStarred={currentBoardIsStarred}
        onClose={() => setIsBoardToolsOpen(false)}
        onDeleteBoard={handleDeleteBoard}
        onShareBoard={() => void handleShareBoard()}
        onToggleStar={() => {
          if (currentBoard) {
            toggleBoardStar(currentBoard.id);
          }
        }}
        onUpdateBoard={handleUpdateBoard}
      />

      <WorkspaceGuidePanel
        isOpen={isGuideOpen}
        mode={guideMode}
        onClose={() => setIsGuideOpen(false)}
        onMinimize={() => setIsGuideOpen(false)}
        onOpenBoards={() => {
          setIsGuideOpen(false);
          setIsBoardPickerOpen(true);
        }}
        onOpenInbox={() => {
          setIsGuideOpen(false);
          setWorkspaceView("inbox");
        }}
        onOpenPlanner={() => {
          setIsGuideOpen(false);
          setWorkspaceView("planner");
        }}
      />

      {currentBoard ? (
        <CardModal
          board={currentBoard}
          card={activeCard}
          onAddAttachment={(cardId, payload) => syncBoardMutation(api.createAttachment(cardId, payload), currentBoard.id)}
          onAddChecklist={(cardId, title) => syncBoardMutation(api.createChecklist(cardId, { title }), currentBoard.id)}
          onAddChecklistItem={(checklistId, title) =>
            syncBoardMutation(api.createChecklistItem(checklistId, { title }), currentBoard.id)
          }
          onAddComment={(cardId, message) => syncBoardMutation(api.createComment(cardId, { message }), currentBoard.id)}
          onArchiveCard={handleArchiveCard}
          onClose={() => setActiveCardId(null)}
          onDeleteAttachment={(attachmentId) => syncBoardMutation(api.deleteAttachment(attachmentId), currentBoard.id)}
          onDeleteCard={handleDeleteCard}
          onDeleteChecklist={(checklistId) => syncBoardMutation(api.deleteChecklist(checklistId), currentBoard.id)}
          onDeleteChecklistItem={(itemId) => syncBoardMutation(api.deleteChecklistItem(itemId), currentBoard.id)}
          onSetCardCover={(cardId, coverImage) =>
            syncBoardMutation(api.updateCard(cardId, { coverImage }), currentBoard.id)
          }
          onUpdateCard={(cardId, payload) => syncBoardMutation(api.updateCard(cardId, payload), currentBoard.id)}
          onUpdateChecklist={(checklistId, title) =>
            syncBoardMutation(api.updateChecklist(checklistId, { title }), currentBoard.id)
          }
          onUpdateChecklistItem={(itemId, payload) =>
            syncBoardMutation(api.updateChecklistItem(itemId, payload), currentBoard.id)
          }
          onCreateLabel={(payload) => syncBoardMutation(api.createLabel(currentBoard.id, payload), currentBoard.id)}
          onUpdateLabel={(labelId, payload) => syncBoardMutation(api.updateLabel(labelId, payload), currentBoard.id)}
          onDeleteLabel={(labelId) => syncBoardMutation(api.deleteLabel(labelId), currentBoard.id)}
        />
      ) : null}
    </div>
  );
}

function reorderLists(board: Board, visibleBoard: Board, startIndex: number, endIndex: number) {
  const nextLists = [...board.lists];

  const movedListId = visibleBoard.lists[startIndex]?.id;
  const targetListId = visibleBoard.lists[endIndex]?.id;

  if (!movedListId || !targetListId) {
    return board;
  }

  const absoluteStartIndex = nextLists.findIndex((list) => list.id === movedListId);
  const absoluteEndIndex = nextLists.findIndex((list) => list.id === targetListId);

  const [movedList] = nextLists.splice(absoluteStartIndex, 1);
  nextLists.splice(absoluteEndIndex, 0, movedList);

  return {
    ...board,
    lists: nextLists.map((list, index) => ({
      ...list,
      position: index,
    })),
  };
}

function moveCard(
  board: Board,
  visibleBoard: Board,
  sourceListId: string,
  destinationListId: string,
  sourceIndex: number,
  destinationIndex: number,
) {
  const nextBoard: Board = {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: [...list.cards],
    })),
  };

  const visibleSourceList = visibleBoard.lists.find((list) => list.id === sourceListId);
  const visibleDestinationList = visibleBoard.lists.find((list) => list.id === destinationListId);

  if (!visibleSourceList || !visibleDestinationList) {
    return board;
  }

  const movedCardId = visibleSourceList.cards[sourceIndex]?.id;
  if (!movedCardId) {
    return board;
  }

  const sourceList = nextBoard.lists.find((list) => list.id === sourceListId);
  const destinationList = nextBoard.lists.find((list) => list.id === destinationListId);

  if (!sourceList || !destinationList) {
    return board;
  }

  const sourceCardIndex = sourceList.cards.findIndex((card) => card.id === movedCardId);
  const [movedCard] = sourceList.cards.splice(sourceCardIndex, 1);

  if (!movedCard) {
    return board;
  }

  let targetAbsoluteIndex = destinationList.cards.length;
  const targetCardId = visibleDestinationList.cards[destinationIndex]?.id;

  if (targetCardId) {
    const foundIndex = destinationList.cards.findIndex((card) => card.id === targetCardId);
    if (foundIndex !== -1) {
      targetAbsoluteIndex = foundIndex;
    }
  }

  destinationList.cards.splice(targetAbsoluteIndex, 0, {
    ...movedCard,
    listId: destinationListId,
  });

  return {
    ...nextBoard,
    lists: nextBoard.lists.map((list) => ({
      ...list,
      cards: list.cards.map((card, index) => ({
        ...card,
        position: index,
        listId: list.id,
      })),
    })),
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getHashState(): {
  boardId?: string | null;
  cardId?: string | null;
  view?: WorkspaceView;
} {
  if (typeof window === "undefined") {
    return {};
  }

  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const view = params.get("view");
  const boardId = params.get("board");
  const cardId = params.get("card");

  return {
    boardId,
    cardId,
    view: isWorkspaceView(view) ? view : undefined,
  };
}

function isWorkspaceView(value: string | null): value is WorkspaceView {
  return value === "home" || value === "board" || value === "inbox" || value === "planner";
}

function writeHashState({
  boardId,
  cardId,
  view,
}: {
  boardId: string | null;
  cardId: string | null;
  view: WorkspaceView;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams();
  params.set("view", view);

  if (boardId) {
    params.set("board", boardId);
  }

  if (cardId) {
    params.set("card", cardId);
  }

  const nextHash = params.toString();
  if (window.location.hash.replace(/^#/, "") !== nextHash) {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${nextHash}`);
  }
}

function buildShareUrl({
  boardId,
  view,
}: {
  boardId: string;
  view: WorkspaceView;
}) {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.hash = new URLSearchParams({
    board: boardId,
    view,
  }).toString();
  return url.toString();
}

function readStoredStringArray(key: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(key);
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredStringArray(key: string, value: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}
