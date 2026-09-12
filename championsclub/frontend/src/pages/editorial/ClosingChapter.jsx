import { Scene, PrintLabel } from './EditorialParts.jsx'

export function ClosingChapter({ stops, onCloseBook }) {
  return <>
    <Scene stops={stops} index={0} className="closing-statement"><PrintLabel number="FIN">THE PERFORMANCE ISSUE</PrintLabel><h1 className="chapter-statement">Performance is not<br />the end of the story.<br /><em>It is where the next<br />chapter begins.</em></h1><span className="printed-scroll">One final turn of perspective →</span></Scene>
    <Scene stops={stops} index={1} className="closing-colophon"><span className="closing-monogram">CC</span><PrintLabel number="CHAMPIONSCLUB">THE PERFORMANCE STANDARD</PrintLabel><h2>Until your<br /><em>next chapter.</em></h2><button className="print-link" aria-label="Close Book" onClick={onCloseBook}>Close Book <span aria-hidden="true">↗</span></button></Scene>
  </>
}
