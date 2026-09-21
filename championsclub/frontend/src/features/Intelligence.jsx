import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { subject } from "../api/paths.js";
import { useDashboard } from "../components/Shell.jsx";
import {
  Badge,
  Empty,
  ErrorMessage,
  Kpi,
  PageHeader,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";
import { TrendChart } from "../components/TrendChart.jsx";
import { date, label, money, number, percent } from "../lib/format.js";

const insightSections = [
  ["whatChanged", "What changed"],
  ["whyItMatters", "Why it matters"],
  ["risk", "Risk to watch"],
  ["opportunity", "Your opportunity"],
  ["recommendedAction", "Recommended action"],
];
const actionRoutes = {
  TARGET_RECOVERY: "/targets",
  PRODUCT_FOCUS: "/products",
  COACHING_REQUIRED: "/advisors",
  MAINTAIN_MOMENTUM: "/performance",
  CLOSE_TO_NEXT_LEVEL: "/points",
  REWARD_OPPORTUNITY: "/rewards",
  IMPROVE_PRODUCT_MIX: "/performance",
};
const factLabels = {
  remainingTarget: "Remaining target",
  remainingAmount: "Remaining target",
  achievedAmount: "Achieved",
  targetAmount: "Target",
  requiredAveragePace: "Required daily pace",
  currentAveragePace: "Current daily pace",
  sales: "Recorded sales",
  salesGrowthPercentage: "Sales growth (%)",
  achievementPercentage: "Achievement (%)",
  availablePoints: "Available points",
  remainingPoints: "Points to next tier",
  daysRemaining: "Days remaining",
  targetAchievementProbability: "Target probability",
  advisorName: "Advisor",
  productName: "Product",
  currentLevel: "Current tier",
  nextLevel: "Next tier",
  affordableRewards: "Affordable rewards",
};
function friendlyKey(key) {
  return (
    factLabels[key] ||
    Array.from(key)
      .map((letter, index) =>
        index > 0 && letter >= "A" && letter <= "Z"
          ? ` ${letter.toLowerCase()}`
          : letter,
      )
      .join("")
  );
}
function factValue(key, value) {
  if (value === null || value === undefined) return "—";
  if (key === "targetAchievementProbability")
    return percent(Number(value) * 100);
  if (
    [
      "remainingTarget",
      "remainingAmount",
      "achievedAmount",
      "targetAmount",
      "requiredAveragePace",
      "currentAveragePace",
      "sales",
    ].includes(key)
  )
    return money(value);
  if (typeof value === "number") return number(value, 2);
  if (typeof value === "object")
    return Object.values(value)
      .map((item) => String(item))
      .join(" · ");
  return String(value);
}

export default function Intelligence({ mode, advisorId, embedded = false }) {
  const { user } = useAuth();
  const { mutate } = useApi();
  const dashboard = useDashboard();
  const advisor = useResource(advisorId ? `/api/advisors/${advisorId}` : null);
  const source = advisorId ? advisor : dashboard;
  const forecast = useResource(
    mode === "forecasts"
      ? query("/api/forecasts", subject(user, advisorId))
      : null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  async function refresh() {
    setPending(true);
    setError(null);
    try {
      await mutate(
        query("/api/forecasts/refresh", subject(user, advisorId)),
        { method: "POST" },
        "Forecast request completed. The latest service status is shown below.",
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow={
            mode === "forecasts"
              ? "LOOK AHEAD WITH CONTEXT"
              : "FROM INFORMATION TO ACTION"
          }
          title={
            mode === "forecasts"
              ? "Performance forecast"
              : "Your performance brief"
          }
          description={
            mode === "forecasts"
              ? "A forward-looking view, grounded in recorded performance."
              : "Understand what matters and where to focus next."
          }
        >
          {mode === "forecasts" && user.role === "MANAGER" && (
            <button className="button" onClick={refresh} disabled={pending}>
              <RefreshCw size={16} />
              {pending ? "Refreshing…" : "Refresh forecast"}
            </button>
          )}
        </PageHeader>
      )}
      <ErrorMessage error={error} />
      <Resource resource={source}>
        {(data) =>
          mode === "insights" ? (
            <>
              <Panel
                title="The perspective"
                subtitle={`Based on performance as of ${date(data.performance.reportingDate)}`}
                action={
                  <Badge
                    tone={
                      data.insight.result?.generationSource === "LLM"
                        ? "blue"
                        : "neutral"
                    }
                  >
                    {data.insight.result?.generationSource === "LLM"
                      ? "AI-generated explanation"
                      : "Rules-based performance brief"}
                  </Badge>
                }
              >
                {data.insight.result ? (
                  <div className="insight-brief">
                    <div className="insight-lead">
                      <Sparkles size={23} />
                      <p>{data.insight.result.summary}</p>
                    </div>
                    <div className="insight-sections">
                      {insightSections.map(([key, title]) => (
                        <div key={key}>
                          <h3>{title}</h3>
                          <p>{data.insight.result[key]}</p>
                        </div>
                      ))}
                    </div>
                    <div className="provenance">
                      {data.insight.result.generationSource === "LLM"
                        ? `Generated by ${data.insight.result.provider}${data.insight.result.model ? ` · ${data.insight.result.model}` : ""}. Interpret alongside the underlying metrics.`
                        : "Prepared by the program’s deterministic rules. This is not an LLM-generated response."}
                      <span>Prepared {date(data.insight.generatedAt)}</span>
                    </div>
                  </div>
                ) : (
                  <Empty
                    title="Your brief is unavailable"
                    description="Your performance data is still available. Try refreshing the workspace later."
                  />
                )}
              </Panel>
              <Panel
                title="Recommended actions"
                subtitle="Prioritized by your program’s business rules"
              >
                <div className="insight-recommendations">
                  {data.recommendations.length ? (
                    data.recommendations.map((item, index) => (
                      <article key={item.type}>
                        <div className="recommendation-title">
                          <span className="step-index">0{index + 1}</span>
                          <h3>{item.title}</h3>
                          <Badge value={item.priority} />
                        </div>
                        <p>{item.action}</p>
                        <p className="muted">{item.reason}</p>
                        <details className="supporting-facts">
                          <summary>See supporting facts</summary>
                          <dl>
                            {Object.entries(item.supportingFacts).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <dt>{friendlyKey(key)}</dt>
                                  <dd>{factValue(key, value)}</dd>
                                </div>
                              ),
                            )}
                          </dl>
                        </details>
                        {!embedded &&
                          actionRoutes[item.type] &&
                          !(
                            user.role === "MANAGER" &&
                            ["/points", "/rewards"].includes(
                              actionRoutes[item.type],
                            )
                          ) &&
                          !(
                            user.role === "ADVISOR" &&
                            actionRoutes[item.type] === "/advisors"
                          ) && (
                            <Link
                              className="text-link"
                              to={actionRoutes[item.type]}
                            >
                              Explore details <ArrowUpRight size={14} />
                            </Link>
                          )}
                      </article>
                    ))
                  ) : (
                    <Empty
                      title="No recommended actions"
                      description="Continue reviewing your recorded performance and goals."
                    />
                  )}
                </div>
              </Panel>
            </>
          ) : (
            <Resource resource={forecast}>
              {(generated) =>
                generated.state !== "AVAILABLE" || !generated.result ? (
                  <Panel title="Forecast unavailable">
                    <Empty
                      title="There isn’t a forecast to show yet"
                      description="The forecasting service may be unavailable, or this reporting scope may not have enough usable history. Your recorded performance remains available."
                    >
                      {user.role === "MANAGER" && (
                        <button
                          className="button"
                          onClick={refresh}
                          disabled={pending}
                        >
                          {pending
                            ? "Requesting forecast…"
                            : "Try forecast again"}
                        </button>
                      )}
                    </Empty>
                  </Panel>
                ) : (
                  <>
                    <div className="context-line">
                      <span>
                        <Badge tone="warning">Forecast · Not actuals</Badge>
                      </span>
                      <span>As of {date(data.performance.reportingDate)}</span>
                      <span>
                        Through {date(data.performance.target.periodEnd)}
                      </span>
                      {embedded && user.role === "MANAGER" && (
                        <button
                          className="text-button"
                          onClick={refresh}
                          disabled={pending}
                        >
                          Refresh forecast
                        </button>
                      )}
                    </div>
                    <div className="kpi-grid three">
                      <Kpi
                        title="Predicted period-end value"
                        value={money(generated.result.predictedEndValue)}
                        subtitle={`Through ${date(data.performance.target.periodEnd)}`}
                      />
                      <Kpi
                        title="Target achievement probability"
                        value={
                          generated.result.targetAchievementProbability === null
                            ? "—"
                            : percent(
                                generated.result.targetAchievementProbability *
                                  100,
                              )
                        }
                        subtitle="Model estimate, not a guarantee"
                      />
                      <Kpi
                        title="Estimated outcome range"
                        value={`${money(generated.result.lowerBound)} – ${money(generated.result.upperBound)}`}
                        subtitle="Model-calibrated lower and upper bounds"
                      />
                    </div>
                    <Panel
                      title="Forecasted daily sales"
                      subtitle="Predicted daily contract value for the remaining target period"
                      action={
                        <Badge value={generated.result.trend}>
                          {label(generated.result.trend)} trend
                        </Badge>
                      }
                    >
                      <TrendChart
                        points={generated.result.forecastPoints}
                        forecast
                        title="Predicted contract value"
                      />
                      <div className="forecast-metadata">
                        <span>Model: {generated.result.modelVersion}</span>
                        <span>Generated {date(generated.generatedAt)}</span>
                        <span>
                          Reliability score:{" "}
                          {percent(generated.result.confidence * 100)}
                        </span>
                      </div>
                      <p className="data-note">
                        The reliability score is a model quality heuristic, not
                        a probability. Forecasts and outcome bounds are
                        estimates and may change as new contracts are recorded.
                      </p>
                    </Panel>
                    <Panel
                      title="Historical actuals"
                      subtitle={`${date(data.performance.analytics.periodStart)} – ${date(data.performance.analytics.periodEnd)} · Recorded contracts only`}
                    >
                      <TrendChart
                        points={data.performance.analytics.dailySales}
                        compact
                      />
                    </Panel>
                    {generated.result.anomalies.length > 0 && (
                      <Panel
                        title="Unusual historical activity"
                        subtitle="Observations identified by the forecasting service"
                      >
                        <Table
                          rows={generated.result.anomalies}
                          rowKey="date"
                          columns={[
                            {
                              key: "date",
                              title: "Date",
                              render: (row) => date(row.date),
                            },
                            {
                              key: "amount",
                              title: "Recorded value",
                              numeric: true,
                              render: (row) => money(row.amount),
                            },
                            {
                              key: "score",
                              title: "Anomaly score",
                              numeric: true,
                              render: (row) => number(row.score, 2),
                            },
                          ]}
                        />
                      </Panel>
                    )}
                  </>
                )
              }
            </Resource>
          )
        }
      </Resource>
    </>
  );
}
