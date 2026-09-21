import { useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { analyticsPath } from "../api/paths.js";
import { usePeriod } from "../lib/useFilters.js";
import {
  date,
  downloadCsv,
  label,
  money,
  number,
  percent,
} from "../lib/format.js";
import {
  DateRange,
  Empty,
  Kpi,
  PageHeader,
  Panel,
  Progress,
  Resource,
  Table,
} from "../components/ui.jsx";
import { TrendChart } from "../components/TrendChart.jsx";

export default function Performance({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const [dates, update] = usePeriod();
  const resource = useResource(analyticsPath(user, dates, advisorId));
  const [interval, setInterval] = useState("dailySales");
  const [dimension, setDimension] = useState("productCategoryMix");
  function exportReport(data) {
    downloadCsv(
      `championsclub-performance-${data.periodStart}-${data.periodEnd}.csv`,
      [
        [
          "Scope",
          "Start",
          "End",
          "Currency",
          "Recorded sales",
          "Recorded contracts",
          "Cancelled contracts",
          "Average contract value",
          "Cancellation rate %",
          "Sales growth %",
        ],
        [
          advisorId
            ? `Advisor ${advisorId}`
            : user.role === "MANAGER"
              ? `Dealership ${user.dealershipId}`
              : `Advisor ${user.id}`,
          data.periodStart,
          data.periodEnd,
          "EUR",
          data.sales,
          data.recordedContracts,
          data.cancelledContracts,
          data.averageContractAmount,
          data.cancellationRatePercentage,
          data.salesGrowthPercentage,
        ],
        [],
        ["Date", "Recorded value (EUR)"],
        ...data.dailySales.map((point) => [point.date, point.amount]),
      ],
    );
  }
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="UNDERSTAND YOUR PERFORMANCE"
          title={
            user.role === "MANAGER" ? "Team performance" : "My performance"
          }
          description="The details behind your progress. Every number, in context."
        >
          {resource.data && (
            <button
              className="button"
              onClick={() => exportReport(resource.data)}
            >
              <Download size={16} />
              Export report
            </button>
          )}
        </PageHeader>
      )}
      <div className="filter-bar">
        <DateRange dates={dates} onChange={update} />
      </div>
      <Resource resource={resource}>
        {(data) => (
          <>
            <div className="section-context">
              {date(data.periodStart)} – {date(data.periodEnd)} ·{" "}
              {advisorId || user.role === "ADVISOR"
                ? "Advisor performance"
                : "Entire dealership"}{" "}
              · EUR
            </div>
            <div className="kpi-grid">
              <Kpi
                title="Recorded sales"
                value={money(data.sales)}
                change={data.salesGrowthPercentage}
                subtitle="vs. previous equal-length period"
              />
              <Kpi
                title="Recorded contracts"
                value={number(data.recordedContracts)}
                change={data.contractGrowthPercentage}
                subtitle="vs. previous equal-length period"
              />
              <Kpi
                title="Average contract value"
                value={
                  data.recordedContracts
                    ? money(data.averageContractAmount)
                    : "—"
                }
                subtitle="recorded contracts only"
              />
              <Kpi
                title="Cancellation rate"
                value={
                  data.recordedContracts + data.cancelledContracts
                    ? percent(data.cancellationRatePercentage)
                    : "—"
                }
                subtitle={`${number(data.cancelledContracts)} cancelled contracts by origination date`}
              />
            </div>
            <Panel
              title="Sales over time"
              subtitle="Zero-based daily contract value, aggregated within the selected period"
              action={
                <select
                  className="compact-select"
                  value={interval}
                  aria-label="Chart interval"
                  onChange={(event) => setInterval(event.target.value)}
                >
                  <option value="dailySales">Daily</option>
                  <option value="weeklySales">Weekly</option>
                  <option value="monthlySales">Monthly</option>
                </select>
              }
            >
              <TrendChart points={data[interval]} />
            </Panel>
            <div className="two-columns">
              <Panel
                title="Product performance"
                subtitle="Share of recorded sales value"
              >
                <Table
                  caption="Product performance"
                  rows={data.productMix}
                  rowKey="productId"
                  columns={[
                    {
                      key: "productName",
                      title: "Product",
                      render: (row) => (
                        <div className="table-identity">
                          <strong>{row.productName}</strong>
                          <small>{label(row.category)}</small>
                        </div>
                      ),
                    },
                    {
                      key: "transactions",
                      title: "Contracts",
                      numeric: true,
                      render: (row) => number(row.transactions),
                    },
                    {
                      key: "sales",
                      title: "Sales",
                      numeric: true,
                      render: (row) => money(row.sales),
                    },
                    {
                      key: "salesSharePercentage",
                      title: "Share",
                      numeric: true,
                      render: (row) => percent(row.salesSharePercentage),
                    },
                  ]}
                />
              </Panel>
              <Panel
                title="Contract composition"
                subtitle="Share of recorded contracts, rather than contract value"
                action={
                  <select
                    className="compact-select"
                    aria-label="Breakdown dimension"
                    value={dimension}
                    onChange={(event) => setDimension(event.target.value)}
                  >
                    <option value="productCategoryMix">Product category</option>
                    <option value="customerSegmentMix">Customer segment</option>
                    <option value="vehicleConditionMix">New / used</option>
                    <option value="powertrainMix">Powertrain</option>
                  </select>
                }
              >
                <div className="composition-list">
                  {data[dimension].length ? (
                    data[dimension].map((item) => (
                      <div key={item.value}>
                        <div className="composition-heading">
                          <strong>{label(item.value)}</strong>
                          <span>
                            {number(item.transactions)} contracts ·{" "}
                            {percent(item.transactionSharePercentage)}
                          </span>
                        </div>
                        <Progress
                          title={`${label(item.value)} contract share`}
                          value={item.transactionSharePercentage}
                        />
                      </div>
                    ))
                  ) : (
                    <Empty
                      title="No recorded contracts"
                      description="A breakdown will appear when this period contains recorded sales."
                    />
                  )}
                </div>
              </Panel>
            </div>
            <p className="data-note">
              Comparisons use the immediately preceding period of equal length.
              A dash means the comparison has no valid baseline. Weekly and
              monthly edge buckets include only dates within your selected
              range.
            </p>
          </>
        )}
      </Resource>
    </>
  );
}
