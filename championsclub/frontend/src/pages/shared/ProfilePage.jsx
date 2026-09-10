import { CircleUserRound, Mail, ShieldCheck } from 'lucide-react'
import { SectionHeader } from '../../components/ui/SectionHeader.jsx'
import { StatusPill } from '../../components/ui/StatusPill.jsx'

export function ProfilePage({ data }) {
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
          <SectionHeader eyebrow="Account" title="Access profile" />
          <div className="compact-list vertical">
            <div><Mail aria-hidden="true" /><span>{data.currentUser.email}</span></div>
            <div><ShieldCheck aria-hidden="true" /><span>Role-based backend authorization</span></div>
          </div>
        </article>
      </section>
    </div>
  )
}

