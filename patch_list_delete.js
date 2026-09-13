const fs = require("fs");

let a = fs.readFileSync("client/src/App.tsx", "utf8");
a = a.replace(/\r\n/g, "\n");
a = a.replace(
  '  async function handleDeleteList(listId: string) {\n    if (!window.confirm("Delete this list and all of its cards?")) {\n      return;\n    }\n\n    await syncBoardMutation(api.deleteList(listId));\n  }',
  '  async function handleDeleteList(listId: string) {\n    await syncBoardMutation(api.deleteList(listId));\n  }'
);
fs.writeFileSync("client/src/App.tsx", a);

let l = fs.readFileSync("client/src/components/ListColumn.tsx", "utf8");
l = l.replace(/\r\n/g, "\n");

l = l.replace(
  '  const [isCollapsed, setIsCollapsed] = useState(false);',
  '  const [isCollapsed, setIsCollapsed] = useState(false);\n  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);'
);

l = l.replace(
  '                <button\n                  className="list-column__menu"\n                  onClick={() => void onDeleteList(list.id)}\n                  type="button"\n                  aria-label="Delete list"\n                  title="Delete list"\n                >\n                  <svg aria-hidden="true" viewBox="0 0 24 24">\n                    <path\n                      d="M6.5 12h.01M12 12h.01M17.5 12h.01"\n                      fill="currentColor"\n                      stroke="currentColor"\n                      strokeLinecap="round"\n                      strokeLinejoin="round"\n                      strokeWidth="1.9"\n                    />\n                  </svg>\n                </button>',
  '                <div style={{ position: "relative" }}>\n                  <button\n                    className="list-column__menu"\n                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}\n                    type="button"\n                    aria-label="List options"\n                    title="List options"\n                  >\n                    <svg aria-hidden="true" viewBox="0 0 24 24">\n                      <path\n                        d="M6.5 12h.01M12 12h.01M17.5 12h.01"\n                        fill="currentColor"\n                        stroke="currentColor"\n                        strokeLinecap="round"\n                        strokeLinejoin="round"\n                        strokeWidth="1.9"\n                      />\n                    </svg>\n                  </button>\n                  {showDeleteConfirm && (\n                    <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", backgroundColor: "var(--bg-primary)", padding: "12px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10, width: "200px", border: "1px solid var(--border-color)" }}>\n                      <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: "12px", color: "var(--text-primary)" }}>Delete this list?</p>\n                      <div style={{ display: "flex", gap: "8px" }}>\n                        <button\n                          style={{ flex: 1, padding: "6px", backgroundColor: "var(--danger-color, #ef4444)", color: "white", borderRadius: "4px", fontSize: "13px", fontWeight: 500 }}\n                          onClick={() => { setShowDeleteConfirm(false); void onDeleteList(list.id); }}\n                        >\n                          Delete\n                        </button>\n                        <button\n                          style={{ flex: 1, padding: "6px", backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: "13px" }}\n                          onClick={() => setShowDeleteConfirm(false)}\n                        >\n                          Cancel\n                        </button>\n                      </div>\n                    </div>\n                  )}\n                </div>'
);
fs.writeFileSync("client/src/components/ListColumn.tsx", l);
console.log("Delete patch applied");
