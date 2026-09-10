# Frontend Product Structure

The frontend is no longer a single dashboard. It is a role-aware product shell with page-level navigation.

Key areas:

- `product` contains navigation, formatting, demo data and data loading.
- `components/shell` contains the sidebar, topbar role switcher and product shell primitives.
- `components/ui` contains reusable display components used across current pages.
- `components/charts` contains simple chart components with no business rules.
- `pages` contains page-level experiences grouped by role or shared use.

Presentation fallback:

- The app attempts live backend calls.
- If services are unavailable, realistic demo data remains active.
- No global API failure banner is shown in normal presentation mode.
- AI and ML availability appear only inside the related insight or forecast pages.

