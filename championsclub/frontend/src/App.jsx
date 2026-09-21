import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { ApiProvider } from "./api/ApiContext.jsx";
import { Login } from "./auth/Login.jsx";
import { Shell } from "./components/Shell.jsx";
import { ErrorBoundary, Loading } from "./components/ui.jsx";

const Overview = lazy(() => import("./features/Overview.jsx"));
const Performance = lazy(() => import("./features/Performance.jsx"));
const Sales = lazy(() => import("./features/Sales.jsx"));
const Targets = lazy(() => import("./features/Targets.jsx"));
const Rewards = lazy(() => import("./features/Rewards.jsx"));
const Points = lazy(() => import("./features/Points.jsx"));
const Advisors = lazy(() => import("./features/Advisors.jsx"));
const AdvisorDetail = lazy(() => import("./features/AdvisorDetail.jsx"));
const Leaderboard = lazy(() => import("./features/Leaderboard.jsx"));
const Intelligence = lazy(() => import("./features/Intelligence.jsx"));
const Alerts = lazy(() => import("./features/Alerts.jsx"));
const Profile = lazy(() => import("./features/Profile.jsx"));
const Products = lazy(() => import("./features/Products.jsx"));

function Application() {
  const { user, status } = useAuth();
  if (status !== "ready" || !user) return <Login />;
  return (
    <ApiProvider key={user.id}>
      <Shell>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/overview" element={<Overview />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/targets" element={<Targets />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route
                path="/insights"
                element={<Intelligence mode="insights" />}
              />
              <Route
                path="/forecasts"
                element={<Intelligence mode="forecasts" />}
              />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/products" element={<Products />} />
              {user.role === "ADVISOR" && (
                <>
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/points" element={<Points />} />
                </>
              )}
              {user.role === "MANAGER" && (
                <>
                  <Route path="/advisors" element={<Advisors />} />
                  <Route path="/advisors/:id" element={<AdvisorDetail />} />
                </>
              )}
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h2>This page is not available</h2>
                    <p>
                      The address may be outdated, or your role does not have
                      access.
                    </p>
                    <a className="button primary" href="#/overview">
                      Go to overview
                    </a>
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Shell>
    </ApiProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <Application />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
