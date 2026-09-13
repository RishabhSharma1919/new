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
  '  generateInviteCode(organizationId: string) {\n    return request<{ inviteCode: string }>(`/organizations/${organizationId}/invite-link`, {\n      method: "POST",\n    });\n  },\n  getInviteInfo(inviteCode: string) {\n    return request<{ id: string; name: string; memberCount: number }>(`/organizations/invite/${inviteCode}`, {\n      method: "GET",\n    });\n  },\n  joinOrganization(inviteCode: string) {\n    return request<{ organizations: any[]; joinedOrganizationId: string }>(`/organizations/join/${inviteCode}`, {\n      method: "POST",\n    });\n  },\n};',
  '  generateInviteCode(boardId: string) {\n    return request<{ inviteCode: string }>(`/boards/${boardId}/invite-link`, {\n      method: "POST",\n    });\n  },\n  getInviteInfo(inviteCode: string) {\n    return request<{ id: string; title: string; background: string; memberCount: number }>(`/boards/invite/${inviteCode}`, {\n      method: "GET",\n    });\n  },\n  joinBoard(inviteCode: string) {\n    return request<{ board: any }>(`/boards/join/${inviteCode}`, {\n      method: "POST",\n    });\n  },\n};'
);

fs.writeFileSync("client/src/lib/api.ts", c);
console.log("Client API patched successfully");
