const fs = require("fs");
let a = fs.readFileSync("client/src/App.tsx", "utf8");
a = a.replace(/\r\n/g, "\n");

function replaceOnce(str, search, replacement) {
  if (str.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  return str.replace(search, replacement);
}

a = replaceOnce(a,
  '        onJoinSuccess={(boardId) => {\n          setInviteCode(null);\n          setIsHomeOpen(false);\n          setCurrentBoardId(boardId);\n          void globalMutate("/boards");\n        }}',
  '        onJoinSuccess={(boardId) => {\n          setInviteCode(null);\n          setIsHomeOpen(false);\n          setSelectedBoardId(boardId);\n          void loadBoard(boardId);\n        }}'
);

fs.writeFileSync("client/src/App.tsx", a);
console.log("App.tsx fixed");
