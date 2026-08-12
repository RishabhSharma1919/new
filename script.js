const fs = require('fs');
let code = fs.readFileSync('client/src/App.tsx', 'utf8');

code = code.replace(/const syncFromHash = \(\) => \{[\s\S]+?setWorkspaceView\(hashState\.view\);\s+\}[\s\S]+?setActiveCardId\(hashState\.cardId\);\s+\}\s+\};/g, `const syncFromHash = () => {
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
    };`);

code = code.replace(/writeHashState\(\{[\s\S]+?view: workspaceView,[\s\S]+?\}\);\s+\}, \[activeCardId, selectedBoardId, workspaceView\]\);/g, `writeHashState({
      boardId: selectedBoardId,
      cardId: activeCardId,
      view: isHomeOpen ? "home" : activeViews.join(","),
    });
  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews]);`);

code = code.replace(/setWorkspaceView\("board"\);/g, `setIsHomeOpen(false);
    setActiveViews((current) => current.includes("board") ? current : [...current, "board"]);`);

code = code.replace(/setWorkspaceView\("home"\)/g, 'setIsHomeOpen(true)');
code = code.replace(/setWorkspaceView\("inbox"\)/g, 'setIsHomeOpen(false); setActiveViews((c) => c.includes("inbox") ? c : [...c, "inbox"])');
code = code.replace(/setWorkspaceView\("planner"\)/g, 'setIsHomeOpen(false); setActiveViews((c) => c.includes("planner") ? c : [...c, "planner"])');

code = code.replace(/view\?: WorkspaceView;/, `view?: WorkspaceView;\n  rawView?: string;`);
code = code.replace(/view: isWorkspaceView\(view\) \? view : undefined,/, `view: isWorkspaceView(view) ? view : undefined,\n    rawView: view ?? undefined,`);

code = code.replace(/view: WorkspaceView;/, `view: string;`);

fs.writeFileSync('client/src/App.tsx', code);
console.log('App.tsx transformed successfully');
