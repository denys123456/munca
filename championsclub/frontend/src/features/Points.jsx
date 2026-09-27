import { useAuth } from "../auth/AuthContext.jsx";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { date, label, number } from "../lib/format.js";
import {
  Badge,
  Kpi,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";

export default function Points({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const id = advisorId || user.id;
  const [filters, update] = useFilters();
  const summary = useResource(`/api/points/${id}`);
  const history = useResource(
    query(`/api/points/${id}/transactions`, { page: filters.page, size: 12 }),
  );
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="EVERY POINT HAS A STORY"
          title="Points ledger"
          description="Your complete record of earnings and redemptions."
        />
      )}
      <Resource resource={summary}>
        {(data) => (
          <div className="kpi-grid three">
            <Kpi
              title="Available points"
              value={number(data.availablePoints)}
              subtitle="Current spendable balance"
            />
            <Kpi
              title="Lifetime earned"
              value={number(data.lifetimeEarnedPoints)}
              subtitle="Redemptions do not reduce tier progress"
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
        )}
      </Resource>
      <Panel
        title="Point transactions"
        subtitle="Newest first · Complete paginated ledger"
      >
        <Resource resource={history}>
          {(data) => (
            <>
              <Table
                rows={data.content}
                caption="Point transactions"
                columns={[
                  {
                    key: "createdAt",
                    title: "Date",
                    render: (row) => date(row.createdAt),
                  },
                  {
                    key: "type",
                    title: "Type",
                    render: (row) => <Badge value={row.type} />,
                  },
                  { key: "description", title: "Description" },
                  {
                    key: "amount",
                    title: "Points",
                    numeric: true,
                    render: (row) => (
                      <strong className={row.amount > 0 ? "positive-text" : ""}>
                        {row.amount > 0 ? "+" : ""}
                        {number(row.amount)}
                      </strong>
                    ),
                  },
                ]}
              />
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
    </>
  );
}
