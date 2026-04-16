import type { BoardResponse, BoardSummary } from "../types";

let baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// Ensure the URL ends with /api
if (baseUrl && !baseUrl.endsWith("/api") && !baseUrl.endsWith("/api/")) {
  baseUrl = `${baseUrl.replace(/\/$/, "")}/api`;
}

const API_BASE_URL = baseUrl;

export type BoardsPayload = {
  boards: BoardSummary[];
  backgrounds: string[];
};

export async function fetcher<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export const api = {
  getBoards() {
    return request<BoardsPayload>("/boards");
  },
  getBoard(boardId: string) {
    return request<BoardResponse>(`/boards/${boardId}`);
  },
  createBoard(payload: { title: string; background: string }) {
    return request<BoardResponse>("/boards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateBoard(boardId: string, payload: { title?: string; background?: string }) {
    return request<BoardResponse>(`/boards/${boardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  updateList(listId: string, payload: { title?: string; isArchived?: boolean }) {
    return request<BoardResponse>(`/lists/${listId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  createList(payload: { boardId: string; title: string }) {
    return request<BoardResponse>("/lists", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteList(listId: string) {
    return request<BoardResponse>(`/lists/${listId}`, {
      method: "DELETE",
    });
  },
  reorderLists(payload: { boardId: string; orderedListIds: string[] }) {
    return request<BoardResponse>("/lists/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  createCard(payload: { listId: string; title: string }) {
    return request<BoardResponse>("/cards", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCard(
    cardId: string,
    payload: {
      title?: string;
      description?: string;
      coverImage?: string | null;
      dueDate?: string | null;
      labelIds?: string[];
      memberIds?: string[];
    },
  ) {
    return request<BoardResponse>(`/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  createAttachment(
    cardId: string,
    payload: {
      name: string;
      fileUrl: string;
      mimeType: string;
      sizeBytes: number;
      setAsCover?: boolean;
    },
  ) {
    return request<BoardResponse>(`/cards/${cardId}/attachments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteAttachment(attachmentId: string) {
    return request<BoardResponse>(`/attachments/${attachmentId}`, {
      method: "DELETE",
    });
  },
  createComment(cardId: string, payload: { message: string }) {
    return request<BoardResponse>(`/cards/${cardId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  reorderCards(payload: {
    boardId: string;
    sourceListId: string;
    destinationListId: string;
    sourceCardIds: string[];
    destinationCardIds: string[];
  }) {
    return request<BoardResponse>("/cards/reorder", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  archiveCard(cardId: string) {
    return request<BoardResponse>(`/cards/${cardId}/archive`, {
      method: "POST",
    });
  },
  deleteCard(cardId: string) {
    return request<BoardResponse>(`/cards/${cardId}`, {
      method: "DELETE",
    });
  },
  createChecklist(cardId: string, payload: { title: string }) {
    return request<BoardResponse>(`/cards/${cardId}/checklists`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateChecklist(checklistId: string, payload: { title: string }) {
    return request<BoardResponse>(`/checklists/${checklistId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteChecklist(checklistId: string) {
    return request<BoardResponse>(`/checklists/${checklistId}`, {
      method: "DELETE",
    });
  },
  createChecklistItem(checklistId: string, payload: { title: string }) {
    return request<BoardResponse>(`/checklists/${checklistId}/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateChecklistItem(itemId: string, payload: { title?: string; isComplete?: boolean }) {
    return request<BoardResponse>(`/checklist-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteChecklistItem(itemId: string) {
    return request<BoardResponse>(`/checklist-items/${itemId}`, {
      method: "DELETE",
    });
  },
  deleteBoard(boardId: string) {
    return request<BoardsPayload>(`/boards/${boardId}`, {
      method: "DELETE",
    });
  },
};
