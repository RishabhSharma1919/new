import { useMemo } from "react";
import type { Board } from "../types";

type Props = {
  board: Board;
};

export function AnalyticsView({ board }: Props) {
  const stats = useMemo(() => {
    const allCards = board.lists.flatMap((l) =>
      l.cards.filter((c) => !c.isArchived).map((c) => ({ ...c, listTitle: l.title }))
    );

    const totalCards = allCards.length;
    const completedCards = allCards.filter((c) => c.isComplete).length;
    const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

    const overdueCards = allCards.filter(
      (c) => c.dueDate && new Date(c.dueDate).getTime() < Date.now() && !c.isComplete
    ).length;

    const dueSoonCards = allCards.filter((c) => {
      if (!c.dueDate || c.isComplete) return false;
      const diff = new Date(c.dueDate).getTime() - Date.now();
      return diff > 0 && diff <= 48 * 3600 * 1000;
    }).length;

    // Priority counts
    const priorityCounts: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
      normal: 0,
    };

    allCards.forEach((c) => {
      const priorityLabel = c.labels.find((l) =>
        ["urgent", "high", "medium", "low"].includes(l.name.toLowerCase())
      );
      if (priorityLabel) {
        priorityCounts[priorityLabel.name.toLowerCase()]++;
      } else {
        priorityCounts.normal++;
      }
    });

    // Member workload
    const memberMap: Record<
      string,
      { name: string; avatar: string; color: string; cardCount: number; completedCount: number }
    > = {};

    board.members.forEach((m) => {
      memberMap[m.id] = {
        name: m.name,
        avatar: m.avatar,
        color: m.color,
        cardCount: 0,
        completedCount: 0,
      };
    });

    allCards.forEach((c) => {
      c.members.forEach((m) => {
        if (!memberMap[m.id]) {
          memberMap[m.id] = {
            name: m.name,
            avatar: m.avatar,
            color: m.color,
            cardCount: 0,
            completedCount: 0,
          };
        }
        memberMap[m.id].cardCount++;
        if (c.isComplete) memberMap[m.id].completedCount++;
      });
    });

    // List distribution
    const listDistribution = board.lists.map((l) => ({
      title: l.title,
      count: l.cards.filter((c) => !c.isArchived).length,
    }));

    return {
      totalCards,
      completedCards,
      completionRate,
      overdueCards,
      dueSoonCards,
      priorityCounts,
      memberWorkload: Object.values(memberMap),
      listDistribution,
    };
  }, [board]);

  // Circumference for 45 radius = 2 * PI * 45 ≈ 282.74
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <h2>Sprint & Board Analytics</h2>
        <p>Real-time completion metrics, workload velocity, and priority allocation.</p>
      </div>

      <div className="analytics-stats-row">
        <div className="metric-card metric-card--primary">
          <span className="metric-card__label">Total Cards</span>
          <strong className="metric-card__value">{stats.totalCards}</strong>
          <span className="metric-card__sub">across {board.lists.length} lists</span>
        </div>

        <div className="metric-card metric-card--success">
          <span className="metric-card__label">Completed</span>
          <strong className="metric-card__value">{stats.completedCards}</strong>
          <span className="metric-card__sub">{stats.completionRate}% completion velocity</span>
        </div>

        <div className="metric-card metric-card--danger">
          <span className="metric-card__label">Overdue</span>
          <strong className="metric-card__value">{stats.overdueCards}</strong>
          <span className="metric-card__sub">needs immediate triage</span>
        </div>

        <div className="metric-card metric-card--warning">
          <span className="metric-card__label">Due in 48h</span>
          <strong className="metric-card__value">{stats.dueSoonCards}</strong>
          <span className="metric-card__sub">approaching deadlines</span>
        </div>
      </div>

      <div className="analytics-charts-grid">
        {/* Donut Completion Gauge */}
        <div className="analytics-chart-panel">
          <h3>Completion Velocity</h3>
          <div className="donut-wrapper">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="donut-bg-ring"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="donut-fill-ring"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="donut-center-text">
              <strong>{stats.completionRate}%</strong>
              <small>Done</small>
            </div>
          </div>
          <div className="donut-legend">
            <span>
              <span className="donut-dot donut-dot--done" /> {stats.completedCards} Finished
            </span>
            <span>
              <span className="donut-dot donut-dot--pending" />{" "}
              {stats.totalCards - stats.completedCards} Remaining
            </span>
          </div>
        </div>

        {/* Priority Allocation Bars */}
        <div className="analytics-chart-panel">
          <h3>Priority Distribution</h3>
          <div className="priority-bars-stack">
            {[
              { label: "Urgent", count: stats.priorityCounts.urgent, color: "#f87168" },
              { label: "High", count: stats.priorityCounts.high, color: "#ff9f1c" },
              { label: "Medium", count: stats.priorityCounts.medium, color: "#e5be26" },
              { label: "Low", count: stats.priorityCounts.low, color: "#579dff" },
              { label: "Standard", count: stats.priorityCounts.normal, color: "#8993a4" },
            ].map((p) => {
              const pct = stats.totalCards > 0 ? Math.round((p.count / stats.totalCards) * 100) : 0;
              return (
                <div key={p.label} className="priority-bar-item">
                  <div className="priority-bar-item__header">
                    <span style={{ color: p.color, fontWeight: 700 }}>{p.label}</span>
                    <span>
                      {p.count} cards ({pct}%)
                    </span>
                  </div>
                  <div className="priority-bar-track">
                    <div
                      className="priority-bar-fill"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Member Workload */}
        <div className="analytics-chart-panel analytics-chart-panel--full">
          <h3>Team Member Workload Allocation</h3>
          <div className="workload-grid">
            {stats.memberWorkload.length > 0 ? (
              stats.memberWorkload.map((m) => {
                const pct =
                  m.cardCount > 0 ? Math.round((m.completedCount / m.cardCount) * 100) : 0;
                return (
                  <div key={m.name} className="workload-member-card">
                    <div className="workload-member-card__top">
                      <span className="avatar-chip" style={{ backgroundColor: m.color }}>
                        {m.avatar}
                      </span>
                      <div className="workload-member-info">
                        <strong>{m.name}</strong>
                        <small>
                          {m.cardCount} cards assigned ({m.completedCount} completed)
                        </small>
                      </div>
                      <span className="workload-percent-badge">{pct}% Done</span>
                    </div>
                    <div className="workload-progress-bar">
                      <div
                        className="workload-progress-fill"
                        style={{ width: `${pct}%`, backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="empty-inline">No members assigned to cards yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
