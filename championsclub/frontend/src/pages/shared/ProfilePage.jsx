import { Bell, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog.jsx'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'

export function ProfilePage({ data }) {
  const [editing, setEditing] = useState(false)
  const preferences = data.preferences[data.currentUser.id] ?? { notificationDigest: 'Daily' }
  return <div className="page-stack">
    <section className="profile-hero"><span className="profile-monogram">{data.currentUser.avatar}</span><div><span className="eyebrow">YOUR CHAMPIONSCLUB</span><h2>{data.currentUser.name}</h2><p>{data.currentUser.title} / {data.currentUser.dealership}</p></div><span className="member-stamp"><ShieldCheck />VERIFIED DEMO IDENTITY</span></section>
    <section className="content-grid">
      <article className="panel"><SectionHeader eyebrow="The essentials" title="Your account" />
        <div className="compact-list vertical"><div><Mail /><span>{data.currentUser.email}</span></div><div><ShieldCheck /><span>{data.currentUser.title}</span></div></div>
        <p className="soft-copy profile-note">Your role belongs to your account. Use the demo account switcher to explore another fictional identity.</p>
      </article>
      <article className="panel"><SectionHeader eyebrow="On your terms" title="Notification preferences" action={<button className="secondary-action" onClick={() => setEditing(true)}>Edit preferences</button>} />
        <div className="compact-list vertical"><div><Bell /><span>Notification digest</span><strong>{preferences.notificationDigest}</strong></div></div>
        <p className="soft-copy profile-note">Your preferences are saved on this device. Email delivery is not enabled in the demo workspace.</p>
      </article>
    </section>
    {editing && <PreferenceEditor preferences={preferences} onClose={() => setEditing(false)} onSave={(next) => { data.actions.updatePreferences(next); setEditing(false) }} />}
  </div>
}

function PreferenceEditor({ preferences, onClose, onSave }) {
  const [digest, setDigest] = useState(preferences.notificationDigest)
  return <Dialog title="Notification preferences" onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSave({ notificationDigest: digest }) }}>
    <div className="form-grid"><label><span>Notification digest</span><select value={digest} onChange={(event) => setDigest(event.target.value)}><option>Daily</option><option>Weekly</option><option>Only critical</option></select></label></div>
    <div className="modal-actions"><button className="secondary-action" type="button" onClick={onClose}>Cancel</button><button className="primary-action">Save preferences</button></div>
  </form></Dialog>
}
