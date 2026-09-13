import type { Board } from "../types";

export function exportBoardToCSV(board: Board) {
  const headers = [
    "Card Title",
    "List",
    "Completed",
    "Due Date",
    "Priority",
    "Labels",
    "Assignees",
    "Checklists",
    "Comments Count",
    "Created Date",
  ];

  const rows: string[][] = [];

  board.lists.forEach((list) => {
    list.cards
      .filter((c) => !c.isArchived)
      .forEach((card) => {
        const priorityLabel = card.labels.find((l) =>
          ["urgent", "high", "medium", "low"].includes(l.name.toLowerCase())
        );
        const priority = priorityLabel ? priorityLabel.name.toUpperCase() : "NORMAL";

        const labelsStr = card.labels.map((l) => l.name).join("; ");
        const assigneesStr = card.members.map((m) => m.name).join("; ");

        const totalChecklist = card.checklists.reduce((acc, cl) => acc + cl.items.length, 0);
        const completedChecklist = card.checklists.reduce(
          (acc, cl) => acc + cl.items.filter((i) => i.isComplete).length,
          0
        );
        const checklistStr = totalChecklist > 0 ? `${completedChecklist}/${totalChecklist}` : "";

        rows.push([
          card.title,
          list.title,
          card.isComplete ? "YES" : "NO",
          card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "",
          priority,
          labelsStr,
          assigneesStr,
          checklistStr,
          card.comments.length.toString(),
          new Date(card.createdAt).toISOString().split("T")[0],
        ]);
      });
  });

  function escapeCSV(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${slugify(board.title)}-cards.csv`);
}

export function exportBoardToJSON(board: Board) {
  const jsonString = JSON.stringify(board, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadBlob(blob, `${slugify(board.title)}-backup.json`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}
