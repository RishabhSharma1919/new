const fs = require("fs");
let c = fs.readFileSync("client/src/lib/api.ts", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  '  if (!response.ok) {\n    const payload = await response.json().catch(() => null);\n    throw new Error(payload?.error ?? "Request failed.");\n  }',
  '  if (!response.ok) {\n    const payload = await response.json().catch(() => null);\n    if (response.status === 401 && typeof window !== "undefined") {\n      window.localStorage.removeItem("working-place-user");\n      window.localStorage.removeItem("working-place-token");\n      authToken = null;\n    }\n    throw new Error(payload?.error ?? "Request failed.");\n  }'
);

replaceOnce(
  '  if (!response.ok) {\n    const payload = await response.json().catch(() => null);\n    throw new Error(payload?.error ?? "Request failed.");\n  }',
  '  if (!response.ok) {\n    const payload = await response.json().catch(() => null);\n    if (response.status === 401 && typeof window !== "undefined") {\n      window.localStorage.removeItem("working-place-user");\n      window.localStorage.removeItem("working-place-token");\n      authToken = null;\n    }\n    throw new Error(payload?.error ?? "Request failed.");\n  }'
);

replaceOnce(
  '  login(payload: { email: string; password: string }) {\n    return request<{ user: SessionUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });\n  },',
  '  login(payload: { email: string; password: string }) {\n    return request<{ user: SessionUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });\n  },\n  async logout() {\n    await request<{ ok: boolean }>("/auth/logout", { method: "POST" }).catch(() => ({ ok: true }));\n    return { ok: true };\n  },'
);

replaceOnce(
  'createCard(payload: { listId: string; title: string }) {\n    return request<BoardResponse>("/cards", {\n      method: "POST",\n      body: JSON.stringify(payload),\n    });\n  },',
  'createCard(payload: { listId: string; title: string; description?: string; dueDate?: string }) {\n    return request<BoardResponse>("/cards", {\n      method: "POST",\n      body: JSON.stringify(payload),\n    });\n  },'
);

replaceOnce(
  '  deleteBoard(boardId: string) {\n    return request<BoardsPayload>(`/boards/${boardId}`, {\n      method: "DELETE",\n    });\n  },\n};',
  '  deleteBoard(boardId: string) {\n    return request<BoardsPayload>(`/boards/${boardId}`, {\n      method: "DELETE",\n    });\n  },\n  generateInviteCode(organizationId: string) {\n    return request<{ inviteCode: string }>(`/organizations/${organizationId}/invite-link`, {\n      method: "POST",\n    });\n  },\n  getInviteInfo(inviteCode: string) {\n    return request<{ id: string; name: string; memberCount: number }>(`/organizations/invite/${inviteCode}`, {\n      method: "GET",\n    });\n  },\n  joinOrganization(inviteCode: string) {\n    return request<{ organizations: any[]; joinedOrganizationId: string }>(`/organizations/join/${inviteCode}`, {\n      method: "POST",\n    });\n  },\n};'
);

fs.writeFileSync("client/src/lib/api.ts", c);
console.log("api.ts patched successfully");
