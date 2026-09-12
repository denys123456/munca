# ChampionsClub Interactive Publication

The reader treats the viewport as a camera over a large editorial sheet. The route changes after the sheet has turned. React Router retains meaningful chapter URLs, history and role permissions.

## Reading engine

- `components/publication/Publication.jsx` coordinates two mounted sheets, route preparation, input states and the final route commit.
- `camera.js` translates one canvas with `translate3d`. Wheel intent is bounded and smoothed in an on-demand animation frame loop. Scroll frames do not update React state.
- `chapterJourneys.js` defines separate spatial paths and scroll distances. Team Performance spans 11 waypoints over approximately 880vh of input at desktop sizes. Forecasts travels laterally across a single panoramic chart before visiting the model explanation and recommendations.
- `curl.js` clips the current sheet against a moving diagonal fold, reflects the underside and shades the curved paper. Scroll, corner dragging and direct navigation use this same geometry. The destination already exists underneath. Only the rigid book cover uses a hinge rotation.
- Pointer capture holds the corner during dragging. Release below the completion threshold returns the sheet. Escape also cancels. Wheel input remains effective over the corner itself.
- Direct bookmarks skim through lightweight intermediate sheets. Browser Back uses the history direction and restores the chapter camera position. Refresh and deep links open the requested permitted chapter.
- Reader controls and thin index tabs remain outside the moving canvas. Search, notifications and account selection remain available throughout exploration.

## Chapters and local work

`pages/editorial` contains Team Performance, Overview, Forecasts, Intelligence, Rewards, Leaderboard, working chapters and the closing sheet.

The camera reveals management workspaces as part of each working chapter. Forms, lists and tables then use ordinary local scrolling. Their wheel and touch input does not move the chapter. Account switching selects a separate fictional identity, changes permissions and opens the appropriate starting chapter.

Forecast charts measure their available canvas size so text and points remain undistorted. Click, Enter, Space or intentional mouse dwell opens a sharp magnifier in a portal with a single blurred backdrop. Camera movement pauses when a dialog opens. The magnifier shows contextual values from the selected data and identifies illustrative scenario ranges.

The fountain pen introduction draws SVG ink paths with the nib following the stroke. It runs once per browser session, holds the completed inscription for three seconds and then reveals the reader. Reduced motion opens the reader immediately. Closing the book returns to the cover.

## Data and permissions

Backend endpoints, authentication headers and business contracts remain in the existing API and product modules. The publication consumes those modules without changing the backend.

Without `VITE_API_BASE_URL`, the application uses the saved demonstration workspace. With an API URL configured, it requests the authenticated dashboard and retains service retry behavior. A backend outage leaves the demo workspace usable. Live sales and redemption keep their existing request contracts and permission checks.

## Verification

From `frontend`, start the reader:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Then run:

```bash
npm run build
npx playwright test
node scripts/audit-publication.mjs
node scripts/profile.mjs
```

The browser suite uses Microsoft Edge. It checks every role's routes at 320–1440px, long spatial travel, oversized wheel gestures, reversals, held scroll curls, pointer capture, cancellation, completion, browser history, touch scrolling, the pen introduction and chart focus. Functional coverage includes saved sales, targets, redemptions, rankings, alerts, account preferences and administration CRUD in demo mode.

The composition audit inspects 120 camera stops across phone, laptop and desktop viewports and saves representative screenshots in `artifacts/compositions`. The performance script measures frame timing, React commits, long tasks and blur usage while the camera and curl are moving. Reports are written to `artifacts/composition-audit.json` and `artifacts/reader-performance.json`.
