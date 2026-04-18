export type BoardSummary = {
  id: string;
  title: string;
  background: string;
  listCount: number;
  cardCount: number;
};

export type Member = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role?: string;
};

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  isComplete: boolean;
  position: number;
};

export type Checklist = {
  id: string;
  title: string;
  position: number;
  items: ChecklistItem[];
};

export type Activity = {
  id: string;
  action: string;
  message: string;
  actorName: string | null;
  createdAt: string;
};

export type Attachment = {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  actorName: string | null;
  createdAt: string;
};

export type Comment = {
  id: string;
  message: string;
  actorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Card = {
  id: string;
  listId: string;
  title: string;
  description: string;
  coverImage: string | null;
  dueDate: string | null;
  position: number;
  isArchived: boolean;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
  labels: Label[];
  members: Member[];
  checklists: Checklist[];
  attachments: Attachment[];
  comments: Comment[];
  activity: Activity[];
};

export type BoardList = {
  id: string;
  title: string;
  position: number;
  cards: Card[];
};

export type Board = {
  id: string;
  title: string;
  background: string;
  createdAt: string;
  updatedAt: string;
  labels: Label[];
  members: Member[];
  lists: BoardList[];
};

export type DueFilter = "all" | "overdue" | "due-soon" | "no-date";

export type FilterState = {
  search: string;
  labelIds: string[];
  memberIds: string[];
  due: DueFilter;
};

export type BoardResponse = {
  board: Board;
  boards?: BoardSummary[];
};
