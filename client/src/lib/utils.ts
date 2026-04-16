import type { Board, Card, FilterState } from "../types";

export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDueDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isOverdue(value: string | null) {
  if (!value) {
    return false;
  }

  const dueDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

export function isDueSoon(value: string | null) {
  if (!value) {
    return false;
  }

  const dueDate = new Date(value);
  const today = new Date();
  const diff = dueDate.getTime() - today.getTime();

  return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
}

export function getChecklistStats(card: Card) {
  const total = card.checklists.reduce((sum, checklist) => sum + checklist.items.length, 0);
  const completed = card.checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => item.isComplete).length,
    0,
  );

  return { total, completed };
}

export function filterBoard(board: Board, filters: FilterState) {
  const searchTerm = filters.search.trim().toLowerCase();
  const hasLabelFilters = filters.labelIds.length > 0;
  const hasMemberFilters = filters.memberIds.length > 0;
  const isDueFilterActive = filters.due !== "all";

  if (!searchTerm && !hasLabelFilters && !hasMemberFilters && !isDueFilterActive) {
    return board;
  }

  return {
    ...board,
    lists: board.lists.map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const matchesSearch = !searchTerm || card.title.toLowerCase().includes(searchTerm);
        const matchesLabels =
          !hasLabelFilters || filters.labelIds.every((labelId) => card.labels.some((label) => label.id === labelId));
        const matchesMembers =
          !hasMemberFilters ||
          filters.memberIds.every((memberId) => card.members.some((member) => member.id === memberId));
        const matchesDueDate =
          filters.due === "all" ||
          (filters.due === "overdue" && isOverdue(card.dueDate)) ||
          (filters.due === "due-soon" && isDueSoon(card.dueDate)) ||
          (filters.due === "no-date" && !card.dueDate);

        return matchesSearch && matchesLabels && matchesMembers && matchesDueDate;
      }),
    })),
  };
}

export function countVisibleCards(board: Board) {
  return board.lists.reduce((sum, list) => sum + list.cards.length, 0);
}

