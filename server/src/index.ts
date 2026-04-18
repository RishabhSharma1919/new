import { Prisma } from "@prisma/client";
import cors from "cors";
import express from "express";
import {
  BOARD_BACKGROUNDS,
  DEFAULT_LABELS,
  DEFAULT_LIST_TITLES,
  getBoardDetails,
  getBoardIdFromCard,
  getBoardIdFromChecklist,
  getBoardIdFromChecklistItem,
  getBoardIdFromList,
  getBoardSummaries,
  recordActivity,
} from "./data.js";
import { CORS_ORIGIN, PORT } from "./env.js";
import { prisma } from "./prisma.js";

const app = express();
const port = PORT;

const allowedOrigins = [
  "http://localhost:5173",
  "https://trellis-client-nine.vercel.app",
];

type AsyncRouteHandler = (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
) => Promise<void>;

function asyncRoute(handler: AsyncRouteHandler): express.RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || CORS_ORIGIN === origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get(
  "/api/health",
  asyncRoute(async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ ok: true });
    } catch {
      response.status(503).json({ ok: false, error: "Database is unavailable." });
    }
  }),
);

app.get(
  "/api/boards",
  asyncRoute(async (_request, response) => {
    const boards = await getBoardSummaries();
    response.json({ boards, backgrounds: BOARD_BACKGROUNDS });
  }),
);

app.post("/api/boards", asyncRoute(async (request, response) => {
  const title = asTitle(request.body?.title);
  const background = typeof request.body?.background === "string" ? request.body.background : "ocean";

  if (!title) {
    response.status(400).json({ error: "Board title is required." });
    return;
  }

  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const board = await prisma.board.create({
    data: {
      title,
      background: BOARD_BACKGROUNDS.includes(background as (typeof BOARD_BACKGROUNDS)[number])
        ? background
        : "ocean",
      members: {
        create: users.map((user, index) => ({
          userId: user.id,
          role: index === 0 ? "admin" : "member",
        })),
      },
      labels: {
        create: DEFAULT_LABELS,
      },
      lists: {
        create: DEFAULT_LIST_TITLES.map((listTitle, index) => ({
          title: listTitle,
          position: index,
        })),
      },
    },
  });

  response.status(201).json({
    board: await getBoardDetails(board.id),
    boards: await getBoardSummaries(),
  });
}));

app.get("/api/boards/:boardId", asyncRoute(async (request, response) => {
  const board = await getBoardDetails(request.params.boardId);

  if (!board) {
    response.status(404).json({ error: "Board not found." });
    return;
  }

  response.json({ board });
}));

app.patch("/api/boards/:boardId", asyncRoute(async (request, response) => {
  const boardId = request.params.boardId;
  const title = asTitle(request.body?.title);
  const background = request.body?.background;

  const data: Record<string, any> = {};
  if (title) data.title = title;
  if (typeof background === "string" && BOARD_BACKGROUNDS.includes(background as any)) {
    data.background = background;
  }

  if (Object.keys(data).length === 0) {
    response.status(400).json({ error: "Title or background is required." });
    return;
  }

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data,
  });

  response.json({
    board: await getBoardDetails(updatedBoard.id),
    boards: await getBoardSummaries(),
  });
}));

app.delete("/api/boards/:boardId", asyncRoute(async (request, response) => {
  const boardId = request.params.boardId;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    response.status(404).json({ error: "Board not found." });
    return;
  }

  await prisma.board.delete({
    where: { id: boardId },
  });

  response.json({
    boards: await getBoardSummaries(),
    backgrounds: BOARD_BACKGROUNDS,
  });
}));

app.post("/api/lists", asyncRoute(async (request, response) => {
  const boardId = asString(request.body?.boardId);
  const title = asTitle(request.body?.title);

  if (!boardId || !title) {
    response.status(400).json({ error: "Board and title are required." });
    return;
  }

  const maxList = await prisma.boardList.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.boardList.create({
    data: {
      boardId,
      title,
      position: (maxList?.position ?? -1) + 1,
    },
  });

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.patch("/api/lists/:listId", asyncRoute(async (request, response) => {
  const title = asTitle(request.body?.title);
  const isArchived = request.body?.isArchived;

  const boardId = await getBoardIdFromList(request.params.listId);

  if (!boardId) {
    response.status(404).json({ error: "List not found." });
    return;
  }

  const data: Record<string, any> = {};
  if (title) data.title = title;
  if (typeof isArchived === "boolean") data.isArchived = isArchived;

  if (Object.keys(data).length === 0) {
    response.status(400).json({ error: "Changes are required." });
    return;
  }

  await prisma.boardList.update({
    where: {
      id: request.params.listId,
    },
    data,
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.delete("/api/lists/:listId", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromList(request.params.listId);

  if (!boardId) {
    response.status(404).json({ error: "List not found." });
    return;
  }

  await prisma.boardList.delete({
    where: {
      id: request.params.listId,
    },
  });

  const remainingLists = await prisma.boardList.findMany({
    where: { boardId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  await updateListPositions(remainingLists.map((list) => list.id));

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/lists/reorder", asyncRoute(async (request, response) => {
  const boardId = asString(request.body?.boardId);
  const orderedListIds = asStringArray(request.body?.orderedListIds);

  if (!boardId || orderedListIds.length === 0) {
    response.status(400).json({ error: "Board and list ordering are required." });
    return;
  }

  await updateListPositions(orderedListIds);

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/cards", asyncRoute(async (request, response) => {
  const listId = asString(request.body?.listId);
  const title = asTitle(request.body?.title);

  if (!listId || !title) {
    response.status(400).json({ error: "List and title are required." });
    return;
  }

  const boardId = await getBoardIdFromList(listId);

  if (!boardId) {
    response.status(404).json({ error: "List not found." });
    return;
  }

  const maxCard = await prisma.card.findFirst({
    where: { listId, isArchived: false },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const card = await prisma.card.create({
    data: {
      listId,
      title,
      position: (maxCard?.position ?? -1) + 1,
    },
  });

  await recordActivity(card.id, "create", "created this card");

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.patch("/api/cards/:cardId", asyncRoute(async (request, response) => {
  const cardId = request.params.cardId;
  const boardId = await getBoardIdFromCard(cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  const title = request.body?.title;
  const description = request.body?.description;
  const dueDate = request.body?.dueDate;
  const coverImage = request.body?.coverImage;
  const labelIds = request.body?.labelIds;
  const memberIds = request.body?.memberIds;
  const isComplete = request.body?.isComplete;
  const hasCardDetailChanges =
    typeof title === "string" ||
    typeof description === "string" ||
    typeof dueDate === "string" ||
    typeof isComplete === "boolean" ||
    dueDate === null ||
    Array.isArray(labelIds) ||
    Array.isArray(memberIds);
  const hasCoverImageChange = typeof coverImage === "string" || coverImage === null;

  await prisma.$transaction(async (transaction) => {
    const updateData: Record<string, unknown> = {};

    if (typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (typeof description === "string") {
      updateData.description = description;
    }

    if (typeof dueDate === "string" || dueDate === null) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (typeof coverImage === "string" || coverImage === null) {
      updateData.coverImage = typeof coverImage === "string" && coverImage.trim() ? coverImage.trim() : null;
    }

    if (typeof isComplete === "boolean") {
      updateData.isComplete = isComplete;
    }

    if (Object.keys(updateData).length > 0) {
      await transaction.card.update({
        where: { id: cardId },
        data: updateData,
      });
    }

    if (Array.isArray(labelIds)) {
      await transaction.cardLabel.deleteMany({
        where: { cardId },
      });

      if (labelIds.length > 0) {
        await transaction.cardLabel.createMany({
          data: labelIds
            .filter((labelId): labelId is string => typeof labelId === "string")
            .map((labelId) => ({
              cardId,
              labelId,
            })),
        });
      }
    }

    if (Array.isArray(memberIds)) {
      await transaction.cardMember.deleteMany({
        where: { cardId },
      });

      if (memberIds.length > 0) {
        await transaction.cardMember.createMany({
          data: memberIds
            .filter((memberId): memberId is string => typeof memberId === "string")
            .map((memberId) => ({
              cardId,
              userId: memberId,
            })),
        });
      }
    }
  });

  if (hasCardDetailChanges) {
    await recordActivity(cardId, "update", "updated card details");
  }

  if (hasCoverImageChange) {
    await recordActivity(
      cardId,
      "cover",
      typeof coverImage === "string" && coverImage.trim() ? "updated the cover image" : "removed the cover image",
    );
  }

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/cards/:cardId/attachments", asyncRoute(async (request, response) => {
  const cardId = request.params.cardId;
  const boardId = await getBoardIdFromCard(cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  const name = asString(request.body?.name);
  const fileUrl = asString(request.body?.fileUrl);
  const mimeType = asString(request.body?.mimeType) ?? "application/octet-stream";
  const sizeBytes = asNumber(request.body?.sizeBytes);
  const setAsCover = request.body?.setAsCover === true && mimeType.startsWith("image/");

  if (!name || !fileUrl || sizeBytes === null) {
    response.status(400).json({ error: "Attachment name, file content, and size are required." });
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.attachment.create({
      data: {
        cardId,
        name,
        fileUrl,
        mimeType,
        sizeBytes,
        actorName: "Arya Patel",
      },
    });

    if (setAsCover) {
      await transaction.card.update({
        where: { id: cardId },
        data: {
          coverImage: fileUrl,
        },
      });
    }
  });

  await recordActivity(cardId, "attachment", `attached ${name}`);

  if (setAsCover) {
    await recordActivity(cardId, "cover", "updated the cover image");
  }

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.delete("/api/attachments/:attachmentId", asyncRoute(async (request, response) => {
  const attachment = await prisma.attachment.findUnique({
    where: {
      id: request.params.attachmentId,
    },
    include: {
      card: {
        include: {
          list: {
            select: {
              boardId: true,
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    response.status(404).json({ error: "Attachment not found." });
    return;
  }

  const shouldClearCover = attachment.card.coverImage === attachment.fileUrl;

  await prisma.$transaction(async (transaction) => {
    if (shouldClearCover) {
      await transaction.card.update({
        where: {
          id: attachment.cardId,
        },
        data: {
          coverImage: null,
        },
      });
    }

    await transaction.attachment.delete({
      where: {
        id: attachment.id,
      },
    });
  });

  await recordActivity(attachment.cardId, "attachment", `removed ${attachment.name}`);

  if (shouldClearCover) {
    await recordActivity(attachment.cardId, "cover", "removed the cover image");
  }

  response.json({ board: await getBoardDetails(attachment.card.list.boardId) });
}));

app.post("/api/cards/:cardId/comments", asyncRoute(async (request, response) => {
  const cardId = request.params.cardId;
  const boardId = await getBoardIdFromCard(cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  const message = asString(request.body?.message);

  if (!message) {
    response.status(400).json({ error: "Comment text is required." });
    return;
  }

  await prisma.comment.create({
    data: {
      cardId,
      message,
      actorName: "Arya Patel",
    },
  });

  await recordActivity(cardId, "comment", "added a comment");

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/cards/reorder", asyncRoute(async (request, response) => {
  const boardId = asString(request.body?.boardId);
  const sourceListId = asString(request.body?.sourceListId);
  const destinationListId = asString(request.body?.destinationListId);
  const sourceCardIds = asStringArray(request.body?.sourceCardIds);
  const destinationCardIds = asStringArray(request.body?.destinationCardIds);

  if (!boardId || !sourceListId || !destinationListId) {
    response.status(400).json({ error: "Card reorder payload is incomplete." });
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await Promise.all(
      sourceCardIds.map((cardId, index) =>
        transaction.card.update({
          where: { id: cardId },
          data: {
            listId: sourceListId,
            position: index,
          },
        }),
      ),
    );

    if (sourceListId !== destinationListId) {
      await Promise.all(
        destinationCardIds.map((cardId, index) =>
          transaction.card.update({
            where: { id: cardId },
            data: {
              listId: destinationListId,
              position: index,
            },
          }),
        ),
      );
    }
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/cards/:cardId/archive", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromCard(request.params.cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  await prisma.card.update({
    where: { id: request.params.cardId },
    data: { isArchived: true },
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.delete("/api/cards/:cardId", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromCard(request.params.cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  await prisma.card.delete({
    where: {
      id: request.params.cardId,
    },
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/cards/:cardId/checklists", asyncRoute(async (request, response) => {
  const cardId = request.params.cardId;
  const title = asTitle(request.body?.title) ?? "Checklist";
  const boardId = await getBoardIdFromCard(cardId);

  if (!boardId) {
    response.status(404).json({ error: "Card not found." });
    return;
  }

  const maxChecklist = await prisma.checklist.findFirst({
    where: { cardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.checklist.create({
    data: {
      cardId,
      title,
      position: (maxChecklist?.position ?? -1) + 1,
    },
  });

  await recordActivity(cardId, "checklist", "added a checklist");

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.patch("/api/checklists/:checklistId", asyncRoute(async (request, response) => {
  const title = asTitle(request.body?.title);
  const boardId = await getBoardIdFromChecklist(request.params.checklistId);

  if (!boardId) {
    response.status(404).json({ error: "Checklist not found." });
    return;
  }

  if (!title) {
    response.status(400).json({ error: "Checklist title is required." });
    return;
  }

  await prisma.checklist.update({
    where: { id: request.params.checklistId },
    data: { title },
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.delete("/api/checklists/:checklistId", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromChecklist(request.params.checklistId);

  if (!boardId) {
    response.status(404).json({ error: "Checklist not found." });
    return;
  }

  await prisma.checklist.delete({
    where: { id: request.params.checklistId },
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/checklists/:checklistId/items", asyncRoute(async (request, response) => {
  const checklistId = request.params.checklistId;
  const title = asTitle(request.body?.title);
  const boardId = await getBoardIdFromChecklist(checklistId);

  if (!boardId) {
    response.status(404).json({ error: "Checklist not found." });
    return;
  }

  if (!title) {
    response.status(400).json({ error: "Item title is required." });
    return;
  }

  const maxItem = await prisma.checklistItem.findFirst({
    where: { checklistId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.checklistItem.create({
    data: {
      checklistId,
      title,
      position: (maxItem?.position ?? -1) + 1,
    },
  });

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.patch("/api/checklist-items/:itemId", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromChecklistItem(request.params.itemId);

  if (!boardId) {
    response.status(404).json({ error: "Checklist item not found." });
    return;
  }

  const data: Record<string, unknown> = {};

  if (typeof request.body?.title === "string" && request.body.title.trim()) {
    data.title = request.body.title.trim();
  }

  if (typeof request.body?.isComplete === "boolean") {
    data.isComplete = request.body.isComplete;
  }

  if (Object.keys(data).length === 0) {
    response.status(400).json({ error: "Checklist item changes are required." });
    return;
  }

  await prisma.checklistItem.update({
    where: { id: request.params.itemId },
    data,
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.delete("/api/checklist-items/:itemId", asyncRoute(async (request, response) => {
  const boardId = await getBoardIdFromChecklistItem(request.params.itemId);

  if (!boardId) {
    response.status(404).json({ error: "Checklist item not found." });
    return;
  }

  await prisma.checklistItem.delete({
    where: { id: request.params.itemId },
  });

  response.json({ board: await getBoardDetails(boardId) });
}));

app.post("/api/boards/:boardId/labels", asyncRoute(async (request, response) => {
  const boardId = request.params.boardId;
  const name = asString(request.body?.name) ?? "";
  const color = asString(request.body?.color);

  if (!color) {
    response.status(400).json({ error: "Color is required." });
    return;
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    response.status(404).json({ error: "Board not found." });
    return;
  }

  await prisma.label.create({
    data: {
      boardId,
      name,
      color,
    },
  });

  response.status(201).json({ board: await getBoardDetails(boardId) });
}));

app.patch("/api/labels/:labelId", asyncRoute(async (request, response) => {
  const labelId = request.params.labelId;
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) {
    response.status(404).json({ error: "Label not found." });
    return;
  }

  const data: Record<string, string> = {};
  if (typeof request.body?.name === "string") {
    data.name = request.body.name;
  }
  if (typeof request.body?.color === "string" && request.body.color.trim()) {
    data.color = request.body.color.trim();
  }

  if (Object.keys(data).length === 0) {
    response.status(400).json({ error: "At least one field is required to update." });
    return;
  }

  await prisma.label.update({
    where: { id: labelId },
    data,
  });

  response.json({ board: await getBoardDetails(label.boardId) });
}));

app.delete("/api/labels/:labelId", asyncRoute(async (request, response) => {
  const labelId = request.params.labelId;
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label) {
    response.status(404).json({ error: "Label not found." });
    return;
  }

  await prisma.label.delete({
    where: { id: labelId },
  });

  response.json({ board: await getBoardDetails(label.boardId) });
}));

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      response.status(404).json({ error: "Requested record was not found." });
      return;
    }

    if (error.code === "P2003") {
      response.status(400).json({ error: "Referenced data was not found." });
      return;
    }
  }

  if (error instanceof Error && error.message === "Not allowed by CORS") {
    response.status(403).json({ error: "Origin is not allowed." });
    return;
  }

  response.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

async function updateListPositions(listIds: string[]) {
  await prisma.$transaction(
    listIds.map((listId, index) =>
      prisma.boardList.update({
        where: { id: listId },
        data: { position: index },
      }),
    ),
  );
}

function asTitle(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}
