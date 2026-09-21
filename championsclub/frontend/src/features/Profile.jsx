import { useAuth } from "../auth/AuthContext.jsx";
import { useDashboard } from "../components/Shell.jsx";
import { date, fullName, initials, label } from "../lib/format.js";
import { Badge, PageHeader, Panel } from "../components/ui.jsx";

export default function Profile() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  return (
    <>
      <PageHeader
        eyebrow="YOUR CHAMPIONSCLUB IDENTITY"
        title="My profile"
        description="Your account and workspace details."
      />
      <Panel title="Account details">
        <div className="profile-heading">
          <span className="avatar large-avatar">{initials(user)}</span>
          <div>
            <h2>{fullName(user)}</h2>
            <p>{user.email}</p>
          </div>
          <Badge value={user.active ? "ACTIVE" : "INACTIVE"} />
        </div>
        <dl className="detail-grid">
          <div>
            <dt>First name</dt>
            <dd>{user.firstName}</dd>
          </div>
          <div>
            <dt>Last name</dt>
            <dd>{user.lastName}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{label(user.role)}</dd>
          </div>
          <div>
            <dt>Specialism</dt>
            <dd>
              {user.advisorType
                ? `${label(user.advisorType)} advisor`
                : "Team management"}
            </dd>
          </div>
          <div>
            <dt>Dealership</dt>
            <dd>
              {dashboard.data?.dealership.name ||
                `Dealership #${user.dealershipId}`}
            </dd>
          </div>
          <div>
            <dt>Account created</dt>
            <dd>{date(user.createdAt)}</dd>
          </div>
        </dl>
        <p className="profile-note">
          Account details are managed by your program coordinator. Contact them
          to request a change.
        </p>
      </Panel>
    </>
  );
}
