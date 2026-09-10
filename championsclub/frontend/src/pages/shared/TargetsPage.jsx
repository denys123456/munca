import { CalendarClock, Edit3, Target } from 'lucide-react'
import { useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'
import { formatCurrency } from '../../product/formatters.js'

export function TargetsPage({ data, role }) {
  const canEditTargets = role === 'MANAGER' || role === 'ADMIN'
  const [editingTarget, setEditingTarget] = useState(null)

  return (
    <div className="page-stack">
      <section className="panel table-panel">
        <SectionHeader
          eyebrow="Planning"
          title="Active target portfolio"
          action={canEditTargets && <button className="secondary-action" type="button" onClick={() => setEditingTarget(data.targets[0])}><Edit3 aria-hidden="true" />Edit target</button>}
        />
        <div className="target-grid">
          {data.targets.map((target) => {
            const progress = target.actual * 100 / target.amount
            return (
              <article className="target-card" key={target.name}>
                <div className="target-card-header">
                  <Target aria-hidden="true" />
                  <StatusPill value={target.status} />
                </div>
                <h3>{target.name}</h3>
                <span>{target.owner}</span>
                <ProgressBar label="Actual versus target" value={progress} />
                <div className="target-footer">
                  <strong>{formatCurrency(target.actual)}</strong>
                  <small>{formatCurrency(target.amount)}</small>
                </div>
                <div className="timeline-note">
                  <CalendarClock aria-hidden="true" />
                  <span>Ends {target.endDate}</span>
                </div>
                {canEditTargets && <button className="secondary-action" type="button" onClick={() => setEditingTarget(target)}><Edit3 aria-hidden="true" />Edit</button>}
              </article>
            )
          })}
        </div>
      </section>
      {editingTarget && (
        <TargetEditor
          target={editingTarget}
          onClose={() => setEditingTarget(null)}
          onSave={(patch) => {
            data.actions.updateTarget(editingTarget.name, patch)
            setEditingTarget(null)
          }}
        />
      )}
    </div>
  )
}

function TargetEditor({ target, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: target.amount,
    actual: target.actual,
    status: target.status,
    endDate: target.endDate,
  })
  const [error, setError] = useState('')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submitForm(event) {
    event.preventDefault()
    if (Number(form.amount) <= 0) {
      setError('Target amount must be greater than zero.')
      return
    }
    if (Number(form.actual) < 0) {
      setError('Actual amount cannot be negative.')
      return
    }
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel" onSubmit={submitForm}>
        <SectionHeader eyebrow="Target" title={`Edit ${target.name}`} />
        <div className="form-grid">
          <label><span>Target amount</span><input type="number" min="1" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} /></label>
          <label><span>Actual amount</span><input type="number" min="0" value={form.actual} onChange={(event) => updateField('actual', event.target.value)} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)}><option>ACTIVE</option><option>COMPLETED</option><option>PAUSED</option></select></label>
          <label><span>End date</span><input value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} /></label>
        </div>
        {error && <p className="form-message error">{error}</p>}
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit">Save target</button>
        </div>
      </form>
    </div>
  )
}
