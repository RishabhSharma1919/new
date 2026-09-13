const fs = require("fs");
let c = fs.readFileSync("client/src/App.tsx", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  'import { AuthScreen } from "./components/AuthScreen";',
  'import { AuthScreen } from "./components/AuthScreen";\nimport { InviteLanding } from "./components/InviteLanding";'
);

replaceOnce(
  'const [activeCardId, setActiveCardId] = useState<string | null>(() => getHashState().cardId ?? null);',
  'const [activeCardId, setActiveCardId] = useState<string | null>(() => getHashState().cardId ?? null);\n  const [inviteCode, setInviteCode] = useState<string | null>(() => getHashState().inviteCode ?? null);'
);

replaceOnce(
  'if (typeof hashState.cardId !== "undefined") {\n        setActiveCardId(hashState.cardId);\n      }',
  'if (typeof hashState.cardId !== "undefined") {\n        setActiveCardId(hashState.cardId);\n      }\n\n      if (typeof hashState.inviteCode !== "undefined") {\n        setInviteCode(hashState.inviteCode);\n      }'
);

replaceOnce(
  'useEffect(() => {\n    writeHashState({\n      boardId: selectedBoardId,\n      cardId: activeCardId,\n      view: isHomeOpen ? "home" : activeViews.join(","),\n    });\n  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews]);',
  'useEffect(() => {\n    writeHashState({\n      boardId: selectedBoardId,\n      cardId: activeCardId,\n      view: isHomeOpen ? "home" : activeViews.join(","),\n      inviteCode,\n    });\n  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews, inviteCode]);'
);

replaceOnce(
  'if (!user) return <AuthScreen onSubmit={handleAuth} />;\n\n  return (',
  'if (!user) return <AuthScreen onSubmit={handleAuth} />;\n\n  if (inviteCode) {\n    return (\n      <InviteLanding\n        inviteCode={inviteCode}\n        onJoinSuccess={() => {\n          setInviteCode(null);\n          setIsHomeOpen(true);\n          void globalMutate("/boards");\n        }}\n        onCancel={() => {\n          setInviteCode(null);\n          setIsHomeOpen(true);\n        }}\n      />\n    );\n  }\n\n  return ('
);

replaceOnce(
  'function getHashState(): {\n  boardId?: string | null;\n  cardId?: string | null;\n  view?: WorkspaceView;\n  rawView?: string;\n} {',
  'function getHashState(): {\n  boardId?: string | null;\n  cardId?: string | null;\n  view?: WorkspaceView;\n  rawView?: string;\n  inviteCode?: string | null;\n} {'
);

replaceOnce(
  'const cardId = params.get("card");\n\n  return {\n    boardId,\n    cardId,\n    view: isWorkspaceView(view) ? view : undefined,',
  'const cardId = params.get("card");\n  const inviteCode = params.get("invite");\n\n  return {\n    boardId,\n    cardId,\n    inviteCode,\n    view: isWorkspaceView(view) ? view : undefined,'
);

replaceOnce(
  'function writeHashState({\n  boardId,\n  cardId,\n  view,\n}: {\n  boardId: string | null;\n  cardId: string | null;\n  view: string;\n}) {\n  if (typeof window === "undefined") {\n    return;\n  }\n\n  const params = new URLSearchParams();\n  params.set("view", view);\n\n  if (boardId) {\n    params.set("board", boardId);\n  }\n\n  if (cardId) {\n    params.set("card", cardId);\n  }',
  'function writeHashState({\n  boardId,\n  cardId,\n  view,\n  inviteCode,\n}: {\n  boardId: string | null;\n  cardId: string | null;\n  view: string;\n  inviteCode?: string | null;\n}) {\n  if (typeof window === "undefined") {\n    return;\n  }\n\n  const params = new URLSearchParams();\n\n  if (inviteCode) {\n    params.set("invite", inviteCode);\n  } else {\n    params.set("view", view);\n\n    if (boardId) {\n      params.set("board", boardId);\n    }\n\n    if (cardId) {\n      params.set("card", cardId);\n    }\n  }'
);

fs.writeFileSync("client/src/App.tsx", c);
console.log("Accurate patch applied.");
