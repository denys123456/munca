import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { owner } from "../api/paths.js";
import { useDashboard } from "../components/Shell.jsx";
import {
  Field,
  Modal,
  MutationForm,
  PageHeader,
  Panel,
  Resource,
} from "../components/ui.jsx";
import { TargetSummary } from "../components/TargetSummary.jsx";
import {
  ForecastActualHistory,
  TargetTrajectory,
} from "../components/DashboardViz.jsx";
import { date, localDate } from "../lib/format.js";

function TargetCreator({ scope, onClose }) {
  const { mutate } = useApi();
  return (
    <Modal
      title="Create target period"
      description="Choose the exact period and target value. Existing target periods are immutable; create a new period instead of editing history."
      onClose={onClose}
    >
      <MutationForm
        submitLabel="Create target"
        onSuccess={onClose}
        onSubmit={(values) =>
          mutate(
            "/api/targets",
            {
              method: "POST",
              body: {
                ...scope,
                periodStart: values.get("periodStart"),
                periodEnd: values.get("periodEnd"),
                targetAmount: Number(values.get("targetAmount")),
                currency: "EUR",
                active: true,
              },
            },
            "Target period created.",
          )
        }
      >
        <div className="form-grid">
          <Field
            label="Target starts"
            name="periodStart"
            type="date"
            required
            defaultValue={localDate()}
          />
          <Field
            label="Target ends"
            name="periodEnd"
            type="date"
            required
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
        />
      </MutationForm>
    </Modal>
  );
}

export default function Targets({ advisorId, embedded = false }) {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const [creating, setCreating] = useState(false);
  const scope = owner(user, advisorId);
  const progress = useResource(
    query("/api/targets/progress", {
      ...scope,
      date: dashboard.data?.performance.reportingDate || localDate(),
    }),
  );
  const advisorProfile = useResource(
    advisorId ? `/api/advisors/${encodeURIComponent(advisorId)}/profile` : null,
  );
  const manager = user.role === "MANAGER";
  const historyComparison = useResource(
    query("/api/forecasts/history", {
      subjectId: scope.ownerId,
      subjectType: scope.ownerType,
    }),
  );

  const trajectoryTarget = advisorId
    ? advisorProfile.data?.currentTarget
    : dashboard.data?.performance?.target;
  const trajectoryPoints = advisorId
    ? advisorProfile.data?.currentPeriod?.dailySales
    : dashboard.data?.performance?.analytics?.dailySales;

  return (
    <>
      {!embedded && (
        <PageHeader
          eyebrow="PROGRESS WITH DIRECTION"
          title={manager ? "Dealership targets" : "My targets"}
          description={
            manager
              ? "Create new target periods, compare actual progress with required pace, and review historical forecast accuracy."
              : "Know your goal, track your pace and see what remains."
          }
        >
          {manager && (
            <button className="button primary" onClick={() => setCreating(true)}>
              <CalendarRange size={16} />
              New target period
            </button>
          )}
        </PageHeader>
      )}

      {trajectoryTarget?.targetId && trajectoryPoints?.length > 0 && (
        <Panel
          title={advisorId ? "Advisor target achievement over time" : "Target achievement over time"}
          subtitle="Cumulative recorded sales versus the pace required to reach this target"
          className="target-trajectory-panel"
        >
          <TargetTrajectory
            points={trajectoryPoints}
            target={trajectoryTarget}
          />
        </Panel>
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
          title="Forecast vs actual by target period"
          subtitle={
            scope.ownerType === "ADVISOR"
              ? "Advisor prediction at day 14 versus final recorded sales · compare forecast accuracy across completed target periods"
              : "Prediction at day 14 versus final recorded sales · ML backtest where available, pace fallback otherwise"
          }
        >
          <Resource resource={historyComparison}>
            {(data) => <ForecastActualHistory rows={data} />}
          </Resource>
        </Panel>
      </div>

      {creating && manager && !embedded && (
        <TargetCreator
          scope={scope}
          onClose={() => setCreating(false)}
        />
      )}
    </>
  );
}
