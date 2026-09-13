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
  `export async function getBoardSummaries(userId?: string) {\n  const boards = await prisma.board.findMany({\n    where: userId ? { members: { some: { userId } } } : undefined,`,
  `export async function getBoardSummaries(userId?: string, organizationId?: string) {\n  const boards = await prisma.board.findMany({\n    where: {\n      ...(userId ? { members: { some: { userId } } } : {}),\n      ...(organizationId ? { organizationId } : {}),\n    },`
);

replaceOnce(
  `export const DEFAULT_LABELS = [\n  { name: "Design", color: "#2563eb" },\n  { name: "Frontend", color: "#7c3aed" },\n  { name: "Backend", color: "#059669" },\n  { name: "Priority", color: "#dc2626" },\n];`,
  `export const DEFAULT_LABELS = [\n  { name: "Design", color: "#2563eb" },\n  { name: "Frontend", color: "#7c3aed" },\n  { name: "Backend", color: "#059669" },\n  { name: "Priority", color: "#dc2626" },\n];\n\nexport async function getOrganizationSummaries(userId: string) {\n  const organizations = await prisma.organization.findMany({\n    where: { members: { some: { userId } } },\n    orderBy: { createdAt: "asc" },\n  });\n  return organizations;\n}\n\nexport async function ensurePersonalOrganization(userId: string, userName: string) {\n  const existing = await prisma.organizationMember.findFirst({\n    where: { userId, role: "admin" },\n    include: { organization: true },\n  });\n  if (existing) return existing.organization;\n\n  const name = \`\${userName}'s Workspace\`;\n  const organization = await prisma.organization.create({\n    data: {\n      name,\n      slug: slugify(name),\n      color: "#0c66e4",\n      members: {\n        create: { userId, role: "admin" },\n      },\n    },\n  });\n  return organization;\n}\n\nexport function slugify(text: string) {\n  return text\n    .toString()\n    .toLowerCase()\n    .trim()\n    .replace(/\\s+/g, "-")\n    .replace(/[^\\w-]+/g, "")\n    .replace(/--+/g, "-");\n}`
);

fs.writeFileSync("server/src/data.ts", c);
console.log("Patch data 2 applied.");
