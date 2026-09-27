import { useEffect, useRef, useState } from "react";
import { createEngineLab } from "./createEngineLab.js";
import { cameraViews } from "./studio.js";
import "./engine-lab.css";

export default function EngineLab() {
  const host = useRef(null);
  const controller = useRef(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [manifest, setManifest] = useState(null);
  const [validation, setValidation] = useState(null);
  const [effectiveAngle, setEffectiveAngle] = useState(Math.PI / 4);
  const [stats, setStats] = useState(null);
  const [state, setState] = useState({ engineMechanismProgress: 0.125, explosionProgress: 0, cameraProgress: 0, sourcePose: false });
  const [playing, setPlaying] = useState(false);
  const [inspector, setInspector] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [selected, setSelected] = useState("EngineBlock");
  const [hidden, setHidden] = useState([]);
  const [wireframe, setWireframe] = useState(false);
  const [orbit, setOrbit] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const title = document.title;
    document.title = "Engine Lab / ChampionsClub";
    let active = true;
    setStatus("loading");
    let lab;
    try {
      lab = createEngineLab(host.current, update => {
        if (!active) return;
        setStatus(update.status);
        if (update.message) setError(update.message);
        if (update.manifest) setManifest(update.manifest);
        if (update.validation) setValidation(update.validation);
        if (update.effectiveAngle !== undefined) setEffectiveAngle(update.effectiveAngle);
        if (update.state) setState(update.state);
        if (update.stats) setStats(update.stats);
        if (update.playing !== undefined) setPlaying(update.playing);
      });
      controller.current = lab;
      window.engineLab = lab;
    } catch (failure) {
      setStatus("error");
      setError(failure.message);
    }
    return () => {
      active = false;
      lab?.dispose();
      if (window.engineLab === lab) delete window.engineLab;
      controller.current = null;
      document.title = title;
    };
  }, [attempt]);

  function update(next) {
    const result = controller.current?.setTimeline(next);
    if (result) setState(result);
  }
  function togglePlay() {
    if (state.sourcePose) update({ sourcePose: false });
    controller.current?.setPlaying(!playing);
    setPlaying(!playing);
  }
  function reset() {
    controller.current?.setPlaying(false);
    controller.current?.setOrbit(false);
    controller.current?.setWireframe(false);
    hidden.forEach(id => controller.current?.setVisibility(id, true));
    setPlaying(false); setOrbit(false); setWireframe(false); setHidden([]);
    update({ engineMechanismProgress: 0.125, explosionProgress: 0, cameraProgress: 0, sourcePose: false });
  }
  function toggleSelected() {
    const visible = hidden.includes(selected);
    controller.current?.setVisibility(selected, visible);
    setHidden(current => visible ? current.filter(id => id !== selected) : [...current, selected]);
  }
  function isolateLinkage() {
    const excluded = manifest.components.filter(c => !["piston", "rod", "crank", "flywheel"].includes(c.kind)).map(c => c.id);
    manifest.components.forEach(c => controller.current?.setVisibility(c.id, !excluded.includes(c.id)));
    setHidden(excluded);
    update({ sourcePose: false, explosionProgress: 0, cameraProgress: 0.5 });
  }
  const view = state.explosionProgress > 0.9 ? "Exploded study" : cameraViews[Math.min(4, Math.round(state.cameraProgress * 4))].name;
  const selectedComponent = manifest?.components.find(c => c.id === selected);
  const effectiveDegrees = ((Math.round(effectiveAngle * 180 / Math.PI) % 360) + 360) % 360;
  const contacts = !state.sourcePose && state.explosionProgress === 0
    ? validation?.contacts.filter(c => c.sampledAngleRanges.some(([start, end]) => effectiveDegrees >= start && effectiveDegrees <= end)) ?? []
    : [];

  return (
    <main className={`engine-lab ${presentation ? "engine-lab--presentation" : ""}`} data-status={status} style={{ "--engine-tone": `${state.explosionProgress * 100}%` }}>
      <div className="engine-lab__stage" ref={host} />
      <header className="engine-lab__header">
        <a href="#/showcase" className="engine-lab__brand">CHAMPIONSCLUB<span>ENGINEERING STUDIES / 01</span></a>
        <div className="engine-lab__tools">
          {!presentation && <button type="button" onClick={() => setInspector(!inspector)} aria-expanded={inspector}>Inspect {inspector ? "−" : "+"}</button>}
          <button type="button" onClick={() => setPresentation(!presentation)}>{presentation ? "Show lab controls" : "Presentation"}</button>
        </div>
      </header>
      <section className="engine-lab__intro" aria-label="Engine study">
        <p className="engine-lab__eyebrow">THE MECHANICAL COLLECTION</p>
        <h1>Motion,<br /><em>revealed.</em></h1>
        <p className="engine-lab__description">Four cylinders. One continuous movement.<br />An open study of the machine within.</p>
        <div className="engine-lab__caption"><span className="engine-lab__line" />{view}</div>
      </section>
      {status === "loading" && <div className="engine-lab__message" role="status">Preparing the mechanical study<span>Loading the optimized engine</span></div>}
      {status === "error" && <div className="engine-lab__message" role="alert"><strong>Engine unavailable</strong><span>{error}</span><button type="button" onClick={() => setAttempt(attempt + 1)}>Try again</button></div>}
      {!presentation && status === "ready" && (
        <>
          <aside className="engine-lab__annotation"><span>INLINE FOUR / CUTAWAY</span><span>Measured linkage · Prepared assembly</span><span>{state.explosionProgress >= 0.35 ? "Mechanism parked for separation" : state.sourcePose ? "Original source pose" : "360° mechanical study"}</span>{contacts.length > 0 && <span className="engine-lab__contact" role="status">Surface intersections · {contacts.length} component pairs · {effectiveDegrees}° · See inspector</span>}</aside>
          <div className="engine-lab__controls" aria-label="Engine lab controls">
            <div className="engine-lab__transport">
              <button className="engine-lab__play" type="button" onClick={togglePlay} disabled={state.explosionProgress > 0}>{playing ? "Pause" : "Play"}<span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span></button>
              <button type="button" onClick={reset}>Reset study ↺</button>
            </div>
            <label className="engine-lab__slider">CRANK ANGLE<output>{Math.round(state.engineMechanismProgress * 360)}°</output><input aria-label="Crank angle" type="range" min="0" max="1" step="0.001" value={state.engineMechanismProgress} disabled={state.explosionProgress > 0 || state.sourcePose} onChange={e => { controller.current?.setPlaying(false); setPlaying(false); update({ engineMechanismProgress: Number(e.target.value) }); }} /></label>
            <label className="engine-lab__slider">SEPARATION<output>{Math.round(state.explosionProgress * 100)}%</output><input aria-label="Explosion progress" type="range" min="0" max="1" step="0.001" value={state.explosionProgress} onChange={e => update({ explosionProgress: Number(e.target.value) })} /></label>
            <label className="engine-lab__slider">CAMERA STUDY<output>{Math.round(state.cameraProgress * 100)}%</output><input aria-label="Camera progress" type="range" min="0" max="1" step="0.001" value={state.cameraProgress} onChange={e => { controller.current?.setOrbit(false); setOrbit(false); update({ cameraProgress: Number(e.target.value) }); }} /></label>
          </div>
          <footer className="engine-lab__footer"><span>DEVELOPMENT LAB · NOT A PRODUCTION INTEGRATION</span><span>{stats ? `${Math.round(stats.triangles).toLocaleString()} TRIANGLES / ${stats.drawCalls} DRAWS` : "MEASURING SCENE"}</span></footer>
          {inspector && <aside className="engine-lab__inspector" aria-label="Semantic inspector">
            <p className="engine-lab__eyebrow">DEVELOPMENT INSPECTOR</p>
            <label><input type="checkbox" checked={state.sourcePose} onChange={e => { controller.current?.setPlaying(false); setPlaying(false); update({ sourcePose: e.target.checked }); }} /> Original source pose</label>
            <label><input type="checkbox" checked={wireframe} onChange={e => { setWireframe(e.target.checked); controller.current?.setWireframe(e.target.checked); }} /> Wireframe</label>
            <label><input type="checkbox" checked={orbit} onChange={e => { setOrbit(e.target.checked); controller.current?.setOrbit(e.target.checked); }} /> Orbit inspection</label>
            <label htmlFor="engine-component">Semantic component</label>
            <select id="engine-component" value={selected} onChange={e => setSelected(e.target.value)}>{manifest.components.map(c => <option key={c.id}>{c.id}</option>)}</select>
            <button type="button" onClick={toggleSelected}>{hidden.includes(selected) ? "Show component" : "Hide component"}</button>
            <button type="button" onClick={isolateLinkage}>Isolate linkage for inspection</button>
            <p className="engine-lab__object-names">{selectedComponent?.originalNames.join(" · ")}</p>
            <dl><dt>Frame interval, median</dt><dd>{stats?.medianFrameMilliseconds.toFixed(1)} ms</dd><dt>Observed cadence</dt><dd>{stats?.fps.toFixed(1)} fps</dd><dt>Load + decode</dt><dd>{stats ? (stats.loadMilliseconds / 1000).toFixed(2) : "—"} s</dd></dl>
            <p className="engine-lab__limitation">Prepared kinematics, not a certified engine simulation. Open cylinder geometry and source joint clearances require review. Valves, cams and chain remain static.</p>
            <p className="engine-lab__limitation">Detected geometry intersections (1° sampling): {validation?.contacts.map(c => `${c.component} / ${c.targetParent}: ${c.sampledAngleRanges.map(([a, b]) => `${a}–${b}°`).join(", ")}`).join("; ")}</p>
          </aside>}
        </>
      )}
    </main>
  );
}
