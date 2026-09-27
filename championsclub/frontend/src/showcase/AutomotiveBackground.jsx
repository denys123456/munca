import { useEffect, useRef } from "react";
import "./showcase.css";

export function AutomotiveBackground() {
  const root = useRef(null);
  const viewport = useRef(null);

  useEffect(() => {
    let dispose;
    let cancelled = false;
    import("./createShowcase.js").then(({ createShowcase }) => {
      if (!cancelled) {
        dispose = createShowcase(root.current, viewport.current, (status) => {
          root.current?.setAttribute("data-status", status);
        });
      }
    }).catch(() => root.current?.setAttribute("data-status", "error"));
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div className="automotive-background car-showcase" ref={root} data-background="true" data-status="loading" aria-hidden="true">
      <div className="car-stage">
        <div className="car-heading" /><span className="car-watermark" />
        <div className="car-viewport" ref={viewport} />
        <div className="car-detail" /><div className="car-finale" />
        <div className="car-loading" /><div className="car-footer" />
        <div className="car-progress"><span /></div>
      </div>
    </div>
  );
}
