import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters, usePeriod } from "../lib/useFilters.js";
import { label, money, number, percent } from "../lib/format.js";
import {
  Badge,
  DateRange,
  PageHeader,
  Pagination,
  Panel,
  Progress,
  Resource,
  Table,
} from "../components/ui.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [dates, updateDates] = usePeriod();
  const [filters, update] = useFilters({ advisorType: "" });
  const resource = useResource(
    query("/api/leaderboard", {
      dealershipId: user.dealershipId,
      ...dates,
      advisorType:
        user.role === "MANAGER" ? filters.advisorType : user.advisorType,
      page: filters.page,
      size: 12,
    }),
  );
  return (
    <>
      <PageHeader
        eyebrow="PROGRESS DESERVES RECOGNITION"
        title="The leaderboard"
        description="A fairer comparison: ranked by target achievement, within your dealership."
      />
      <div className="filter-bar standalone">
        <DateRange dates={dates} onChange={updateDates} />
        {user.role === "MANAGER" && (
          <label className="field">
            <span>Advisor cohort</span>
            <select
              value={filters.advisorType}
              onChange={(event) => update({ advisorType: event.target.value })}
            >
              <option value="">All advisors</option>
              <option value="SALES">Sales advisors</option>
              <option value="SERVICE">Service advisors</option>
            </select>
          </label>
        )}
      </div>
      <Panel
        title={
          user.role === "ADVISOR"
            ? `${label(user.advisorType)} advisor ranking`
            : "Team ranking"
        }
        subtitle="Target amounts are prorated when a selected range overlaps part of a target period."
      >
        <Resource resource={resource}>
          {(data) => (
            <>
              <Table
                caption="Target achievement ranking"
                rows={data.content}
                rowKey={(row) => row.advisor.advisorId}
                columns={[
                  {
                    key: "rank",
                    title: "Rank",
                    render: (row) => (
                      <span className={`rank rank-${row.rank}`}>
                        {String(row.rank).padStart(2, "0")}
                      </span>
                    ),
                  },
                  {
                    key: "advisor",
                    title: "Advisor",
                    render: (row) => (
                      <div className="table-identity">
                        {user.role === "MANAGER" ? (
                          <Link
                            className="text-link"
                            to={`/advisors/${row.advisor.advisorId}`}
                          >
                            {row.advisor.advisorName}
                          </Link>
                        ) : (
                          <strong>
                            {row.advisor.advisorName}
                            {row.advisor.advisorId === user.id && (
                              <span className="you-label">You</span>
                            )}
                          </strong>
                        )}
                        <small>{label(row.advisor.advisorType)} advisor</small>
                      </div>
                    ),
                  },
                  {
                    key: "sales",
                    title: "Recorded sales",
                    numeric: true,
                    render: (row) => money(row.advisor.sales),
                  },
                  {
                    key: "transactions",
                    title: "Contracts",
                    numeric: true,
                    render: (row) => number(row.advisor.transactions),
                  },
                  {
                    key: "achievement",
                    title: "Achievement",
                    render: (row) =>
                      row.advisor.target > 0 ? (
                        <div className="table-progress">
                          <span>{percent(row.achievementPercentage)}</span>
                          <Progress
                            title={`${row.advisor.advisorName} target achievement`}
                            value={row.achievementPercentage}
                          />
                        </div>
                      ) : (
                        <span className="muted">No target</span>
                      ),
                  },
                  {
                    key: "tier",
                    title: "Tier",
                    render: (row) => (
                      <Badge value={row.gamification.currentLevel} />
                    ),
                  },
                  {
                    key: "points",
                    title: "Lifetime points",
                    numeric: true,
                    render: (row) => number(row.advisor.lifetimeEarnedPoints),
                  },
                ]}
              />
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
      <p className="data-note">
        Ranking uses the selected period’s recorded sales against allocated
        targets. Lifetime points and recognition tiers are labeled separately
        and do not determine rank.
      </p>
    </>
  );
}
