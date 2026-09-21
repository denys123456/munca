import { useSearchParams } from "react-router-dom";
import { currentPeriod } from "./format.js";
import { useDashboard } from "../components/Shell.jsx";

export function useFilters(defaults = {}) {
  const [search, setSearch] = useSearchParams();
  const values = { ...defaults, ...Object.fromEntries(search.entries()) };
  const page = Number(values.page || 0);
  values.page = Number.isInteger(page) && page >= 0 ? page : 0;
  const update = (changes) =>
    setSearch((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value === "" || value === undefined || value === null)
          next.delete(key);
        else next.set(key, String(value));
      }
      if (!Object.hasOwn(changes, "page")) next.delete("page");
      return next;
    });
  return [values, update];
}

export function usePeriod() {
  const dashboard = useDashboard();
  const fallback = currentPeriod(dashboard.data?.performance.reportingDate);
  const [values, update] = useFilters(fallback);
  return [{ start: values.start, end: values.end }, update];
}
