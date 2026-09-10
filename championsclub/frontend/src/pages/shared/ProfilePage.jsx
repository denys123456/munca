import { CircleUserRound, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function ProfilePage({ data }) {
  const [isEditing, setIsEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [profilePrefs, setProfilePrefs] = useState({ notificationDigest: 'Daily' })

  return (
    <div className="page-stack">
      <section className="profile-hero">
        <CircleUserRound aria-hidden="true" />
        <div>
          <span className="eyebrow">Profile</span>
          <h2>{data.currentUser.name}</h2>
          <p>{data.currentUser.email}</p>
        </div>
        <StatusPill value={data.currentUser.role} />
      </section>
      <section className="content-grid">
        <article className="panel">
          <SectionHeader eyebrow="Account" title="Access profile" action={<button className="secondary-action" type="button" onClick={() => setIsEditing(true)}>Edit profile</button>} />
          <div className="compact-list vertical">
            <div><Mail aria-hidden="true" /><span>{data.currentUser.email}</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>Role-based backend authorization</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>Notification digest: {profilePrefs.notificationDigest}</span></div>
          </div>
          {message && <p className="form-message success">{message}</p>}
        </article>
      </section>
      {isEditing && (
        <ProfileModal
          data={data}
          onClose={() => setIsEditing(false)}
          onSave={(nextPrefs) => {
            setProfilePrefs(nextPrefs)
            setMessage('Profile preferences saved for this session.')
            setIsEditing(false)
          }}
        />
      )}
    </div>
  )
}

function ProfileModal({ data, onClose, onSave }) {
  const [form, setForm] = useState({
    notificationDigest: 'Daily',
  })
  const [error, setError] = useState('')

  function submitProfile(event) {
    event.preventDefault()
    if (!form.notificationDigest) {
      setError('Choose a notification digest.')
      return
    }
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-panel" onSubmit={submitProfile}>
        <SectionHeader eyebrow="Profile" title="Edit profile" />
        <div className="form-grid">
          <label><span>Notification digest</span><select value={form.notificationDigest} onChange={(event) => setForm((current) => ({ ...current, notificationDigest: event.target.value }))}><option>Daily</option><option>Weekly</option><option>Only critical</option></select></label>
        </div>
        {error && <p className="form-message error">{error}</p>}
        <div className="modal-actions">
          <button className="secondary-action" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit">Save preferences</button>
        </div>
      </form>
    </div>
  )
}
