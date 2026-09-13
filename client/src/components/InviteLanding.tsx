import { useEffect, useState } from "react";
import { api } from "../lib/api";

type InviteLandingProps = {
  inviteCode: string;
  onJoinSuccess: (boardId: string) => void;
  onCancel: () => void;
};

export function InviteLanding({ inviteCode, onJoinSuccess, onCancel }: InviteLandingProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardInfo, setBoardInfo] = useState<{ id: string; title: string; background: string; memberCount: number } | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.getInviteInfo(inviteCode)
      .then(setBoardInfo)
      .catch((err) => setError(err.message || "Invalid or expired invite link."))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      const res = await api.joinBoard(inviteCode);
      onJoinSuccess(res.board.id);
    } catch (err: any) {
      setError(err.message || "Failed to join board.");
      setJoining(false);
    }
  }

  if (loading) {
    return <div className="app-loader">Loading invite info...</div>;
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <svg className="auth-logo" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M3 3h18v18H3z" />
          </svg>
          <h1>Join Board</h1>
        </div>

        {error ? (
          <div className="notice-banner">{error}</div>
        ) : (
          <div className="invite-content" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p>You have been invited to join</p>
            <h2 style={{ margin: "1rem 0", fontSize: "1.5rem" }}>{boardInfo?.title}</h2>
            <p style={{ color: "var(--text-secondary)" }}>{boardInfo?.memberCount} member(s)</p>
          </div>
        )}

        <div className="auth-actions" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button className="auth-button" type="button" onClick={handleJoin} disabled={joining || !!error}>
            {joining ? "Joining..." : "Accept Invite"}
          </button>
          <button className="auth-button" style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid var(--border-color)" }} type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
