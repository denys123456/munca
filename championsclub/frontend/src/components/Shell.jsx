import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Coins,
  CarFront,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useApi, useResource } from "../api/ApiContext.jsx";
import { dashboardPath } from "../api/paths.js";
import { fullName, initials, label } from "../lib/format.js";
import { ErrorMessage } from "./ui.jsx";

const DashboardContext = createContext(null);
export const useDashboard = () => useContext(DashboardContext);
const navigation = [
  {
    group: "WORKSPACE",
    items: [
      ["overview", "Overview", LayoutDashboard],
      ["performance", "Performance", ChartNoAxesCombined],
      ["advisors", "Your team", Users, "MANAGER"],
      ["sales", "Sales activity", Activity],
      ["targets", "Targets", Target],
    ],
  },
  {
    group: "INTELLIGENCE",
    items: [
      ["forecasts", "Forecasts", TrendingUp],
      ["insights", "Insights", Sparkles],
      ["leaderboard", "Leaderboard", Trophy],
    ],
  },
  {
    group: "PROGRAM",
    items: [
      ["rewards", "Rewards", Gift, "ADVISOR"],
      ["points", "Points ledger", Coins, "ADVISOR"],
      ["products", "Product catalog", Package],
      ["showcase", "The design series", CarFront],
      ["alerts", "Notifications", Bell],
    ],
  },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <span />
        <span />
        <span />
      </span>
      <span>
        champions<span className="brand-light">club</span>
        <small>PERFORMANCE & RECOGNITION</small>
      </span>
    </div>
  );
}

function Navigation({ close }) {
  const { user } = useAuth();
  return (
    <nav aria-label="Main navigation">
      {navigation.map((group) => (
        <div className="nav-group" key={group.group}>
          <span className="nav-label">{group.group}</span>
          {group.items
            .filter((item) => !item[3] || item[3] === user.role)
            .map(([path, title, Icon]) => (
              <NavLink key={path} to={`/${path}`} onClick={close}>
                <Icon size={18} />
                <span>{title}</span>
                <ChevronRight className="nav-chevron" size={14} />
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  );
}

export function Shell({ children }) {
  const { user, logout } = useAuth();
  const { notice, setNotice, invalidate } = useApi();
  const dashboard = useResource(dashboardPath(user));
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const drawer = useRef(null);
  const menu = useRef(null);
  const main = useRef(null);
  const current =
    navigation
      .flatMap((group) => group.items)
      .find((item) => location.pathname.startsWith(`/${item[0]}`))?.[1] ||
    "Your account";
  useEffect(() => {
    document.title = `${current} · ChampionsClub`;
    main.current?.focus();
    window.scrollTo(0, 0);
  }, [location.pathname, current]);
  useEffect(() => {
    if (mobile) drawer.current?.showModal();
    else {
      drawer.current?.close();
    }
  }, [mobile]);
  function closeMenu() {
    setMobile(false);
    menu.current?.focus();
  }
  async function signOut() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
    } catch (error) {
      setLogoutError(error);
    } finally {
      setLoggingOut(false);
    }
  }
  const identity = (
    <Link to="/profile" className="identity">
      <span className="avatar">{initials(user)}</span>
      <span>
        <strong>{fullName(user)}</strong>
        <small>
          {user.role === "MANAGER"
            ? "Team manager"
            : `${label(user.advisorType)} advisor`}
        </small>
      </span>
      <ArrowUpRight size={15} />
    </Link>
  );
  return (
    <DashboardContext.Provider value={dashboard}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <Link
            to="/overview"
            className="brand-link"
            aria-label="ChampionsClub overview"
          >
            <Brand />
          </Link>
          <Navigation />
          <div className="sidebar-footer">
            <div className="workspace-label">
              <span className="workspace-dot" />
              {dashboard.data?.dealership?.name || "Your dealership"}
            </div>
            {identity}
            <button
              className="sign-out"
              onClick={signOut}
              disabled={loggingOut}
            >
              <LogOut size={16} />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </aside>
        <dialog className="mobile-drawer" ref={drawer} onCancel={closeMenu}>
          <div className="drawer-heading">
            <Brand />
            <button
              className="icon-button"
              onClick={closeMenu}
              aria-label="Close navigation"
            >
              <X />
            </button>
          </div>
          <Navigation close={closeMenu} />
          {identity}
          <button className="sign-out" onClick={signOut} disabled={loggingOut}>
            <LogOut size={16} />
            Sign out
          </button>
        </dialog>
        <div className="workspace">
          <header className="topbar">
            <div className="topbar-location">
              <button
                className="icon-button mobile-menu"
                ref={menu}
                aria-label="Open navigation"
                aria-expanded={mobile}
                onClick={() => setMobile(true)}
              >
                <Menu size={21} />
              </button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{current}</strong>
            </div>
            <div className="topbar-actions">
              <span className="role-label">
                {user.role === "MANAGER"
                  ? "Manager workspace"
                  : `${label(user.advisorType)} advisor`}
              </span>
              <button
                className="icon-button"
                title="Refresh workspace data"
                aria-label="Refresh workspace data"
                onClick={invalidate}
              >
                <RefreshCw size={16} />
              </button>
              <Link
                to="/alerts"
                className="icon-button"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <Link
                to="/profile"
                className="avatar small-avatar"
                aria-label="Your profile"
              >
                {initials(user)}
              </Link>
            </div>
          </header>
          <main
            id="main-content"
            ref={main}
            tabIndex={-1}
            className="main-content"
          >
            <ErrorMessage error={logoutError} />
            {children}
            <footer className="page-footer">
              <span>ChampionsClub</span>
              <span>
                <CircleHelp size={13} />
                Performance made meaningful
              </span>
            </footer>
          </main>
        </div>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            className="icon-button"
            aria-label="Dismiss confirmation"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </DashboardContext.Provider>
  );
}
