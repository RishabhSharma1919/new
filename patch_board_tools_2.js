const fs = require("fs");
let c = fs.readFileSync("client/src/components/BoardToolsPanel.tsx", "utf8");
c = c.replace(/\r\n/g, "\n");

function replaceOnce(search, replacement) {
  if (c.indexOf(search) === -1) {
    console.log("Could not find:\\n" + search);
    process.exit(1);
  }
  c = c.replace(search, replacement);
}

replaceOnce(
  '  const handleGenerateLink = async () => {\n    if (!board.organizationId) return;\n    setIsGeneratingLink(true);\n    try {\n      const response = await api.generateInviteCode(board.organizationId);\n      setInviteLink(`${window.location.origin}/#invite=${response.inviteCode}`);\n    } catch (err: any) {\n      alert(err.message || "Failed to generate invite link");\n    } finally {\n      setIsGeneratingLink(false);\n    }\n  };',
  '  const handleGenerateLink = async () => {\n    if (!board.id) return;\n    setIsGeneratingLink(true);\n    try {\n      const response = await api.generateInviteCode(board.id);\n      setInviteLink(`${window.location.origin}/#invite=${response.inviteCode}`);\n    } catch (err: any) {\n      alert(err.message || "Failed to generate invite link");\n    } finally {\n      setIsGeneratingLink(false);\n    }\n  };'
);

replaceOnce(
  '                    <button\n                      onClick={handleGenerateLink}\n                      disabled={isGeneratingLink || !board.organizationId}\n                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50"\n                    >\n                      {isGeneratingLink ? "Generating..." : "Generate Invite Link"}\n                    </button>\n                  )}\n                  {!board.organizationId && !inviteLink && (\n                    <p className="text-xs text-amber-600 mt-2">\n                      This board is not part of a workspace yet.\n                    </p>\n                  )}',
  '                    <button\n                      onClick={handleGenerateLink}\n                      disabled={isGeneratingLink}\n                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50"\n                    >\n                      {isGeneratingLink ? "Generating..." : "Generate Invite Link"}\n                    </button>\n                  )}'
);

fs.writeFileSync("client/src/components/BoardToolsPanel.tsx", c);
console.log("BoardToolsPanel patched successfully");
