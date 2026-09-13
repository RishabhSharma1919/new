const fs = require("fs");
let l = fs.readFileSync("client/src/components/ListColumn.tsx", "utf8");
l = l.replace(/\r\n/g, "\n");
l = l.replace(
  'backgroundColor: "var(--bg-primary)"',
  'backgroundColor: "#ffffff"'
);
l = l.replace(
  'color: "var(--text-primary)"',
  'color: "#172b4d"'
);
l = l.replace(
  'border: "1px solid var(--border-color)"',
  'border: "1px solid #e5e7eb"'
);
l = l.replace(
  'backgroundColor: "var(--bg-secondary)"',
  'backgroundColor: "#f3f4f6"'
);
l = l.replace(
  'color: "var(--text-secondary)"',
  'color: "#4b5563"'
);
fs.writeFileSync("client/src/components/ListColumn.tsx", l);
console.log("Popover colors patched");
