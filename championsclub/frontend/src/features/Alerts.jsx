import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { useFilters } from "../lib/useFilters.js";
import { date } from "../lib/format.js";
import {
  Badge,
  Empty,
  ErrorMessage,
  PageHeader,
  Pagination,
  Panel,
  Resource,
} from "../components/ui.jsx";

export default function Alerts() {
  const { user } = useAuth();
  const { mutate } = useApi();
  const [filters, update] = useFilters();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const resource = useResource(
    query("/api/alerts", { page: filters.page, size: 12 }),
  );
  async function act(alert, action) {
    if (pending) return;
    setPending(`${alert.id}-${action}`);
    setError(null);
    try {
      await mutate(
        `/api/alerts/${alert.id}/${action}`,
        { method: "POST" },
        action === "read" ? "Notification marked as read." : "Alert resolved.",
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(null);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="STAY ONE STEP AHEAD"
        title="Notifications"
        description="Important updates, performance signals and opportunities that need your attention."
      />
      <ErrorMessage error={error} />
      <Panel
        title="Your notifications"
        subtitle="Newest first · Personal notifications"
      >
        <Resource resource={resource}>
          {(data) => (
            <>
              {!data.content.length && (
                <Empty
                  title="You’re all caught up"
                  description="Important performance updates and opportunities will appear here."
                />
              )}
              <div className="alert-list">
                {data.content.map((alert) => (
                  <article
                    key={alert.id}
                    className={`alert-row ${!alert.readAt ? "unread" : ""}`}
                  >
                    <span className="icon-tile">
                      <Bell size={18} />
                    </span>
                    <div className="alert-body">
                      <div className="alert-heading">
                        <h3>{alert.title}</h3>
                        <Badge value={alert.severity} />
                        {!alert.readAt && <Badge tone="blue">Unread</Badge>}
                        {alert.resolvedAt && (
                          <Badge tone="positive">Resolved</Badge>
                        )}
                      </div>
                      <p>{alert.message}</p>
                      <div className="alert-meta">
                        <span>{date(alert.createdAt)}</span>
                        <div>
                          {!alert.readAt && (
                            <button
                              className="text-button"
                              disabled={Boolean(pending)}
                              onClick={() => act(alert, "read")}
                            >
                              <Check size={14} />
                              Mark as read
                            </button>
                          )}
                          {user.role === "MANAGER" && !alert.resolvedAt && (
                            <button
                              className="text-button"
                              disabled={Boolean(pending)}
                              onClick={() => act(alert, "resolve")}
                            >
                              <CheckCheck size={14} />
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <Pagination data={data} onPage={(page) => update({ page })} />
            </>
          )}
        </Resource>
      </Panel>
    </>
  );
}
