import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { request } from "./client.js";

const Context = createContext(null);

export function ApiProvider({ children }) {
  const cache = useRef(new Map());
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const invalidate = useCallback(() => {
    cache.current.clear();
    setRevision((value) => value + 1);
  }, []);
  const mutate = useCallback(
    async (path, options, confirmation) => {
      const result = await request(path, options);
      invalidate();
      if (confirmation) setNotice(confirmation);
      return result;
    },
    [invalidate],
  );
  return (
    <Context.Provider
      value={{
        cache: cache.current,
        revision,
        invalidate,
        mutate,
        notice,
        setNotice,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useApi = () => useContext(Context);

export function useResource(path) {
  const { cache, revision } = useApi();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    path: null,
    data: null,
    loading: true,
    error: null,
  });
  const retry = useCallback(() => {
    if (path) cache.delete(path);
    setAttempt((value) => value + 1);
  }, [path, cache]);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const existing = cache.get(path);
    if (existing && Date.now() - existing.at < 30000) {
      setState({ path, data: existing.data, loading: false, error: null });
      return;
    }
    setState((previous) => ({
      path,
      data: previous.path === path ? previous.data : null,
      loading: true,
      error: null,
    }));
    request(path, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        cache.set(path, { data, at: Date.now() });
        setState({ path, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [path, revision, attempt, cache]);
  return {
    ...(state.path === path
      ? state
      : { data: null, loading: Boolean(path), error: null }),
    retry,
  };
}
