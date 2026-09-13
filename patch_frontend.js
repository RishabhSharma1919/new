const fs = require("fs");

let c = fs.readFileSync("client/src/components/InviteLanding.tsx", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(str, search, replacement) {
  if (str.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  return str.replace(search, replacement);
}

c = replaceOnce(c,
  '  onJoinSuccess: (organizationId: string) => void;',
  '  onJoinSuccess: (boardId: string) => void;'
);

c = replaceOnce(c,
  '  const [orgInfo, setOrgInfo] = useState<{ id: string; name: string; memberCount: number } | null>(null);',
  '  const [boardInfo, setBoardInfo] = useState<{ id: string; title: string; background: string; memberCount: number } | null>(null);'
);

c = replaceOnce(c,
  '    api.getInviteInfo(inviteCode)\n      .then(setOrgInfo)',
  '    api.getInviteInfo(inviteCode)\n      .then(setBoardInfo)'
);

c = replaceOnce(c,
  '      const res = await api.joinOrganization(inviteCode);\n      onJoinSuccess(res.joinedOrganizationId);',
  '      const res = await api.joinBoard(inviteCode);\n      onJoinSuccess(res.board.id);'
);

c = replaceOnce(c,
  '          <h1>Join Organization</h1>',
  '          <h1>Join Board</h1>'
);

c = replaceOnce(c,
  '            <p>You have been invited to join</p>\n            <h2 style={{ margin: "1rem 0", fontSize: "1.5rem" }}>{orgInfo?.name}</h2>\n            <p style={{ color: "var(--text-secondary)" }}>{orgInfo?.memberCount} member(s)</p>',
  '            <p>You have been invited to join</p>\n            <h2 style={{ margin: "1rem 0", fontSize: "1.5rem" }}>{boardInfo?.title}</h2>\n            <p style={{ color: "var(--text-secondary)" }}>{boardInfo?.memberCount} member(s)</p>'
);

c = replaceOnce(c,
  '      setError(err.message || "Failed to join organization.");',
  '      setError(err.message || "Failed to join board.");'
);

fs.writeFileSync("client/src/components/InviteLanding.tsx", c);
console.log("InviteLanding patched successfully");

let a = fs.readFileSync("client/src/App.tsx", "utf8");
a = a.replace(/\r\n/g, "\n");

a = replaceOnce(a,
  '        onJoinSuccess={() => {\n          setInviteCode(null);\n          setIsHomeOpen(true);\n          void globalMutate("/boards");\n        }}',
  '        onJoinSuccess={(boardId) => {\n          setInviteCode(null);\n          setIsHomeOpen(false);\n          setCurrentBoardId(boardId);\n          void globalMutate("/boards");\n        }}'
);

fs.writeFileSync("client/src/App.tsx", a);
console.log("App patched successfully");
