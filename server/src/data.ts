import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

const boardDetailsArgs = Prisma.validator<Prisma.BoardDefaultArgs>()({
  include: {
    labels: {
      orderBy: {
        name: "asc",
      },
    },
    members: {
      include: {
        user: true,
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    },
    lists: {
      where: {
        isArchived: false,
      },
      orderBy: {
        position: "asc",
      },
      include: {
        cards: {
          where: {
            isArchived: false,
          },
          orderBy: {
            position: "asc",
          },
          include: {
            labels: {
              include: {
                label: true,
              },
            },
            members: {
              include: {
                user: true,
              },
            },
            checklists: {
              orderBy: {
                position: "asc",
              },
              include: {
                items: {
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
            attachments: {
              orderBy: {
                createdAt: "desc",
              },
            },
            comments: {
              orderBy: {
                createdAt: "desc",
              },
            },
            activities: {
              orderBy: {
                createdAt: "desc",
              },
              take: 20,
            },
          },
        },
      },
    },
  },
});

type BoardDetails = Prisma.BoardGetPayload<typeof boardDetailsArgs>;

export const BOARD_BACKGROUNDS = ["ocean", "sunset", "forest", "graphite", "midnight", "nebula"] as const;

export const DEFAULT_LIST_TITLES = ["To Do", "Doing", "Done"];

export const DEFAULT_LABELS = [
  { name: "Design", color: "#2563eb" },
  { name: "Frontend", color: "#7c3aed" },
  { name: "Backend", color: "#059669" },
  { name: "Priority", color: "#dc2626" },
];

export async function getBoardSummaries() {
  const boards = await prisma.board.findMany({
    orderBy: {
      createdAt: "asc",
    },
    include: {
      _count: {
        select: {
          lists: true,
        },
      },
      lists: {
        select: {
          _count: {
            select: {
              cards: {
                where: {
                  isArchived: false,
                },
              },
            },
          },
        },
      },
    },
  });

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    background: board.background,
    listCount: board._count.lists,
    cardCount: board.lists.reduce((total, list) => total + list._count.cards, 0),
  }));
}

export async function getBoardDetails(boardId: string) {
  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
    },
    ...boardDetailsArgs,
  });

  if (!board) {
    return null;
  }

  return serializeBoard(board);
}

export async function getBoardIdFromList(listId: string) {
  const list = await prisma.boardList.findUnique({
    where: {
      id: listId,
    },
    select: {
      boardId: true,
    },
  });

  return list?.boardId ?? null;
}

export async function getBoardIdFromCard(cardId: string) {
  const card = await prisma.card.findUnique({
    where: {
      id: cardId,
    },
    include: {
      list: {
        select: {
          boardId: true,
        },
      },
    },
  });

  return card?.list.boardId ?? null;
}

export async function getBoardIdFromChecklist(checklistId: string) {
  const checklist = await prisma.checklist.findUnique({
    where: {
      id: checklistId,
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

  return checklist?.card.list.boardId ?? null;
}

export async function getBoardIdFromChecklistItem(itemId: string) {
  const item = await prisma.checklistItem.findUnique({
    where: {
      id: itemId,
    },
    include: {
      checklist: {
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
      },
    },
  });

  return item?.checklist.card.list.boardId ?? null;
}

export async function recordActivity(cardId: string, action: string, message: string, actorName = "Arya Patel") {
  await prisma.activity.create({
    data: {
      cardId,
      action,
      message,
      actorName,
    },
  });
}

function serializeBoard(board: BoardDetails) {
  return {
    id: board.id,
    title: board.title,
    background: board.background,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    labels: board.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    members: board.members.map((memberLink) => ({
      id: memberLink.user.id,
      name: memberLink.user.name,
      avatar: memberLink.user.avatar,
      color: memberLink.user.color,
      role: memberLink.role,
    })),
    lists: board.lists.map((list) => ({
      id: list.id,
      title: list.title,
      position: list.position,
      cards: list.cards.map((card) => ({
        id: card.id,
        listId: card.listId,
        title: card.title,
        description: card.description,
        coverImage: card.coverImage,
        dueDate: card.dueDate,
        position: card.position,
        isArchived: card.isArchived,
        isComplete: card.isComplete,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt,
        labels: card.labels.map((cardLabel) => ({
          id: cardLabel.label.id,
          name: cardLabel.label.name,
          color: cardLabel.label.color,
        })),
        members: card.members.map((cardMember) => ({
          id: cardMember.user.id,
          name: cardMember.user.name,
          avatar: cardMember.user.avatar,
          color: cardMember.user.color,
        })),
        checklists: card.checklists.map((checklist) => ({
          id: checklist.id,
          title: checklist.title,
          position: checklist.position,
          items: checklist.items.map((item) => ({
            id: item.id,
            title: item.title,
            isComplete: item.isComplete,
            position: item.position,
          })),
        })),
        attachments: card.attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          fileUrl: attachment.fileUrl,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
          actorName: attachment.actorName,
          createdAt: attachment.createdAt,
        })),
        comments: card.comments.map((comment) => ({
          id: comment.id,
          message: comment.message,
          actorName: comment.actorName,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        })),
        activity: card.activities.map((activity) => ({
          id: activity.id,
          action: activity.action,
          message: activity.message,
          actorName: activity.actorName,
          createdAt: activity.createdAt,
        })),
      })),
    })),
  };
}
