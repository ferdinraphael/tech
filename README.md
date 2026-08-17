# Ferdin Raphael — Technical Identity

A standalone technical identity site for Ferdin Raphael. This first vertical slice turns projects, services, simulations, profile context, and future technical writing into a responsive interactive constellation rather than a conventional portfolio grid.

Deployment is **not enabled**. The project is prepared for a future GitHub Pages site at `/tech/`, but this repository contains no deployment workflow and does not modify Pages settings.

## Current scope

- Complete responsive Overview route
- Typed, data-driven interactive constellation
- Neutral, featured, selected, and cleared interaction states
- Desktop contextual panel and in-flow mobile contextual details
- Verified Little Worlds project content
- Intentional empty state for technical notes
- Two approved service/engagement cards
- Lightweight Profile, Projects, Services, and Notes routes
- Accessibility behavior, component tests, browser smoke tests, and build-only CI

## Technology

- React 19 and TypeScript
- Vite
- React Router with `BrowserRouter`
- SVG relationship layers plus semantic HTML node controls
- CSS Modules and a small global token layer
- Local IBM Plex Mono and Inter font packages
- Lucide React icons
- Vitest, React Testing Library, and Playwright Chromium
- npm

The constellation deliberately does not use canvas, WebGL, Three.js, a graph layout engine, or a particle dependency.

## Local setup

Requirements:

- Node.js 24
- npm

```bash
npm ci
npm run dev
```

The development server serves the application with the `/tech/` base path. Follow the URL printed by Vite.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run typecheck` | Check the TypeScript project |
| `npm run lint` | Run Oxlint over application, tests, and configuration |
| `npm run test` | Run unit and component tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run build` | Type-check and create the production `/tech/` build |
| `npm run preview` | Serve the production output locally |
| `npm run test:e2e` | Run Playwright Chromium smoke tests against a production preview |

## Routes

| Source route | Future public path | Scope |
| --- | --- | --- |
| `/` | `/tech/` | Complete overview and constellation |
| `/profile` | `/tech/profile` | Concise profile and core areas |
| `/projects` | `/tech/projects` | Little Worlds only |
| `/services` | `/tech/services` | Approved pilot and engagements |
| `/notes` | `/tech/notes` | Intentional empty state and writing foundation |

Unknown paths render an intentional in-app 404.

## Base path and clean routing

`vite.config.ts` sets `base: '/tech/'`. `BrowserRouter` derives its basename from `import.meta.env.BASE_URL`, keeping local, test, and future Pages paths aligned.

The production build copies `dist/index.html` to `dist/404.html`. When GitHub Pages is enabled in a later task, clean URLs such as `/tech/projects` can fall back to the SPA entry point and React Router can render the correct route. No hash routing is used.

This fallback prepares build output only; it does not deploy, enable Pages, or change repository settings.

## Constellation architecture

The visual is a curated composition, not a physics simulation.

- `src/data/site.ts` is the shared source of truth.
- Nodes are positioned semantic buttons layered over an SVG relationship field.
- SVG draws orbits, connectors, and relationship emphasis.
- CSS provides the restrained star field, glow, and state transitions.
- Desktop and mobile use independent percentage coordinate maps.
- Selection is held by the Overview route and passed down to the constellation and contextual views.

### Node model

`ConstellationNode` captures the fields each node needs without forcing unrelated data onto every type:

- identity and label
- node kind and accent
- icon and content
- optional status, tags, route, and actions
- desktop and mobile positions
- featured, interactive, and compact flags

The current graph includes the central technical identity, Profile, Projects, Simulations, Services, Notes, Little Worlds, Website in 2 Days, More Ways to Work Together, Experiments, and Technical Thinking.

### Relationship model

Relationships are separate typed `{ from, to }` records. Rendering and selected-state emphasis both use this model. Little Worlds has two direct category relationships: Projects and Simulations.

### Featured versus selected

- **Neutral:** initial state; no node has `aria-pressed="true"` and all relationships remain restrained.
- **Featured:** Little Worlds supplies the wide-desktop panel without becoming selected. A subtle indicator may appear, but the graph remains neutral.
- **Selected:** direct paths and connected nodes become prominent, unrelated content quiets, and contextual content switches.
- **Cleared:** Escape, the inline clear action, or the central identity control restores neutral state and the wide-desktop featured panel.

### Coordinate maps

Every node has both `desktopPosition` and `mobilePosition`. CSS swaps the active coordinate set at the mobile breakpoint. This makes the mobile map a deliberately composed layout rather than a scaled desktop diagram.

## Extending the content

### Add a node

1. Add a unique `NodeId`.
2. Add a typed node record with approved content and both coordinate maps.
3. Add one or more relationship records.
4. Confirm the accessible label and keyboard interaction.
5. Review every viewport in the matrix below and update data tests.

### Add a project

Add verified project content to the shared data model, including only approved public links and claims. Connect the project to all relevant category nodes. Supporting cards and route content should consume that shared record rather than duplicate its description.

### Add a service

Add a shared service record and an appropriate constellation node if it belongs in the map. Do not add a public action until a verified URL or approved contact path exists.

### Add technical notes later

The Notes route and empty state are intentionally ready for future writing. Introduce a typed note model only after real titles, summaries, dates, and destinations are approved. An MDX or Markdown publishing system is outside this vertical slice.

## Accessibility

- Semantic page landmarks, headings, links, and buttons
- Skip link and visible focus treatment
- `aria-current` from React Router navigation
- Semantic constellation buttons with state and relationship summaries
- Live selection announcement
- Keyboard selection and Escape-to-clear
- Accessible mobile menu with Escape closure
- Mobile contextual details remain in normal document flow without modal or focus-trap semantics
- Motion-aware scrolling brings inline context into view without stealing focus
- Minimum 44-pixel interactive controls where practical
- Persistent mobile navigation respects safe-area insets
- Status text accompanies color indicators
- `prefers-reduced-motion` removes transitions and animations

## Testing

Vitest and React Testing Library cover:

- node and relationship integrity
- Little Worlds’ multiple relationships
- approved content and absence of fabricated projects/satellites
- neutral versus featured state
- selection, Escape clearing, and contextual switching
- Projects and Little Worlds panels
- Website in 2 Days Coming Soon behavior
- approved enquiry action
- mobile inline context rendering, updating, relationship persistence, and clearing
- reduced-motion inline-context scrolling
- notes empty state
- foundation and invalid routes

Playwright covers:

- overview loading
- Projects and Little Worlds selection
- mobile inline-context behavior and persistent selected relationships
- route navigation and browser back
- production serving under `/tech/`
- horizontal-overflow checks
- navigation visibility
- mobile bottom-navigation clearance

## Viewport matrix

Primary visual review:

- 1536 × 864
- 412 × 767

Responsive smoke checks:

- 360 × 800
- 375 × 667
- 430 × 932
- 768 × 1024
- 1366 × 768
- 1920 × 1080

Generated review screenshots belong in the untracked `visual-review/` directory.

## Build-only continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to non-main branches. It uses read-only repository contents permission and validates:

1. `npm ci`
2. type-checking
3. linting
4. unit/component tests
5. production build

It does not upload a Pages artifact, request deployment permissions, publish a release, or deploy.

## Known content gaps

- No technical notes are approved yet.
- Website in 2 Days has no public URL and remains Coming soon.
- Profile copy is intentionally concise and provisional.
- Little Worlds is the only approved public project in this slice.

## Known implementation limitations

- The constellation uses curated coordinates; new content requires deliberate placement at both layout sizes.
- Tablet context moves below the visual instead of keeping a compressed three-column arrangement.
- GitHub Pages clean-route fallback is prepared but cannot be proven on the real Pages host until deployment is explicitly enabled in a later task.

## Human review items

- Refine provisional Profile language if desired.
- Review final node spacing on the most common physical devices.
- Confirm when Website in 2 Days is ready for a public URL or revised launch copy.
- Approve real technical note content before adding any article records.
