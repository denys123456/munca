import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useDashboard } from "../components/Shell.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters, usePeriod } from "../lib/useFilters.js";
import { label, money, number, percent } from "../lib/format.js";
import {
  Badge,
  DateRange,
  PageHeader,
  Panel,
  Progress,
  Resource,
  Table,
} from "../components/ui.jsx";
import { LeaderboardPodium, RankMomentum, sortLeaderboard } from "../components/DashboardViz.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const [dates, updateDates] = usePeriod();
  const [filters, update] = useFilters({ advisorType: "", sort: "rank" });
  const [previousRanks, setPreviousRanks] = useState({});
  const resource = useResource(
    query("/api/leaderboard", {
      dealershipId: user.dealershipId,
      ...dates,
      advisorType: user.role === "MANAGER" ? filters.advisorType : user.advisorType,
      page: 0,
      size: 50,
    }),
  );

  useEffect(() => {
    if (!resource.data?.content) return;
    const key = `championsclub.leaderboard.${user.dealershipId}.${filters.advisorType || user.advisorType || "all"}`;
    try {
      const previous = JSON.parse(localStorage.getItem(key) || "{}");
      setPreviousRanks(previous);
      const current = Object.fromEntries(resource.data.content.map((row) => [row.advisor.advisorId, row.rank]));
      localStorage.setItem(key, JSON.stringify(current));
    } catch {
      setPreviousRanks({});
    }
  }, [resource.data, user.dealershipId, user.advisorType, filters.advisorType]);

  const rows = useMemo(
    () => sortLeaderboard(resource.data?.content || [], filters.sort || "rank"),
    [resource.data, filters.sort],
  );

  return (
    <>
      <PageHeader
        eyebrow="PROGRESS DESERVES RECOGNITION"
        title="The leaderboard"
        description="Compare people by ranking, progress versus expected target-to-date, and recognition level."
      />
      <div className="filter-bar standalone dashboard-filter-bar">
        <DateRange dates={dates} onChange={updateDates} max={dashboard.data?.performance?.reportingDate} />
        {user.role === "MANAGER" && (
          <label className="field">
            <span>Advisor cohort</span>
            <select value={filters.advisorType} onChange={(event) => update({ advisorType: event.target.value })}>
              <option value="">All advisors</option>
              <option value="SALES">Sales advisors</option>
              <option value="SERVICE">Service advisors</option>
            </select>
          </label>
        )}
        <label className="field">
          <span>Sort by</span>
          <select value={filters.sort || "rank"} onChange={(event) => update({ sort: event.target.value })}>
            <option value="rank">Ranking</option>
            <option value="level">Recognition level</option>
            <option value="achievement">Target achievement</option>
          </select>
        </label>
      </div>

      <Resource resource={resource}>
        {() => (
          <>
            <Panel title="Top performers" subtitle={`Top 3 for ${dates.start} – ${dates.end} · no future dates included`} className="podium-panel">
              <LeaderboardPodium
                rows={sortLeaderboard(resource.data.content, "rank")}
                previousRanks={previousRanks}
                linkBuilder={user.role === "MANAGER" ? (row) => `#/advisors/${row.advisor.advisorId}` : null}
              />
            </Panel>
            <Panel
              title={user.role === "ADVISOR" ? `${label(user.advisorType)} advisor ranking` : "Team ranking"}
              subtitle="Rank is driven by progress versus the expected target-to-date. Tier and lifetime points remain separate recognition signals."
            >
              <Table
                caption="Target pace ranking"
                rows={rows}
                rowKey={(row) => row.advisor.advisorId}
                columns={[
                  {
                    key: "rank",
                    title: "Rank",
                    render: (row) => (
                      <div className="rank-cell">
                        <span className={`rank rank-${row.rank}`}>#{row.rank}</span>
                        <RankMomentum rank={row.rank} previousRank={previousRanks[row.advisor.advisorId]} />
                      </div>
                    ),
                  },
                  {
                    key: "advisor",
                    title: "Advisor",
                    render: (row) => (
                      <div className="table-identity">
                        {user.role === "MANAGER" ? (
                          <Link className="text-link leaderboard-name" to={`/advisors/${row.advisor.advisorId}`}>{row.advisor.advisorName}</Link>
                        ) : (
                          <strong>{row.advisor.advisorName}{row.advisor.advisorId === user.id && <span className="you-label">You</span>}</strong>
                        )}
                        <small>{label(row.advisor.advisorType)} advisor</small>
                      </div>
                    ),
                  },
                  {
                    key: "achievement",
                    title: "Target pace",
                    render: (row) => row.advisor.target > 0 ? (
                      <div className="table-progress prominent-progress">
                        <span>{percent(row.achievementPercentage)}</span>
                        <Progress title={`${row.advisor.advisorName} target pace`} value={row.achievementPercentage} />
                        <small>{money(row.advisor.sales)} / {money(row.advisor.target)}</small>
                      </div>
                    ) : <span className="muted">No target</span>,
                  },
                  {
                    key: "tier",
                    title: "Level",
                    render: (row) => <div className="level-cell"><Badge value={row.gamification.currentLevel} /><small>{number(row.advisor.lifetimeEarnedPoints)} pts</small></div>,
                  },
                  {
                    key: "transactions",
                    title: "Contracts",
                    numeric: true,
                    render: (row) => number(row.advisor.transactions),
                  },
                ]}
              />
            </Panel>
          </>
        )}
      </Resource>
      <p className="data-note">The arrow compares the current rank with the last leaderboard snapshot viewed in this browser. On first view it is marked as new, so no movement is fabricated.</p>
    </>
  );
}
