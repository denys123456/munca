export function LoadingExperience({ progress }) {
  return <div className="experience-loading" role="status" aria-label="Preparing the automotive experience">
    <span className="loading-wordmark">CHAMPIONSCLUB<span>®</span></span>
    <div className="loading-mechanism"><span style={{ transform: `scaleX(${progress / 100})` }} /></div>
    <div className="loading-caption"><span>ENGINEERING PERFORMANCE</span><span>{String(Math.round(progress)).padStart(3, '0')}</span></div>
  </div>
}
