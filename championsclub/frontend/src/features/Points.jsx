import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { date, label, number } from "../lib/format.js";
import {
  Badge,
  Field,
  Kpi,
  Modal,
  MutationForm,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";

export default function Points({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const id = advisorId || user.id;
  const { mutate } = useApi();
  const [adjusting, setAdjusting] = useState(false);
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
          description="Your complete record of earnings, redemptions and adjustments."
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
        action={
          user.role === "MANAGER" && (
            <button className="button" onClick={() => setAdjusting(true)}>
              <Plus size={16} />
              Adjust points
            </button>
          )
        }
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
                    key: "sourceId",
                    title: "Source",
                    render: (row) => `#${row.sourceId}`,
                  },
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
      {adjusting && (
        <Modal
          title="Adjust advisor points"
          description="Every adjustment is recorded in the audit log and point ledger."
          onClose={() => setAdjusting(false)}
        >
          <MutationForm
            submitLabel="Confirm adjustment"
            onSuccess={() => setAdjusting(false)}
            onSubmit={(values) => {
              const amount = Number(values.get("amount"));
              if (!Number.isInteger(amount) || amount === 0)
                throw new Error("Enter a nonzero whole number of points.");
              return mutate(
                `/api/points/${id}/adjustments`,
                {
                  method: "POST",
                  body: { amount, reason: values.get("reason").trim() },
                },
                "Point adjustment recorded.",
              );
            }}
          >
            <Field
              label="Point adjustment"
              name="amount"
              type="number"
              step="1"
              min="-2147483648"
              max="2147483647"
              required
              hint="Use a positive number to add points or a negative number to deduct them."
            />
            <Field
              label="Reason"
              name="reason"
              required
              maxLength={280}
              placeholder="Explain this adjustment"
            />
          </MutationForm>
        </Modal>
      )}
    </>
  );
}
