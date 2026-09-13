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
  'app.post("/api/organizations/:organizationId/invite-link", asyncRoute(async (request, response) => {\n  const organizationId = request.params.organizationId;\n  const membership = await prisma.organizationMember.findUnique({\n    where: { organizationId_userId: { organizationId, userId: request.currentUser!.id } },\n  });\n  if (!membership || membership.role !== "admin") {\n    response.status(403).json({ error: "Only organization admins can generate invite links." });\n    return;\n  }\n\n  let organization = await prisma.organization.findUnique({ where: { id: organizationId } });\n  if (!organization) {\n    response.status(404).json({ error: "Organization not found." });\n    return;\n  }\n\n  if (!organization.inviteCode) {\n    const inviteCode = Math.random().toString(36).substring(2, 10);\n    organization = await prisma.organization.update({\n      where: { id: organizationId },\n      data: { inviteCode },\n    });\n  }\n\n  response.json({ inviteCode: organization.inviteCode });\n}));',
  'app.post("/api/boards/:boardId/invite-link", asyncRoute(async (request, response) => {\n  const boardId = request.params.boardId;\n  const membership = await prisma.boardMember.findUnique({\n    where: { boardId_userId: { boardId, userId: request.currentUser!.id } },\n  });\n  if (!membership || membership.role !== "admin") {\n    response.status(403).json({ error: "Only board admins can generate invite links." });\n    return;\n  }\n\n  let board = await prisma.board.findUnique({ where: { id: boardId } });\n  if (!board) {\n    response.status(404).json({ error: "Board not found." });\n    return;\n  }\n\n  if (!(board as any).inviteCode) {\n    const inviteCode = Math.random().toString(36).substring(2, 10);\n    board = await prisma.board.update({\n      where: { id: boardId },\n      data: { inviteCode },\n    });\n  }\n\n  response.json({ inviteCode: (board as any).inviteCode });\n}));'
);

replaceOnce(
  'app.get("/api/organizations/invite/:inviteCode", asyncRoute(async (request, response) => {\n  const inviteCode = request.params.inviteCode;\n  const organization = await prisma.organization.findUnique({\n    where: { inviteCode },\n    select: { id: true, name: true, _count: { select: { members: true } } },\n  });\n\n  if (!organization) {\n    response.status(404).json({ error: "Invalid or expired invite link." });\n    return;\n  }\n\n  response.json({ \n    id: organization.id, \n    name: organization.name, \n    memberCount: organization._count.members \n  });\n}));',
  'app.get("/api/boards/invite/:inviteCode", asyncRoute(async (request, response) => {\n  const inviteCode = request.params.inviteCode;\n  const board = await prisma.board.findUnique({\n    where: { inviteCode },\n    select: { id: true, title: true, background: true, _count: { select: { members: true } } },\n  });\n\n  if (!board) {\n    response.status(404).json({ error: "Invalid or expired invite link." });\n    return;\n  }\n\n  response.json({ \n    id: board.id, \n    title: board.title, \n    background: board.background, \n    memberCount: board._count.members \n  });\n}));'
);

replaceOnce(
  'app.post("/api/organizations/join/:inviteCode", asyncRoute(async (request, response) => {\n  const inviteCode = request.params.inviteCode;\n  const user = request.currentUser!;\n\n  const organization = await prisma.organization.findUnique({\n    where: { inviteCode },\n  });\n\n  if (!organization) {\n    response.status(404).json({ error: "Invalid or expired invite link." });\n    return;\n  }\n\n  await prisma.organizationMember.upsert({\n    where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },\n    update: {},\n    create: { organizationId: organization.id, userId: user.id, role: "member" },\n  });\n\n  const boards = await prisma.board.findMany({\n    where: { organizationId: organization.id },\n    select: { id: true },\n  });\n\n  if (boards.length > 0) {\n    await prisma.boardMember.createMany({\n      data: boards.map((board) => ({ boardId: board.id, userId: user.id, role: "member" })),\n      skipDuplicates: true,\n    });\n  }\n\n  response.status(200).json({\n    organizations: await getOrganizationSummaries(user.id),\n    joinedOrganizationId: organization.id,\n  });\n}));',
  'app.post("/api/boards/join/:inviteCode", asyncRoute(async (request, response) => {\n  const inviteCode = request.params.inviteCode;\n  const user = request.currentUser!;\n\n  const board = await prisma.board.findUnique({\n    where: { inviteCode },\n  });\n\n  if (!board) {\n    response.status(404).json({ error: "Invalid or expired invite link." });\n    return;\n  }\n\n  if (board.organizationId) {\n    await prisma.organizationMember.upsert({\n      where: { organizationId_userId: { organizationId: board.organizationId, userId: user.id } },\n      update: {},\n      create: { organizationId: board.organizationId, userId: user.id, role: "member" },\n    });\n  }\n\n  await prisma.boardMember.upsert({\n    where: { boardId_userId: { boardId: board.id, userId: user.id } },\n    update: {},\n    create: { boardId: board.id, userId: user.id, role: "member" },\n  });\n\n  response.status(200).json({\n    board: await getBoardDetails(board.id),\n  });\n}));'
);

fs.writeFileSync("server/src/index.ts", c);
console.log("Backend endpoints patched successfully");
