import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function makeSvgDataUrl(title: string, accentColor: string, backgroundColor: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${backgroundColor}" />
          <stop offset="100%" stop-color="${accentColor}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" rx="36" />
      <circle cx="1040" cy="128" r="144" fill="rgba(255,255,255,0.18)" />
      <circle cx="140" cy="520" r="168" fill="rgba(255,255,255,0.12)" />
      <text x="84" y="236" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" opacity="0.76">
        Card Cover
      </text>
      <text x="84" y="332" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="700">
        ${title}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const boardLaunchCover = makeSvgDataUrl("Kanban Drag Pass", "#0f766e", "#2563eb");
const personalSprintCover = makeSvgDataUrl("Docs Sprint", "#9a3412", "#fb923c");

const users = [
  { id: "user_arya", name: "Arya Patel", email: "arya@example.com", avatar: "AP", color: "#0f766e" },
  { id: "user_zoe", name: "Zoe Kim", email: "zoe@example.com", avatar: "ZK", color: "#b45309" },
  { id: "user_liam", name: "Liam Chen", email: "liam@example.com", avatar: "LC", color: "#7c3aed" },
];

const boardDefinitions = [
  {
    id: "board_launch",
    title: "Product Launch Roadmap",
    background: "ocean",
    labels: [
      { id: "label_design", name: "Design", color: "#2563eb" },
      { id: "label_backend", name: "Backend", color: "#059669" },
      { id: "label_priority", name: "High Priority", color: "#dc2626" },
      { id: "label_research", name: "Research", color: "#7c3aed" },
    ],
    lists: [
      {
        id: "list_backlog",
        title: "Backlog",
        cards: [
          {
            id: "card_competitor",
            title: "Map Trello interaction patterns",
            description:
              "Review Trello board spacing, card hierarchy, and the board header patterns before polishing the UI.",
            dueDate: "2026-04-18T00:00:00.000Z",
            labelIds: ["label_design", "label_research"],
            memberIds: ["user_arya"],
            checklists: [
              {
                id: "checklist_competitor",
                title: "Research checklist",
                items: [
                  { id: "item_research_1", title: "Capture screenshot references", isComplete: true },
                  { id: "item_research_2", title: "Document card spacing and shadows", isComplete: false },
                ],
              },
            ],
            activities: [
              { id: "activity_competitor_1", action: "create", message: "created this card", actorName: "Arya Patel" },
            ],
          },
          {
            id: "card_seed",
            title: "Design PostgreSQL schema",
            description:
              "Model boards, lists, cards, members, labels, and checklists with clear foreign keys and ordering columns.",
            dueDate: "2026-04-19T00:00:00.000Z",
            labelIds: ["label_backend", "label_priority"],
            memberIds: ["user_liam"],
            checklists: [
              {
                id: "checklist_seed",
                title: "Schema tasks",
                items: [
                  { id: "item_seed_1", title: "Add list ordering", isComplete: true },
                  { id: "item_seed_2", title: "Add card assignment tables", isComplete: true },
                  { id: "item_seed_3", title: "Seed realistic demo data", isComplete: false },
                ],
              },
            ],
            activities: [
              { id: "activity_seed_1", action: "update", message: "added due date and checklist", actorName: "Liam Chen" },
            ],
          },
        ],
      },
      {
        id: "list_progress",
        title: "In Progress",
        cards: [
          {
            id: "card_kanban",
            title: "Build drag and drop board",
            description:
              "Implement horizontal drag and drop for lists and vertical drag and drop for cards to mirror Trello's workflow.",
            coverImage: boardLaunchCover,
            dueDate: "2026-04-17T00:00:00.000Z",
            labelIds: ["label_design", "label_backend", "label_priority"],
            memberIds: ["user_arya", "user_zoe"],
            attachments: [
              {
                id: "attachment_kanban_notes",
                name: "interaction-notes.txt",
                fileUrl:
                  "data:text/plain;charset=utf-8,Refine%20cursor%20alignment%20and%20card%20drop%20feedback%20before%20handoff.",
                mimeType: "text/plain",
                sizeBytes: 76,
                actorName: "Arya Patel",
              },
              {
                id: "attachment_kanban_cover",
                name: "drag-cover.svg",
                fileUrl: boardLaunchCover,
                mimeType: "image/svg+xml",
                sizeBytes: 2048,
                actorName: "Arya Patel",
              },
            ],
            comments: [
              {
                id: "comment_kanban_1",
                message: "Cursor offset still shows up when dragging from filtered columns. Patch this before review.",
                actorName: "Arya Patel",
              },
            ],
            checklists: [
              {
                id: "checklist_kanban",
                title: "Core interactions",
                items: [
                  { id: "item_kanban_1", title: "Support list reordering", isComplete: true },
                  { id: "item_kanban_2", title: "Support card movement between lists", isComplete: false },
                  { id: "item_kanban_3", title: "Persist changes to database", isComplete: false },
                ],
              },
            ],
            activities: [
              { id: "activity_kanban_1", action: "comment", message: "moved into In Progress", actorName: "Zoe Kim" },
            ],
          },
        ],
      },
      {
        id: "list_done",
        title: "Done",
        cards: [
          {
            id: "card_seed_members",
            title: "Seed sample members",
            description:
              "Create a default team so cards can be assigned without an authentication system.",
            dueDate: null,
            labelIds: ["label_backend"],
            memberIds: ["user_arya", "user_liam"],
            checklists: [
              {
                id: "checklist_members",
                title: "Seeding",
                items: [
                  { id: "item_members_1", title: "Create board members", isComplete: true },
                  { id: "item_members_2", title: "Attach members to cards", isComplete: true },
                ],
              },
            ],
            activities: [
              { id: "activity_members_1", action: "complete", message: "marked as done", actorName: "Arya Patel" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "board_personal",
    title: "Personal Sprint",
    background: "sunset",
    labels: [
      { id: "label_writing", name: "Writing", color: "#0f766e" },
      { id: "label_admin", name: "Admin", color: "#d97706" },
      { id: "label_focus", name: "Focus", color: "#b91c1c" },
    ],
    lists: [
      {
        id: "list_today",
        title: "Today",
        cards: [
          {
            id: "card_docs",
            title: "Polish README and deployment notes",
            description: "Document setup, seed steps, assumptions, and deployment instructions for reviewers.",
            coverImage: personalSprintCover,
            dueDate: "2026-04-16T00:00:00.000Z",
            labelIds: ["label_writing", "label_focus"],
            memberIds: ["user_zoe"],
            attachments: [
              {
                id: "attachment_docs_cover",
                name: "docs-cover.svg",
                fileUrl: personalSprintCover,
                mimeType: "image/svg+xml",
                sizeBytes: 2048,
                actorName: "Zoe Kim",
              },
            ],
            comments: [
              {
                id: "comment_docs_1",
                message: "Add a quick note about the seeded demo data so reviewers know what to expect.",
                actorName: "Zoe Kim",
              },
            ],
            checklists: [
              {
                id: "checklist_docs",
                title: "Docs",
                items: [
                  { id: "item_docs_1", title: "Write setup section", isComplete: false },
                  { id: "item_docs_2", title: "List environment variables", isComplete: false },
                ],
              },
            ],
            activities: [
              { id: "activity_docs_1", action: "create", message: "created this card", actorName: "Zoe Kim" },
            ],
          },
        ],
      },
      {
        id: "list_later",
        title: "Later",
        cards: [],
      },
    ],
  },
];

async function main() {
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.cardMember.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.card.deleteMany();
  await prisma.boardList.deleteMany();
  await prisma.label.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({ data: users });

  for (const boardDef of boardDefinitions) {
    await prisma.board.create({
      data: {
        id: boardDef.id,
        title: boardDef.title,
        background: boardDef.background,
        members: {
          create: users.map((user) => ({
            userId: user.id,
            role: user.id === "user_arya" ? "admin" : "member",
          })),
        },
        labels: {
          create: boardDef.labels,
        },
        lists: {
          create: boardDef.lists.map((list, listIndex) => ({
            id: list.id,
            title: list.title,
            position: listIndex,
            cards: {
              create: list.cards.map((card, cardIndex) => ({
                id: card.id,
                title: card.title,
                description: card.description,
                coverImage: card.coverImage,
                dueDate: card.dueDate,
                position: cardIndex,
                labels: {
                  create: card.labelIds.map((labelId) => ({
                    labelId,
                  })),
                },
                members: {
                  create: card.memberIds.map((userId) => ({
                    userId,
                  })),
                },
                checklists: {
                  create: card.checklists.map((checklist, checklistIndex) => ({
                    id: checklist.id,
                    title: checklist.title,
                    position: checklistIndex,
                    items: {
                      create: checklist.items.map((item, itemIndex) => ({
                        id: item.id,
                        title: item.title,
                        isComplete: item.isComplete,
                        position: itemIndex,
                      })),
                    },
                  })),
                },
                attachments: {
                  create: (card.attachments ?? []).map((attachment) => ({
                    id: attachment.id,
                    name: attachment.name,
                    fileUrl: attachment.fileUrl,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.sizeBytes,
                    actorName: attachment.actorName,
                  })),
                },
                comments: {
                  create: (card.comments ?? []).map((comment) => ({
                    id: comment.id,
                    message: comment.message,
                    actorName: comment.actorName,
                  })),
                },
                activities: {
                  create: card.activities,
                },
              })),
            },
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
