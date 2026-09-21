import { Component, useEffect, useId, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Inbox,
  Search,
  X,
} from "lucide-react";
import { label, number, percent } from "../lib/format.js";

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty-state" role="alert">
        <CircleAlert />
        <h2>This view could not be displayed</h2>
        <p>Reload the workspace to try again.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

export function Loading() {
  return (
    <div className="loading-state" role="status" aria-label="Loading workspace">
      <span className="sr-only">Loading…</span>
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        {[0, 1, 2, 3].map((index) => (
          <div className="skeleton" key={index} />
        ))}
      </div>
      <div className="skeleton skeleton-chart" />
    </div>
  );
}

export function ErrorMessage({ error, retry }) {
  if (!error) return null;
  return (
    <div className="error-message" role="alert">
      <CircleAlert size={18} />
      <div>
        <strong>
          {error.status === 403
            ? "You do not have access to this information."
            : error.message}
        </strong>
        {error.fields?.length > 0 && (
          <ul>
            {error.fields.map((field, index) => (
              <li key={`${field.field}-${index}`}>
                {label(field.field)}: {field.message}
              </li>
            ))}
          </ul>
        )}
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function Resource({ resource, children }) {
  if (resource.error)
    return <ErrorMessage error={resource.error} retry={resource.retry} />;
  if (!resource.data) return resource.loading ? <Loading /> : null;
  return (
    <div className="resource" aria-busy={resource.loading}>
      {resource.loading && (
        <span className="refresh-indicator" role="status">
          Updating…
        </span>
      )}
      {children(resource.data)}
    </div>
  );
}

export function Empty({
  title = "No records yet",
  description = "Records will appear here when they are available.",
  children,
}) {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </header>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Badge({ value, children, tone }) {
  const positive = [
    "RECORDED",
    "ACTIVE",
    "ACHIEVED",
    "AHEAD",
    "OPPORTUNITY",
    "AVAILABLE",
    "ISSUED",
    "GOLD",
  ];
  const warning = ["AT_RISK", "WARNING", "HIGH", "BRONZE"];
  const danger = ["CRITICAL", "CANCELLED"];
  const color =
    tone ||
    (positive.includes(value)
      ? "positive"
      : warning.includes(value)
        ? "warning"
        : danger.includes(value)
          ? "danger"
          : "neutral");
  return <span className={`badge ${color}`}>{children || label(value)}</span>;
}

export function Kpi({ title, value, subtitle, change, icon: Icon }) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        {title}
        {Icon && <Icon size={17} />}
      </div>
      <strong className="kpi-value">{value}</strong>
      <div className="kpi-footer">
        {change !== undefined && change !== null && (
          <span
            className={`change ${Number(change) >= 0 ? "positive-text" : "danger-text"}`}
          >
            {Number(change) >= 0 ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {percent(Math.abs(change))}
          </span>
        )}
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

export function Progress({ value, title = "Progress" }) {
  const bounded = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={title}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
    >
      <span style={{ width: `${bounded}%` }} />
    </div>
  );
}

export function Field({
  label: title,
  hint,
  children,
  className = "",
  ...props
}) {
  const id = useId();
  return (
    <label className={`field ${className}`} htmlFor={id}>
      <span>
        {title}
        {props.required && <span className="required"> *</span>}
      </span>
      {children ? (
        <select id={id} {...props}>
          {children}
        </select>
      ) : (
        <input id={id} {...props} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function SearchForm({
  value,
  onSearch,
  placeholder = "Search records",
  label: title = "Search",
}) {
  return (
    <form
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(new FormData(event.currentTarget).get("search").trim());
      }}
      key={value}
    >
      <Search size={17} />
      <input
        name="search"
        aria-label={title}
        defaultValue={value}
        placeholder={placeholder}
        maxLength={160}
      />
      <button type="submit" className="button small">
        Search
      </button>
    </form>
  );
}

export function Pagination({ data, onPage }) {
  if (!data || data.totalElements === 0) return null;
  return (
    <div className="pagination">
      <span>
        {number(data.number * data.size + 1)}–
        {number(Math.min((data.number + 1) * data.size, data.totalElements))} of{" "}
        {number(data.totalElements)} records
      </span>
      <div>
        <button
          type="button"
          className="icon-button"
          aria-label="Previous page"
          disabled={data.number === 0}
          onClick={() => onPage(data.number - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span>
          Page {data.number + 1} of {data.totalPages}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Next page"
          disabled={!data.hasNext}
          onClick={() => onPage(data.number + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

export function Table({
  columns,
  rows,
  rowKey = "id",
  emptyTitle,
  emptyDescription,
  caption,
}) {
  if (!rows?.length)
    return <Empty title={emptyTitle} description={emptyDescription} />;
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={caption || "Records"}
    >
      <table>
        <caption className="sr-only">{caption || "Records"}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                scope="col"
                key={column.key}
                className={column.numeric ? "numeric" : ""}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={
                typeof rowKey === "function"
                  ? rowKey(row)
                  : (row[rowKey] ?? index)
              }
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.numeric ? "numeric" : ""}
                >
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Modal({ title, description, onClose, children }) {
  const ref = useRef(null);
  const heading = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={heading}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id={heading}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function MutationForm({
  children,
  onSubmit,
  onSuccess,
  submitLabel = "Save changes",
  danger = false,
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const locked = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await onSubmit(new FormData(event.currentTarget));
      onSuccess?.(result);
    } catch (failure) {
      setError(failure);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={pending}>{children}</fieldset>
      <ErrorMessage error={error} />
      <div className="form-actions">
        <button
          className={`button ${danger ? "danger-button" : "primary"}`}
          disabled={pending}
        >
          {pending ? "Saving…" : submitLabel}
          {!pending && !danger && <Check size={16} />}
        </button>
      </div>
    </form>
  );
}

export function DateRange({ dates, onChange }) {
  return (
    <form
      className="date-range"
      key={`${dates.start}-${dates.end}`}
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        onChange({ start: values.get("start"), end: values.get("end") });
      }}
    >
      <Field
        label="From"
        name="start"
        type="date"
        required
        defaultValue={dates.start}
      />
      <Field
        label="To"
        name="end"
        type="date"
        required
        defaultValue={dates.end}
      />
      <button className="button" type="submit">
        Apply dates
      </button>
    </form>
  );
}
