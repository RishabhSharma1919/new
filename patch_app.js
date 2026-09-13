const fs = require("fs");
let content = fs.readFileSync("client/src/App.tsx", "utf8");

content = content.replace(
  'import type { BoardTemplate } from "./lib/templates";',
  'import type { BoardTemplate } from "./lib/templates";\nimport { InviteLanding } from "./components/InviteLanding";'
);

content = content.replace(
  'const [activeCardId, setActiveCardId] = useState<string | null>(() => getHashState().cardId ?? null);',
  'const [activeCardId, setActiveCardId] = useState<string | null>(() => getHashState().cardId ?? null);\n  const [inviteCode, setInviteCode] = useState<string | null>(() => getHashState().inviteCode ?? null);'
);

content = content.replace(
  '      if (typeof hashState.cardId !== "undefined") {\n        setActiveCardId(hashState.cardId);\n      }',
  '      if (typeof hashState.cardId !== "undefined") {\n        setActiveCardId(hashState.cardId);\n      }\n\n      if (typeof hashState.inviteCode !== "undefined") {\n        setInviteCode(hashState.inviteCode);\n      }'
);

content = content.replace(
  '  useEffect(() => {\n    writeHashState({\n      boardId: selectedBoardId,\n      cardId: activeCardId,\n      view: isHomeOpen ? "home" : activeViews.join(","),\n    });\n  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews]);',
  '  useEffect(() => {\n    writeHashState({\n      boardId: selectedBoardId,\n      cardId: activeCardId,\n      view: isHomeOpen ? "home" : activeViews.join(","),\n      inviteCode,\n    });\n  }, [activeCardId, selectedBoardId, isHomeOpen, activeViews, inviteCode]);'
);

content = content.replace(
  '  if (!user) return <AuthScreen onSubmit={handleAuth} />;\n\n  return (',
  '  if (!user) return <AuthScreen onSubmit={handleAuth} />;\n\n  if (inviteCode) {\n    return (\n      <InviteLanding\n        inviteCode={inviteCode}\n        onJoinSuccess={(orgId) => {\n          setInviteCode(null);\n          handleSelectWorkspace(orgId);\n          setIsHomeOpen(true);\n        }}\n        onCancel={() => {\n          setInviteCode(null);\n          setIsHomeOpen(true);\n        }}\n      />\n    );\n  }\n\n  return ('
);

content = content.replace(
  'function getHashState(): {\n  boardId?: string | null;\n  cardId?: string | null;\n  view?: WorkspaceView;\n  rawView?: string;\n} {',
  'function getHashState(): {\n  boardId?: string | null;\n  cardId?: string | null;\n  view?: WorkspaceView;\n  rawView?: string;\n  inviteCode?: string | null;\n} {'
);

content = content.replace(
  '  const cardId = params.get("card");\n\n  return {\n    boardId,\n    cardId,',
  '  const cardId = params.get("card");\n  const inviteCode = params.get("invite");\n\n  return {\n    boardId,\n    cardId,\n    inviteCode,'
);

content = content.replace(
  'function writeHashState({\n  boardId,\n  cardId,\n  view,\n}: {\n  boardId: string | null;\n  cardId: string | null;\n  view: string;\n}) {',
  'function writeHashState({\n  boardId,\n  cardId,\n  view,\n  inviteCode,\n}: {\n  boardId: string | null;\n  cardId: string | null;\n  view: string;\n  inviteCode?: string | null;\n}) {'
);

content = content.replace(
  '  const params = new URLSearchParams();\n  params.set("view", view);\n\n  if (boardId) {\n    params.set("board", boardId);\n  }\n\n  if (cardId) {\n    params.set("card", cardId);\n  }',
  '  const params = new URLSearchParams();\n  \n  if (inviteCode) {\n    params.set("invite", inviteCode);\n  } else {\n    params.set("view", view);\n\n    if (boardId) {\n      params.set("board", boardId);\n    }\n\n    if (cardId) {\n      params.set("card", cardId);\n    }\n  }'
);

fs.writeFileSync("client/src/App.tsx", content);
console.log("Patched App.tsx");
