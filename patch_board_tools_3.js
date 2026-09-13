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
  '  async function handleGenerateInvite() {\n    if (!board?.organizationId) return;\n    try {\n      const res = await api.generateInviteCode(board.organizationId);\n      setInviteLink(`${window.location.origin}/#invite=${res.inviteCode}`);\n      setInviteMessage(null);\n    } catch (err: any) {\n      setInviteMessage(err.message || "Failed to generate invite link. Ensure you are an org admin.");\n    }\n  }',
  '  async function handleGenerateInvite() {\n    if (!board?.id) return;\n    try {\n      const res = await api.generateInviteCode(board.id);\n      setInviteLink(`${window.location.origin}/#invite=${res.inviteCode}`);\n      setInviteMessage(null);\n    } catch (err: any) {\n      setInviteMessage(err.message || "Failed to generate invite link. Ensure you are a board admin.");\n    }\n  }'
);

replaceOnce(
  '              {activeBoard.organizationId && (\n                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>\n                  <p style={{ marginBottom: "0.5rem" }}>Or share an invite link (Admins only):</p>\n                  {inviteLink ? (\n                    <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)" }} />\n                  ) : (\n                    <button type="button" className="ghost-button" onClick={handleGenerateInvite}>Generate Invite Link</button>\n                  )}\n                </div>\n              )}',
  '              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>\n                <p style={{ marginBottom: "0.5rem" }}>Or share an invite link (Admins only):</p>\n                {inviteLink ? (\n                  <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)" }} />\n                ) : (\n                  <button type="button" className="ghost-button" onClick={handleGenerateInvite}>Generate Invite Link</button>\n                )}\n              </div>'
);

fs.writeFileSync("client/src/components/BoardToolsPanel.tsx", c);
console.log("BoardToolsPanel patched successfully");
