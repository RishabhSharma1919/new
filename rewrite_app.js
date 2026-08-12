const fs = require('fs');

const file = 'client/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Types
code = code.replace(
  'type WorkspaceView = "home" | "board" | "inbox" | "planner";',
  'type WorkspaceView = "home" | "board" | "inbox" | "planner";\ntype ActiveView = "board" | "inbox" | "planner";'
);

// 2. React component state initialization
const stateToReplace = `  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>(() => getHashState().view ?? "board");`;
const newState = `  const [isHomeOpen, setIsHomeOpen] = useState(() => getHashState().view === "home");
  const [activeViews, setActiveViews] = useState<ActiveView[]>(() => {
    const rawView = getHashState().rawView;
    if (rawView && rawView !== "home") {
      const views = rawView.split(",").filter(v => v === "board" || v === "inbox" || v === "planner") as ActiveView[];
      if (views.length > 0) return views;
    }
    return ["board"];
  });

  function toggleView(view: ActiveView) {
    setIsHomeOpen(false);
    setActiveViews((current) => {
      if (current.includes(view)) {
        if (current.length > 1) {
          return current.filter((v) => v !== view);
        }
        return current;
      }
      return [...current, view];
    });
  }`;
code = code.replace(stateToReplace, newState);

// 3. syncFromHash
const syncFromHashBlock = `    const syncFromHash = () => {
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
    };`;
const syncFromHashReplacement = `    const syncFromHash = () => {
      const hashState = getHashState();

      if (hashState.rawView === "home") {
        setIsHomeOpen(true);
      } else if (hashState.rawView) {
        setIsHomeOpen(false);
        const views = hashState.rawView.split(",").filter((v) => v === "board" || v === "inbox" || v === "planner") as ActiveView[];
        if (views.length > 0) setActiveViews(views);
      }

      if (typeof hashState.boardId !== "undefined") {
        setSelectedBoardId(hashState.boardId);
      }

      if (typeof hashState.cardId !== "undefined") {
        setActiveCardId(hashState.cardId);
      }
    };`;
code = code.replace(syncFromHashBlock, syncFromHashReplacement);

// 4. writeHashState useEffect
const writeHashStateEffect = `  useEffect(() => {
    writeHashState({
      boardId: selectedBoardId,
      cardId: activeCardId,
      view: workspaceView,
    });
  }, [activeCardId, selectedBoardId, workspaceView]);`;
const writeHashStateEffectReplacement = `  useEffect(() => {
    writeHashState({
      boardId: selectedBoardId,
      cardId: activeCardId,
      view: isHomeOpen ? "home" : activeViews.join(","),
    });
  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews]);`;
code = code.replace(writeHashStateEffect, writeHashStateEffectReplacement);

// 5. App functions updating workspaceView
code = code.replace(/setWorkspaceView\("board"\)/g, `setIsHomeOpen(false); setActiveViews((current) => current.includes("board") ? current : [...current, "board"])`);
code = code.replace(/setWorkspaceView\("home"\)/g, 'setIsHomeOpen(true)');
code = code.replace(/setWorkspaceView\("inbox"\)/g, `setIsHomeOpen(false); setActiveViews((c) => c.includes("inbox") ? c : [...c, "inbox"])`);
code = code.replace(/setWorkspaceView\("planner"\)/g, `setIsHomeOpen(false); setActiveViews((c) => c.includes("planner") ? c : [...c, "planner"])`);

// 6. workspace-main & floating-dock
const mainTarget = `<main className="workspace-main">
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
            onOpenBoard={() => setIsHomeOpen(false); setActiveViews((current) => current.includes("board") ? current : [...current, "board"]);}
            onOpenCard={openCard}
          />
        ) : null}

        {workspaceView === "planner" ? (
          <PlannerView
            board={currentBoard}
            onOpenBoard={() => setIsHomeOpen(false); setActiveViews((current) => current.includes("board") ? current : [...current, "board"]);}
            onOpenCard={openCard}
          />
        ) : null}

        {workspaceView === "board" ? (
          currentBoard && visibleBoard ? (
            <>
              <BoardHeader`;

const mainReplacement = `<main className={\`workspace-main \${!isHomeOpen && activeViews.length > 1 ? "is-split" : ""}\`}>
        {toastMessage ? <div className="notice-banner notice-banner--info">{toastMessage}</div> : null}
        {errorMessage ? <div className="notice-banner">{errorMessage}</div> : null}

        {isHomeOpen ? (
          <BoardHome
            backgrounds={backgrounds}
            boards={boards}
            onCreateBoard={handleCreateBoard}
            onSelectBoard={(boardId) => {
              void loadBoard(boardId);
            }}
          />
        ) : (
          <div className="workspace-panels">
            {activeViews.map((view) => (
              <div key={view} className={\`workspace-panel workspace-panel--\${view}\`}>
                {view === "inbox" && (
                  <InboxView
                    board={currentBoard}
                    onOpenBoard={() => toggleView("board")}
                    onOpenCard={openCard}
                  />
                )}
                {view === "planner" && (
                  <PlannerView
                    board={currentBoard}
                    onOpenBoard={() => toggleView("board")}
                    onOpenCard={openCard}
                  />
                )}
                {view === "board" && (
                  currentBoard && visibleBoard ? (
                    <>
                      <BoardHeader`;

// Replace mainTarget using substring search
const startIndex = code.indexOf('<main className="workspace-main">');
const endIndexStr = `              <BoardHeader`;
const endIndex = code.indexOf(endIndexStr, startIndex) + endIndexStr.length;
if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + mainReplacement + code.substring(endIndex);
}

// 7. Middle section: board-empty
const emptyTargetStart = `              {countVisibleCards(visibleBoard) === 0 ? (
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
      </main>`;
const emptyTargetReplacement = `              {countVisibleCards(visibleBoard) === 0 ? (
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
        )}
        </div>
        ))}
        </div>
        )}
      </main>`;

code = code.replace(emptyTargetStart, emptyTargetReplacement);

// 8. Floating dock
// It was updated to `workspaceView === "inbox"` which became `setIsHomeOpen...`? 
// No, the floating dock button's `className` used `workspaceView === "inbox"`. Then `onClick` used `setWorkspaceView`.
// The onClick was substituted, but className was not.
const navStartIndex = code.indexOf('<nav className="floating-dock">');
const navEndIndexStr = `</nav>`;
const navEndIndex = code.indexOf(navEndIndexStr, navStartIndex) + navEndIndexStr.length;

const newNav = `{!isHomeOpen ? (
        <nav className="floating-dock">
          <button
            className={\`floating-dock__button \${activeViews.includes("inbox") ? "is-active" : ""}\`}
            onClick={() => toggleView("inbox")}
            type="button"
          >
            Inbox
          </button>
          <button
            className={\`floating-dock__button \${activeViews.includes("planner") ? "is-active" : ""}\`}
            onClick={() => toggleView("planner")}
            type="button"
          >
            Planner
          </button>
          <button
            className={\`floating-dock__button \${activeViews.includes("board") ? "is-active" : ""}\`}
            onClick={() => toggleView("board")}
            type="button"
          >
            Board
          </button>
          <button className="floating-dock__button" onClick={() => setIsBoardPickerOpen(true)} type="button">
            Switch boards
          </button>
        </nav>
      ) : null}`;

if (navStartIndex !== -1 && navEndIndex !== -1) {
    code = code.substring(0, navStartIndex) + newNav + code.substring(navEndIndex);
}

// 9. Hash functions at the end
code = code.replace(`function getHashState(): {
  boardId?: string | null;
  cardId?: string | null;
  view?: WorkspaceView;
}`, `function getHashState(): {
  boardId?: string | null;
  cardId?: string | null;
  view?: WorkspaceView;
  rawView?: string;
}`);

code = code.replace(`view: isWorkspaceView(view) ? view : undefined,`, `view: isWorkspaceView(view) ? view : undefined,\n    rawView: view ?? undefined,`);

code = code.replace(`function writeHashState({
  boardId,
  cardId,
  view,
}: {
  boardId: string | null;
  cardId: string | null;
  view: WorkspaceView;
})`, `function writeHashState({
  boardId,
  cardId,
  view,
}: {
  boardId: string | null;
  cardId: string | null;
  view: string;
})`);

// 10. WorkspaceGuidePanel bindings
code = code.replace(`onOpenInbox={() => {
          setIsGuideOpen(false);
          setIsHomeOpen(false); setActiveViews((c) => c.includes("inbox") ? c : [...c, "inbox"]);;
        }}`, `onOpenInbox={() => {
          setIsGuideOpen(false);
          setIsHomeOpen(false); 
          setActiveViews((c) => c.includes("inbox") ? c : [...c, "inbox"]);
        }}`);
code = code.replace(`onOpenPlanner={() => {
          setIsGuideOpen(false);
          setIsHomeOpen(false); setActiveViews((c) => c.includes("planner") ? c : [...c, "planner"]);;
        }}`, `onOpenPlanner={() => {
          setIsGuideOpen(false);
          setIsHomeOpen(false); 
          setActiveViews((c) => c.includes("planner") ? c : [...c, "planner"]);
        }}`);

fs.writeFileSync(file, code);
console.log('Done!');
