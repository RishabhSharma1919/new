const fs = require("fs");
let c = fs.readFileSync("server/src/data.ts", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  '  return {\n    id: board.id,\n    title: board.title,',
  '  return {\n    id: board.id,\n    organizationId: board.organizationId,\n    title: board.title,'
);

fs.writeFileSync("server/src/data.ts", c);
console.log("Patch data applied.");
