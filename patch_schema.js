const fs = require("fs");
let c = fs.readFileSync("server/prisma/schema.prisma", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  '  description String               @default("")\n  inviteCode  String?              @unique\n  createdAt   DateTime             @default(now())',
  '  description String               @default("")\n  createdAt   DateTime             @default(now())'
);

replaceOnce(
  '  organizationId String?\n  title      String',
  '  organizationId String?\n  inviteCode String?       @unique\n  title      String'
);

fs.writeFileSync("server/prisma/schema.prisma", c);
console.log("Schema patched successfully");
