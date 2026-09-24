import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight, RotateCcw } from "lucide-react";
import "./showcase.css";

const chapters = [
  "First impression",
  "Every angle",
  "Closer look",
  "Lasting impression",
];

export default function Showcase() {
  const root = useRef(null);
  const viewport = useRef(null);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const title = document.title;
    document.title = "Golf GTI · The design study · ChampionsClub";
    window.scrollTo(0, 0);
    return () => {
      document.title = title;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let destroy;
    setStatus("loading");
    import("./createShowcase.js")
      .then(({ createShowcase }) => {
        if (disposed) return;
        destroy = createShowcase(root.current, viewport.current, (state) => {
          if (!disposed) setStatus(state);
        });
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      destroy?.();
    };
  }, [attempt]);

  function goToChapter(index) {
    const distance = root.current.offsetHeight - window.innerHeight;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: root.current.offsetTop + distance * [0, 0.22, 0.65, 0.94][index],
      behavior: reduced ? "instant" : "smooth",
    });
  }

  return (
    <main className="car-showcase" ref={root} data-status={status}>
      <div className="car-stage">
        <div className="car-atmosphere" aria-hidden="true" />
        <header className="car-header">
          <Link to="/" className="car-brand" aria-label="ChampionsClub home">
            champions<span>club</span>
            <small>THE DESIGN SERIES</small>
          </Link>
          <span className="car-edition">
            VOLKSWAGEN <span>/</span> 2025
          </span>
          <Link className="car-workspace" to="/overview">
            Your workspace <ArrowUpRight size={15} />
          </Link>
        </header>

        <div className="car-heading">
          <span className="car-eyebrow">THE GOLF GTI · A DESIGN STUDY</span>
          <h1>An icon. In every detail.</h1>
          <p>Familiar spirit. A different perspective.</p>
        </div>
        <span className="car-watermark" aria-hidden="true">
          GOLF GTI
        </span>
        <div
          className="car-viewport"
          ref={viewport}
          role="img"
          aria-label="Silver Volkswagen Golf GTI, presented in a scroll-driven three-dimensional studio"
        >
          <img
            className="car-poster"
            src={`${import.meta.env.BASE_URL}models/golf-gti-poster.webp`}
            alt="Silver Volkswagen Golf GTI in a studio"
          />
        </div>
        <div className="car-loading" role="status" aria-live="polite">
          {status === "loading" && (
            <>
              <span className="car-loading-line" />
              Preparing your perspective
            </>
          )}
          {status === "error" && (
            <>
              <span>
                The still view. 3D is unavailable on this connection or device.
              </span>
              <button onClick={() => setAttempt((value) => value + 1)}>
                Try 3D again <RotateCcw size={13} />
              </button>
            </>
          )}
        </div>

        <div className="car-detail" aria-hidden="true">
          <span className="car-eyebrow">03 / CLOSER LOOK</span>
          <h2>
            Considered. <br />
            Down to the detail.
          </h2>
          <p>
            Sculpted surfaces. A signature in light. <br />
            Character from every perspective.
          </p>
        </div>
        <div className="car-finale" aria-hidden="true">
          <span className="car-eyebrow">04 / LASTING IMPRESSION</span>
          <h2>
            Some things <br />
            stay with you.
          </h2>
        </div>

        <footer className="car-footer">
          <div className="car-model">
            <strong>Golf GTI</strong>
            <span>VOLKSWAGEN / THE DESIGN SERIES</span>
          </div>
          <nav className="car-chapters" aria-label="Showcase chapters">
            {chapters.map((chapter, index) => (
              <button
                key={chapter}
                onClick={() => goToChapter(index)}
                data-chapter={index}
                aria-label={`${index + 1}. ${chapter}`}
              >
                <span>0{index + 1}</span>
                <span className="car-chapter-label">{chapter}</span>
              </button>
            ))}
          </nav>
          <button className="car-scroll" onClick={() => goToChapter(1)}>
            SCROLL TO EXPLORE <ArrowDown size={16} />
          </button>
        </footer>
        <div className="car-progress" aria-hidden="true">
          <span />
        </div>
        <a className="car-skip" href="#/overview">
          Skip to workspace <ArrowUpRight size={13} />
        </a>
      </div>
    </main>
  );
}
