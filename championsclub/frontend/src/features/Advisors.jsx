import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Users } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { fullName, initials, label, percent } from "../lib/format.js";
import { useDashboard } from "../components/Shell.jsx";
import {
  Field,
  PageHeader,
  Panel,
  Resource,
  SearchForm,
  Table,
} from "../components/ui.jsx";

const tierWeight = { GOLD: 3, SILVER: 2, BRONZE: 1 };

function PaceIndicator({ row }) {
  if (!row || row.achievementPercentage === null || row.achievementPercentage === undefined) {
    return <span className="muted">No target</span>;
  }
  const achievement = Number(row.achievementPercentage || 0);
  const ahead = achievement >= 100;
  const Icon = ahead ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`target-pace-indicator ${ahead ? "ahead" : "behind"}`}>
      <Icon size={15} />
      <strong>{percent(achievement)}</strong>
      <small>{ahead ? "ahead of target pace" : "below target pace"}</small>
    </span>
  );
}

function filteredAndSortedRows(rows, performanceByAdvisor, filters) {
  const result = [...rows].filter((advisor) => {
    if (filters.specialism && filters.specialism !== "all" && advisor.advisorType !== filters.specialism) {
      return false;
    }
    if (!filters.pace || filters.pace === "all") return true;
    const performance = performanceByAdvisor.get(advisor.id);
    if (!performance || performance.achievementPercentage === null || performance.achievementPercentage === undefined) {
      return filters.pace === "no_target";
    }
    const achievement = Number(performance.achievementPercentage || 0);
    return filters.pace === "ahead" ? achievement >= 100 : achievement < 100;
  });

  const nameOf = (advisor) => fullName(advisor).toLocaleLowerCase();
  const performanceOf = (advisor) => performanceByAdvisor.get(advisor.id);
  const mode = filters.sort || "ranking";

  result.sort((a, b) => {
    const pa = performanceOf(a);
    const pb = performanceOf(b);
    if (mode === "name_asc") return nameOf(a).localeCompare(nameOf(b));
    if (mode === "name_desc") return nameOf(b).localeCompare(nameOf(a));
    if (mode === "pace_desc") {
      return Number(pb?.achievementPercentage ?? -1) - Number(pa?.achievementPercentage ?? -1) || nameOf(a).localeCompare(nameOf(b));
    }
    if (mode === "pace_asc") {
      return Number(pa?.achievementPercentage ?? Number.MAX_SAFE_INTEGER) - Number(pb?.achievementPercentage ?? Number.MAX_SAFE_INTEGER) || nameOf(a).localeCompare(nameOf(b));
    }
    if (mode === "level") {
      return (tierWeight[pb?.gamification?.currentLevel] || 0) - (tierWeight[pa?.gamification?.currentLevel] || 0)
        || Number(pa?.rank ?? Number.MAX_SAFE_INTEGER) - Number(pb?.rank ?? Number.MAX_SAFE_INTEGER)
        || nameOf(a).localeCompare(nameOf(b));
    }
    return Number(pa?.rank ?? Number.MAX_SAFE_INTEGER) - Number(pb?.rank ?? Number.MAX_SAFE_INTEGER)
      || nameOf(a).localeCompare(nameOf(b));
  });

  return result;
}

export default function Advisors() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const [filters, update] = useFilters({
    search: "",
    specialism: "all",
    pace: "all",
    sort: "ranking",
  });
  const resource = useResource(
    query("/api/advisors", {
      dealershipId: user.dealershipId,
      search: filters.search,
      page: 0,
      size: 100,
    }),
  );
  const periodStart = dashboard.data?.performance?.analytics?.periodStart;
  const reportingDate = dashboard.data?.performance?.reportingDate;
  const ranking = useResource(
    periodStart && reportingDate
      ? query("/api/leaderboard", {
          dealershipId: user.dealershipId,
          start: periodStart,
          end: reportingDate,
          page: 0,
          size: 100,
        })
      : null,
  );
  const performanceByAdvisor = new Map(
    (ranking.data?.content || []).map((row) => [row.advisor.advisorId, row]),
  );

  return (
    <>
      <PageHeader
        eyebrow="GREAT RESULTS START WITH PEOPLE"
        title="Your team"
        description="Know your advisors. Understand their progress. Help them take the next step."
      >
        <Link className="button" to="/leaderboard">
          <Users size={16} />
          Compare performance
        </Link>
      </PageHeader>
      <Panel
        title="Advisor directory"
        subtitle="Filter and order your team by specialism, target pace, ranking or recognition level"
      >
        <div className="team-filter-bar">
          <SearchForm
            label="Search advisors"
            value={filters.search}
            onSearch={(search) => update({ search })}
            placeholder="Search by name or email…"
          />
          <Field
            label="Specialism"
            value={filters.specialism || "all"}
            onChange={(event) => update({ specialism: event.target.value })}
          >
            <option value="all">All specialisms</option>
            <option value="SALES">Sales advisors</option>
            <option value="SERVICE">Service advisors</option>
          </Field>
          <Field
            label="Target pace"
            value={filters.pace || "all"}
            onChange={(event) => update({ pace: event.target.value })}
          >
            <option value="all">All target states</option>
            <option value="ahead">Ahead of target pace</option>
            <option value="behind">Below target pace</option>
            <option value="no_target">No target</option>
          </Field>
          <Field
            label="Sort by"
            value={filters.sort || "ranking"}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="ranking">Ranking</option>
            <option value="pace_desc">Target pace · highest first</option>
            <option value="pace_asc">Target pace · lowest first</option>
            <option value="level">Recognition level</option>
            <option value="name_asc">Name · A–Z</option>
            <option value="name_desc">Name · Z–A</option>
          </Field>
          <button
            type="button"
            className="button small team-filter-reset"
            onClick={() => update({ search: "", specialism: "all", pace: "all", sort: "ranking" })}
          >
            Reset filters
          </button>
        </div>
        <Resource resource={resource}>
          {(data) => {
            const rows = filteredAndSortedRows(data.content, performanceByAdvisor, filters);
            return (
              <>
                <div className="team-filter-summary">
                  <span>{rows.length} advisor{rows.length === 1 ? "" : "s"} shown</span>
                  <span>Performance through {dashboard.data?.performance?.reportingDate || "the reporting date"}</span>
                </div>
                <Table
                  rows={rows}
                  caption="Advisor directory"
                  emptyTitle="No advisors match these filters"
                  emptyDescription="Try changing the specialism, target pace or search filters."
                  columns={[
                    {
                      key: "name",
                      title: "Advisor",
                      render: (row) => (
                        <Link to={`/advisors/${row.id}`} className="table-person">
                          <span className="avatar neutral-avatar">
                            {initials(row)}
                          </span>
                          <span>
                            <strong>{fullName(row)}</strong>
                            <small>{row.email}</small>
                          </span>
                        </Link>
                      ),
                    },
                    {
                      key: "advisorType",
                      title: "Specialism",
                      render: (row) => `${label(row.advisorType)} advisor`,
                    },
                    {
                      key: "rank",
                      title: "Rank",
                      render: (row) => {
                        const performance = performanceByAdvisor.get(row.id);
                        return performance?.rank ? <strong>#{performance.rank}</strong> : <span className="muted">—</span>;
                      },
                    },
                    {
                      key: "targetPace",
                      title: "Target pace",
                      render: (row) => (
                        <PaceIndicator row={performanceByAdvisor.get(row.id)} />
                      ),
                    },
                    {
                      key: "level",
                      title: "Level",
                      render: (row) => label(performanceByAdvisor.get(row.id)?.gamification?.currentLevel),
                    },
                    {
                      key: "actions",
                      title: "Profile",
                      render: (row) => (
                        <Link className="text-link" to={`/advisors/${row.id}`}>
                          View advisor <ArrowUpRight size={15} />
                        </Link>
                      ),
                    },
                  ]}
                />
              </>
            );
          }}
        </Resource>
      </Panel>
    </>
  );
}
