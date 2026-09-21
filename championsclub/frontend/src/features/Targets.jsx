import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { owner } from "../api/paths.js";
import { useDashboard } from "../components/Shell.jsx";
import {
  Badge,
  Field,
  Modal,
  MutationForm,
  PageHeader,
  Pagination,
  Panel,
  Resource,
  Table,
} from "../components/ui.jsx";
import { TargetSummary } from "../components/TargetSummary.jsx";
import { date, localDate, money } from "../lib/format.js";
import { useFilters } from "../lib/useFilters.js";

function TargetEditor({ target, scope, onClose }) {
  const { mutate } = useApi();
  return (
    <Modal
      title={target ? "Edit target" : "Set a target"}
      description="Define a clear goal for this advisor or dealership. Active target periods cannot overlap."
      onClose={onClose}
    >
      <MutationForm
        submitLabel={target ? "Save target" : "Create target"}
        onSuccess={onClose}
        onSubmit={(values) =>
          mutate(
            target ? `/api/targets/${target.id}` : "/api/targets",
            {
              method: target ? "PUT" : "POST",
              body: {
                ...scope,
                periodStart: values.get("periodStart"),
                periodEnd: values.get("periodEnd"),
                targetAmount: Number(values.get("targetAmount")),
                currency: "EUR",
                active: values.get("active") === "true",
              },
            },
            target ? "Target updated." : "Target created.",
          )
        }
      >
        <div className="form-grid">
          <Field
            label="Start date"
            name="periodStart"
            type="date"
            required
            defaultValue={target?.periodStart || localDate()}
          />
          <Field
            label="End date"
            name="periodEnd"
            type="date"
            required
            defaultValue={target?.periodEnd || ""}
          />
        </div>
        <Field
          label="Target value (EUR)"
          name="targetAmount"
          type="number"
          min="0.01"
          max="999999999999.99"
          step="0.01"
          required
          defaultValue={target?.targetAmount}
        />
        <Field
          label="Status"
          name="active"
          defaultValue={String(target?.active ?? true)}
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Field>
      </MutationForm>
    </Modal>
  );
}

export default function Targets({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const [filters, update] = useFilters();
  const [editor, setEditor] = useState(null);
  const scope = owner(user, advisorId);
  const resource = useResource(
    query("/api/targets", { ...scope, page: filters.page, size: 10 }),
  );
  const progress = useResource(
    query("/api/targets/progress", {
      ...scope,
      date: dashboard.data?.performance.reportingDate || localDate(),
    }),
  );
  const manager = user.role === "MANAGER";
  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="PROGRESS WITH DIRECTION"
          title={manager ? "Dealership targets" : "My targets"}
          description={
            manager
              ? "Manage your dealership goals. Set individual goals from an advisor’s profile."
              : "Know your goal, track your pace and see what remains."
          }
        >
          {manager && (
            <button className="button primary" onClick={() => setEditor({})}>
              <Plus size={16} />
              Set target
            </button>
          )}
        </PageHeader>
      )}
      <div className="target-layout">
        <Panel
          title="Current progress"
          subtitle={`As of ${date(dashboard.data?.performance.reportingDate || localDate())}`}
        >
          <Resource resource={progress}>
            {(data) => <TargetSummary target={data} link={false} />}
          </Resource>
        </Panel>
        <Panel
          title="Target history"
          subtitle="Configured periods · Newest first"
          action={
            embedded &&
            manager && (
              <button className="button small" onClick={() => setEditor({})}>
                <Plus size={15} />
                Set target
              </button>
            )
          }
        >
          <Resource resource={resource}>
            {(data) => (
              <>
                <Table
                  rows={data.content}
                  caption="Target history"
                  emptyTitle="No targets configured"
                  emptyDescription={
                    manager
                      ? "Set a target to give this reporting scope a clear goal."
                      : "Your manager can assign your first target."
                  }
                  columns={[
                    {
                      key: "periodStart",
                      title: "Period",
                      render: (row) => (
                        <div className="table-identity">
                          <strong>{date(row.periodStart)}</strong>
                          <small>to {date(row.periodEnd)}</small>
                        </div>
                      ),
                    },
                    {
                      key: "targetAmount",
                      title: "Target",
                      numeric: true,
                      render: (row) => money(row.targetAmount, row.currency),
                    },
                    {
                      key: "active",
                      title: "Status",
                      render: (row) => (
                        <Badge value={row.active ? "ACTIVE" : "INACTIVE"} />
                      ),
                    },
                    ...(manager
                      ? [
                          {
                            key: "actions",
                            title: "Action",
                            render: (row) => (
                              <button
                                className="text-button"
                                onClick={() => setEditor(row)}
                              >
                                Edit target
                              </button>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
                <Pagination data={data} onPage={(page) => update({ page })} />
              </>
            )}
          </Resource>
        </Panel>
      </div>
      {editor && (
        <TargetEditor
          target={editor.id ? editor : null}
          scope={scope}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
