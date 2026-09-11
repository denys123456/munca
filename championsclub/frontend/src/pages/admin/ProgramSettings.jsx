import { Crown, Medal, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'

export function ProgramSettings({ data, gamification }) {
  const [form, setForm] = useState(data.settings)
  const [status, setStatus] = useState({ error: '', saved: false })
  const update = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setStatus({ error: '', saved: false }) }
  const canEdit = data.connectionState !== 'live'
  function submit(event) {
    event.preventDefault()
    try { data.actions.updateSettings(form); setStatus({ error: '', saved: true }) }
    catch (error) { setStatus({ error: error.message, saved: false }) }
  }
  return <div className="page-stack">
    <section className="editorial-heading"><div><span className="eyebrow">{gamification ? 'PROGRESS WITH PRESTIGE' : 'THE PROGRAM, ON YOUR TERMS'}</span><h2>{gamification ? 'Every level.' : 'The details.'}<br /><span>{gamification ? 'A higher standard.' : 'They make the difference.'}</span></h2></div><p>Clear rules. Consistent recognition.<br />A program built for sustained performance.</p></section>
    <section className="level-collection">{[{ name: 'Bronze', points: 0, icon: Medal }, { name: 'Silver', points: data.settings.silver, icon: ShieldCheck }, { name: 'Gold', points: data.settings.gold, icon: Crown }].map(({ icon: Icon, ...level }) => <article className={`level-display ${level.name.toLowerCase()}`} key={level.name}><Icon /><span className="eyebrow">CHAMPIONSCLUB</span><h3>{level.name}</h3><p>From {level.points.toLocaleString('en')} lifetime points</p></article>)}</section>
    <form className="panel settings-form" onSubmit={submit}><SectionHeader eyebrow="PROGRAM RULES" title={gamification ? 'Define the milestones' : 'Program preferences'} />
      <div className="form-grid">
        <label><span>Silver threshold</span><input required type="number" min="1" step="1" value={form.silver} disabled={!canEdit} onChange={(event) => update('silver', event.target.value)} /></label>
        <label><span>Gold threshold</span><input required type="number" min={Number(form.silver) + 1} step="1" value={form.gold} disabled={!canEdit} onChange={(event) => update('gold', event.target.value)} /></label>
        {!gamification && <label><span>Default target cycle in days</span><input required type="number" min="1" max="366" value={form.targetDays} disabled={!canEdit} onChange={(event) => update('targetDays', event.target.value)} /></label>}
      </div>
      <p className="soft-copy profile-note">Level changes apply immediately to the demo workspace. Redeeming points preserves lifetime progress.</p>
      {status.error && <p role="alert" className="form-message error">{status.error}</p>}
      {status.saved && <p role="status" className="form-message success">The new program standard is saved.</p>}
      {canEdit && <div className="modal-actions"><button className="primary-action">Save settings</button></div>}
    </form>
  </div>
}
