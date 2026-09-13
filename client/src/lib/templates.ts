export type BoardTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  background: "ocean" | "sunset" | "forest" | "graphite" | "midnight" | "nebula";
  lists: {
    title: string;
    cards: {
      title: string;
      description?: string;
      priority?: "urgent" | "high" | "medium" | "low";
      daysFromNow?: number;
    }[];
  }[];
};

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "template-sprint",
    name: "Software Engineering Sprint",
    icon: "🚀",
    description: "Agile Kanban board with backlog, review cycle, QA, and release management.",
    background: "ocean",
    lists: [
      {
        title: "Sprint Backlog",
        cards: [
          { title: "Refactor auth token refresh handler", priority: "high", daysFromNow: 5 },
          { title: "Optimize database indexes on cards table", priority: "medium", daysFromNow: 7 },
        ],
      },
      {
        title: "In Progress",
        cards: [
          { title: "Implement real-time socket presence indicators", priority: "urgent", daysFromNow: 2 },
          { title: "Dark mode contrast improvements", priority: "high", daysFromNow: 1 },
        ],
      },
      {
        title: "Code Review",
        cards: [
          { title: "PR #42: Add markdown description previews", priority: "medium", daysFromNow: 1 },
        ],
      },
      {
        title: "QA & Verification",
        cards: [
          { title: "Cross-browser mobile viewport testing", priority: "low", daysFromNow: 3 },
        ],
      },
      {
        title: "Done 🎉",
        cards: [
          { title: "Initial PostgreSQL schema setup & migrations", priority: "urgent" },
        ],
      },
    ],
  },
  {
    id: "template-design",
    name: "Design & Product Pipeline",
    icon: "🎨",
    description: "Track user research, wireframes, prototypes, and asset handoffs.",
    background: "sunset",
    lists: [
      {
        title: "Design Requests",
        cards: [
          { title: "App store icon and promotional banner graphics", priority: "high", daysFromNow: 4 },
        ],
      },
      {
        title: "Wireframing",
        cards: [
          { title: "Mobile navigation bottom-bar UX flows", priority: "medium", daysFromNow: 6 },
        ],
      },
      {
        title: "Prototyping",
        cards: [
          { title: "Interactive card drag transition micro-animations", priority: "high", daysFromNow: 2 },
        ],
      },
      {
        title: "Approved for Engineering",
        cards: [
          { title: "Design system tokens & typography hierarchy", priority: "urgent" },
        ],
      },
    ],
  },
  {
    id: "template-bug-tracker",
    name: "Bug & Issue Tracker",
    icon: "🐞",
    description: "Triage customer reported bugs, repro steps, fixes, and regression testing.",
    background: "nebula",
    lists: [
      {
        title: "Reported Issues",
        cards: [
          { title: "Safari cursor jumping on textarea focus", priority: "high", daysFromNow: 2 },
        ],
      },
      {
        title: "Triaged & Confirmed",
        cards: [
          { title: "Session timeout redirect loop when offline", priority: "urgent", daysFromNow: 1 },
        ],
      },
      {
        title: "Fix in Progress",
        cards: [
          { title: "White text contrast on light mode card titles", priority: "urgent", daysFromNow: 1 },
        ],
      },
      {
        title: "Ready for Release",
        cards: [
          { title: "CORS regex handling trailing slashes", priority: "low" },
        ],
      },
    ],
  },
  {
    id: "template-launch",
    name: "Product Launch Roadmap",
    icon: "🎯",
    description: "Orchestrate feature freeze, security audits, marketing prep, and public launch.",
    background: "forest",
    lists: [
      {
        title: "Feature Freeze",
        cards: [
          { title: "Audit bundle size and asset compression", priority: "high", daysFromNow: 8 },
        ],
      },
      {
        title: "Marketing & PR",
        cards: [
          { title: "Write launch announcement blog post", priority: "medium", daysFromNow: 10 },
          { title: "Prepare demo GIF recordings and screenshots", priority: "high", daysFromNow: 5 },
        ],
      },
      {
        title: "Launch Day Checklist",
        cards: [
          { title: "Database backup snapshot", priority: "urgent", daysFromNow: 12 },
          { title: "Deploy to production endpoint", priority: "urgent", daysFromNow: 12 },
        ],
      },
      {
        title: "Post-Launch Monitoring",
        cards: [
          { title: "Monitor error rates and user analytics", priority: "medium" },
        ],
      },
    ],
  },
];
