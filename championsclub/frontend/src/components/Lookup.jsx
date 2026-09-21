import { useDeferredValue, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useResource } from "../api/ApiContext.jsx";
import { query } from "../api/client.js";
import { ErrorMessage, Pagination } from "./ui.jsx";

export function Lookup({
  title,
  path,
  name,
  value,
  onChange,
  describe,
  eligible = () => true,
  required = true,
  parameters = {},
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const deferred = useDeferredValue(search);
  const [open, setOpen] = useState(false);
  const resource = useResource(
    open
      ? query(path, { ...parameters, search: deferred, page, size: 10 })
      : null,
  );
  const details = useRef(null);
  return (
    <div className="field lookup">
      <span>
        {title}
        {required && <span className="required"> *</span>}
      </span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <details
        ref={details}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary>
          {value ? describe(value) : `Choose ${title.toLowerCase()}`}
          <ChevronDown size={16} />
        </summary>
        <div className="lookup-panel">
          <label className="lookup-search">
            <Search size={16} />
            <input
              aria-label={`Search ${title.toLowerCase()}`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Type to search…"
            />
          </label>
          <ErrorMessage error={resource.error} retry={resource.retry} />
          {resource.loading && (
            <p role="status" className="small muted">
              Searching…
            </p>
          )}
          <div className="lookup-results">
            {resource.data?.content.map((item) => (
              <button
                type="button"
                key={item.id}
                disabled={!eligible(item)}
                onClick={() => {
                  onChange(item);
                  details.current.open = false;
                }}
              >
                {describe(item)}
                {!eligible(item) && <small>Not eligible</small>}
              </button>
            ))}
            {resource.data?.content.length === 0 && <p>No matching records.</p>}
          </div>
          {resource.data && (
            <Pagination data={resource.data} onPage={setPage} />
          )}
        </div>
      </details>
    </div>
  );
}
