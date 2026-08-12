const fs = require('fs');
let code = fs.readFileSync('client/src/App.tsx', 'utf8');

const target1 = `<main className="workspace-main">
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
              <BoardHeader`;

const replacement1 = `<main className={\`workspace-main \${!isHomeOpen && activeViews.length > 1 ? "is-split" : ""}\`}>
        {toastMessage ? <div className="notice-banner notice-banner--info">{toastMessage}</div> : null}
        {errorMessage ? <div className="notice-banner">{errorMessage}</div> : null}

        {isHomeOpen ? (
          <BoardHome
            backgrounds={backgrounds}
            boards={boards}
            onCreateBoard={handleCreateBoard}
            onSelectBoard={(boardId) => void loadBoard(boardId)}
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

code = code.replace(target1, replacement1);

const target2 = `        ) : null}
      </main>

      {!isHomeOpen ? (
        <nav className="floating-dock">
          <button
            className={\`floating-dock__button \${workspaceView === "inbox" ? "is-active" : ""}\`}
            onClick={() => setWorkspaceView("inbox")}
            type="button"
          >
            Inbox
          </button>
          <button
            className={\`floating-dock__button \${workspaceView === "planner" ? "is-active" : ""}\`}
            onClick={() => setWorkspaceView("planner")}
            type="button"
          >
            Planner
          </button>
          <button
            className={\`floating-dock__button \${workspaceView === "board" ? "is-active" : ""}\`}
            onClick={() => setWorkspaceView("board")}
            type="button"
          >
            Board
          </button>
          <button className="floating-dock__button" onClick={() => setIsBoardPickerOpen(true)} type="button">
            Switch boards
          </button>
        </nav>
      ) : null}`;

const replacement2 = `                  ) : <div className="board-empty" />
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {!isHomeOpen ? (
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

code = code.replace(target2, replacement2);

fs.writeFileSync('client/src/App.tsx', code);
console.log('App.tsx transformed successfully!');
