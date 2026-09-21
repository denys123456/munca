import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useResource } from "../api/ApiContext.jsx";
import { useFilters } from "../lib/useFilters.js";
import { date, fullName, label, money, number } from "../lib/format.js";
import {
  Badge,
  Kpi,
  Loading,
  PageHeader,
  Panel,
  Resource,
} from "../components/ui.jsx";
import { TargetSummary } from "../components/TargetSummary.jsx";
import { TrendChart } from "../components/TrendChart.jsx";

const Performance = lazy(() => import("./Performance.jsx"));
const Targets = lazy(() => import("./Targets.jsx"));
const Sales = lazy(() => import("./Sales.jsx"));
const Points = lazy(() => import("./Points.jsx"));
const Rewards = lazy(() => import("./Rewards.jsx"));
const Intelligence = lazy(() => import("./Intelligence.jsx"));

export default function AdvisorDetail() {
  const { id } = useParams();
  const [filters, update] = useFilters({ tab: "overview" });
  const profile = useResource(
    `/api/advisors/${encodeURIComponent(id)}/profile`,
  );
  const tabs = [
    "overview",
    "performance",
    "targets",
    "sales",
    "points",
    "rewards",
    "forecasts",
    "insights",
  ];
  const selected = tabs.includes(filters.tab) ? filters.tab : "overview";
  return (
    <>
      <Link className="back-link" to="/advisors">
        <ArrowLeft size={15} />
        Back to your team
      </Link>
      <Resource resource={profile}>
        {(data) => (
          <>
            <PageHeader
              eyebrow={`${label(data.identity.advisorType)} ADVISOR`}
              title={fullName(data.identity)}
              description={`${data.identity.email} · ${data.dealership.name}`}
            >
              <Badge value={data.identity.active ? "ACTIVE" : "INACTIVE"} />
            </PageHeader>
            <div className="tabs" aria-label="Advisor views">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={selected === tab ? "active" : ""}
                  aria-pressed={selected === tab}
                  onClick={() =>
                    update({
                      tab,
                      page: 0,
                      view: "",
                      search: "",
                      start: "",
                      end: "",
                      status: "",
                      from: "",
                      to: "",
                    })
                  }
                >
                  {label(tab)}
                </button>
              ))}
            </div>
            <Suspense fallback={<Loading />}>
              {selected === "overview" && (
                <>
                  <div className="kpi-grid">
                    <Kpi
                      title="Lifetime recorded sales"
                      value={money(data.lifetime.sales)}
                      subtitle={`${number(data.lifetime.recordedContracts)} recorded contracts`}
                    />
                    <Kpi
                      title="Available points"
                      value={number(data.availablePoints)}
                      subtitle={`${number(data.lifetimeEarnedPoints)} lifetime earned`}
                    />
                    <Kpi
                      title="Cohort position"
                      value={
                        data.cohortPosition.rank
                          ? `#${data.cohortPosition.rank}`
                          : "—"
                      }
                      subtitle={`of ${number(data.cohortPosition.cohortSize)} ${label(data.identity.advisorType).toLowerCase()} advisors`}
                    />
                    <Kpi
                      title="Recognition tier"
                      value={label(data.gamification.currentLevel)}
                      subtitle={
                        data.gamification.nextLevel
                          ? `${number(data.gamification.remainingPoints)} points to ${label(data.gamification.nextLevel)}`
                          : "Highest tier reached"
                      }
                    />
                  </div>
                  <div className="dashboard-primary">
                    <Panel
                      title="Current-period performance"
                      subtitle={`${date(data.currentPeriod.periodStart)} – ${date(data.currentPeriod.periodEnd)}`}
                    >
                      <TrendChart points={data.currentPeriod.dailySales} />
                    </Panel>
                    <section className="panel">
                      <TargetSummary target={data.currentTarget} link={false} />
                    </section>
                  </div>
                  <Panel title="Advisor at a glance">
                    <dl className="detail-grid">
                      <div>
                        <dt>Strongest product by lifetime sales</dt>
                        <dd>
                          {data.lifetime.strongestProductName ||
                            "No recorded sales"}
                        </dd>
                      </div>
                      <div>
                        <dt>First recorded sale</dt>
                        <dd>{date(data.lifetime.firstSaleDate)}</dd>
                      </div>
                      <div>
                        <dt>Latest recorded sale</dt>
                        <dd>{date(data.lifetime.lastSaleDate)}</dd>
                      </div>
                      <div>
                        <dt>Lifetime average contract value</dt>
                        <dd>
                          {data.lifetime.recordedContracts
                            ? money(data.lifetime.averageContractAmount)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </Panel>
                </>
              )}
              {selected === "performance" && (
                <Performance advisorId={id} embedded />
              )}
              {selected === "targets" && <Targets advisorId={id} embedded />}
              {selected === "sales" && (
                <Sales advisor={data.identity} embedded />
              )}
              {selected === "points" && <Points advisorId={id} embedded />}
              {selected === "rewards" && <Rewards advisorId={id} embedded />}
              {["forecasts", "insights"].includes(selected) && (
                <Intelligence advisorId={id} mode={selected} embedded />
              )}
            </Suspense>
          </>
        )}
      </Resource>
    </>
  );
}
