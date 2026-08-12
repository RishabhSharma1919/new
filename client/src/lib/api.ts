import type { BoardResponse, BoardSummary } from "../types";

let baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
let authToken = typeof window !== "undefined" ? window.localStorage.getItem("working-place-token") : null;

// Ensure the URL ends with /api
if (baseUrl && !baseUrl.endsWith("/api") && !baseUrl.endsWith("/api/")) {
  baseUrl = `${baseUrl.replace(/\/$/, "")}/api`;
}

const API_BASE_URL = baseUrl;
export const socketUrl = API_BASE_URL.replace(/\/api\/?$/, "");
export function setAuthToken(token: string | null) { authToken = token; }
export type SessionUser = { id: string; name: string; email: string; avatar: string; color: string };

export type BoardsPayload = {
  boards: BoardSummary[];
  backgrounds: string[];
};

export async function fetcher<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
  register(payload: { name: string; email: string; password: string }) {
    return request<{ user: SessionUser; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  login(payload: { email: string; password: string }) {
    return request<{ user: SessionUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
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
  inviteMember(boardId: string, payload: { email: string; name?: string }) {
    return request<BoardResponse>(`/boards/${boardId}/members`, { method: "POST", body: JSON.stringify(payload) });
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
      isComplete?: boolean;
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
  createLabel(boardId: string, payload: { name: string; color: string }) {
    return request<BoardResponse>(`/boards/${boardId}/labels`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateLabel(labelId: string, payload: { name?: string; color?: string }) {
    return request<BoardResponse>(`/labels/${labelId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteLabel(labelId: string) {
    return request<BoardResponse>(`/labels/${labelId}`, {
      method: "DELETE",
    });
  },
  deleteBoard(boardId: string) {
    return request<BoardsPayload>(`/boards/${boardId}`, {
      method: "DELETE",
    });
  },
};
