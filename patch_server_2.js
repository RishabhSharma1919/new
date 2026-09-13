const fs = require("fs");
let c = fs.readFileSync("server/src/index.ts", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  'if (request.path === "/health" || request.path.startsWith("/auth/") || request.path.startsWith("/organizations/invite/")) return next();',
  'if (request.path === "/health" || request.path.startsWith("/auth/") || request.path.startsWith("/boards/invite/")) return next();'
);

fs.writeFileSync("server/src/index.ts", c);
console.log("Server auth route patched successfully");
