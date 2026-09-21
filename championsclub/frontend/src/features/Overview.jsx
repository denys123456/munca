import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Coins,
  FileCheck2,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useDashboard } from "../components/Shell.jsx";
import {
  Badge,
  Kpi,
  PageHeader,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";
import { TargetSummary } from "../components/TargetSummary.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { date, money, number, percent } from "../lib/format.js";

export default function Overview() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const [interval, setInterval] = useState("dailySales");
  const manager = user.role === "MANAGER";
  return (
    <>
      <PageHeader
        eyebrow={manager ? "THE BIG PICTURE" : "MAKE EVERY DAY COUNT"}
        title={`Welcome back, ${user.firstName}.`}
        description={
          manager
            ? "A clear view of your team. A confident next move."
            : "Your performance, progress and next opportunities, in one place."
        }
      >
        <Link className="button primary" to="/sales?create=true">
          <Plus size={17} />
          Record a sale
        </Link>
      </PageHeader>
      <Resource resource={dashboard}>
        {(data) => {
          const facts = data.performance,
            analytics = facts.analytics;
          return (
            <>
              <div className="context-line">
                <span>
                  <span className="status-dot" />
                  {data.dealership.name}
                </span>
                <span>
                  <CalendarDays size={14} />
                  {date(analytics.periodStart)} – {date(analytics.periodEnd)}
                </span>
                <span>As of {date(facts.reportingDate)}</span>
              </div>
              <div className="kpi-grid">
                <Kpi
                  title="Recorded sales"
                  icon={TrendingUp}
                  value={money(analytics.sales)}
                  change={analytics.salesGrowthPercentage}
                  subtitle={
                    analytics.salesGrowthPercentage === null
                      ? "No comparable previous period"
                      : "vs. previous equal-length period"
                  }
                />
                <Kpi
                  title="Recorded contracts"
                  icon={FileCheck2}
                  value={number(analytics.recordedContracts)}
                  change={analytics.contractGrowthPercentage}
                  subtitle="in the reporting period"
                />
                <Kpi
                  title="Target achievement"
                  icon={Target}
                  value={
                    facts.target.targetId
                      ? percent(facts.target.progress.achievementPercentage)
                      : "—"
                  }
                  subtitle={
                    facts.target.targetId
                      ? `${money(facts.target.progress.remainingAmount)} remaining`
                      : "No target configured"
                  }
                />
                {manager ? (
                  <Kpi
                    title="Active advisors"
                    icon={Users}
                    value={number(data.teamStatistics.activeAdvisors)}
                    subtitle={`${number(data.teamStatistics.advisorsWithSales)} with recorded contracts this period`}
                  />
                ) : (
                  <Kpi
                    title="Available points"
                    icon={Coins}
                    value={number(facts.availablePoints)}
                    subtitle={`${number(facts.lifetimeEarnedPoints)} lifetime earned`}
                  />
                )}
              </div>
              <div className="dashboard-primary">
                <Panel
                  title={
                    manager
                      ? "Team sales performance"
                      : "Your sales performance"
                  }
                  subtitle="Recorded contract value · EUR"
                  action={
                    <select
                      className="compact-select"
                      aria-label="Chart interval"
                      value={interval}
                      onChange={(event) => setInterval(event.target.value)}
                    >
                      <option value="dailySales">Daily</option>
                      <option value="weeklySales">Weekly</option>
                      <option value="monthlySales">Monthly</option>
                    </select>
                  }
                >
                  <div className="chart-headline">
                    <strong>{money(analytics.sales)}</strong>
                    <span>
                      {number(analytics.recordedContracts)} recorded contracts
                    </span>
                    <Link className="text-link" to="/performance">
                      Full analysis <ArrowUpRight size={14} />
                    </Link>
                  </div>
                  <TrendChart points={analytics[interval]} />
                </Panel>
                <section className="panel">
                  <TargetSummary target={facts.target} />
                </section>
              </div>
              <div className="dashboard-secondary">
                <Panel
                  title={manager ? "Where to focus" : "Your next best steps"}
                  subtitle="Recommendations grounded in your performance"
                  action={
                    <Link className="text-link" to="/insights">
                      View all <ArrowRight size={14} />
                    </Link>
                  }
                >
                  <div className="recommendation-list">
                    {data.recommendations.length ? (
                      data.recommendations.slice(0, 2).map((item, index) => (
                        <div className="recommendation" key={item.type}>
                          <span className="step-index">0{index + 1}</span>
                          <div>
                            <div className="recommendation-title">
                              <h3>{item.title}</h3>
                              <Badge value={item.priority} />
                            </div>
                            <p>{item.action}</p>
                            <small>{item.reason}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="panel-empty">
                        No recommendations need your attention right now.
                      </p>
                    )}
                  </div>
                </Panel>
                <Panel
                  title={manager ? "Advisors to support" : "Your recognition"}
                  subtitle={
                    manager
                      ? "A focused shortlist from the current target period"
                      : "Built on your lifetime earned points"
                  }
                >
                  {manager ? (
                    <div className="advisor-shortlist">
                      {data.atRiskAdvisors.length ? (
                        data.atRiskAdvisors.slice(0, 3).map((advisor) => (
                          <Link
                            to={`/advisors/${advisor.advisorId}`}
                            key={advisor.advisorId}
                          >
                            <span className="avatar neutral-avatar">
                              {advisor.advisorName
                                .split(" ")
                                .map((word) => word.charAt(0))
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <span>
                              <strong>{advisor.advisorName}</strong>
                              <small>
                                {money(advisor.sales)} of{" "}
                                {money(advisor.target)}
                              </small>
                            </span>
                            <ArrowUpRight size={16} />
                          </Link>
                        ))
                      ) : (
                        <p className="panel-empty">
                          No at-risk advisors in the current shortlist.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="recognition">
                      <Badge value={facts.gamification.currentLevel} />
                      <strong>
                        {number(facts.lifetimeEarnedPoints)}
                        <small>lifetime points</small>
                      </strong>
                      <p>
                        {facts.gamification.nextLevel
                          ? `${number(facts.gamification.remainingPoints)} points to ${facts.gamification.nextLevel.toLowerCase()}`
                          : "You have reached the highest recognition tier."}
                      </p>
                      <Link to="/rewards" className="text-link">
                        Explore your rewards <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  )}
                </Panel>
              </div>
              <Panel
                title="Recent sales activity"
                subtitle="Latest recorded activity, across all dates"
                action={
                  <Link className="text-link" to="/sales">
                    View sales history <ArrowRight size={14} />
                  </Link>
                }
              >
                <Table
                  caption="Recent sales"
                  rows={manager ? data.recentActivity : data.recentSales}
                  columns={[
                    {
                      key: "externalReference",
                      title: "Reference",
                      render: (row) => <strong>{row.externalReference}</strong>,
                    },
                    {
                      key: "saleDate",
                      title: "Sale date",
                      render: (row) => date(row.saleDate),
                    },
                    {
                      key: "status",
                      title: "Status",
                      render: (row) => <Badge value={row.status} />,
                    },
                    {
                      key: "awardedPoints",
                      title: "Original point award",
                      numeric: true,
                      render: (row) => number(row.awardedPoints),
                    },
                    {
                      key: "contractAmount",
                      title: "Contract value",
                      numeric: true,
                      render: (row) => money(row.contractAmount, row.currency),
                    },
                  ]}
                />
              </Panel>
            </>
          );
        }}
      </Resource>
    </>
  );
}
