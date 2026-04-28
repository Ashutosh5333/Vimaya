# Vima3ya Frontend Assignment

**Candidate:** [Your Name]  
**Role:** Software Engineer – Product & Performance (React.js)  
**Stack:** React + Vite + Tailwind CSS

---

## Repository Structure

```
vima3ya-frontend-assignment/
├── task-1/          # Multi-Section Form with Scroll Navigation
├── task-2/          # 3D Model Viewer with Three.js
└── README.md
```

---

## Task 1 — Reusable Form System with Scroll Navigation

### What it does
- Two-column layout: fixed sidebar (Section A–D nav bullets) + scrollable form area
- Reusable `<FormField />` component built on Formik + Yup
- Cumulative scroll-sync sidebar bullet highlighting (A → A,B → A,B,C → A,B,C,D)
- Validation only shows **after Submit** is clicked, then lives-updates as user corrects
- Auto-triggers `onFormComplete()` when all fields are valid → 3-second shimmer/skeleton loader
- `onFormComplete()` re-triggers on every subsequent change while valid

### Run

```bash
cd task-1
npm install
npm run dev
```

App runs at **http://localhost:5173**

### Key files
| File | Purpose |
|------|---------|
| `src/components/FormField.jsx` | Reusable field with Formik `useField`, validator support, error display |
| `src/components/SidebarNav.jsx` | Scroll-synced cumulative bullet nav |
| `src/components/ShimmerLoader.jsx` | Skeleton overlay simulating API call |
| `src/App.jsx` | Layout, Formik setup, IntersectionObserver scroll tracking, `onFormComplete` logic |

---

## Task 2 — 3D Model Viewer with Three.js (Optimised Loading)

### What it does
- Loads a Draco-compressed `.glb` model (torus + box scene, built programmatically)
- `GLTFLoader` + `DRACOLoader` configured with official Draco 1.5.6 decoder CDN
- Loading progress bar + spinner while model loads
- Load time logged to browser console: `Model loaded in Xms`
- Three.js loaded via **dynamic `import()`** (does not block initial page render)
- Full `dispose()` cleanup on unmount (memory safe for long-running sessions)
- Auto-rotate + orbit controls (drag, scroll, right-drag)

### GLB Stats
| File | Size |
|------|------|
| `model.glb` (original) | 44.2 KB |
| `model-compressed.glb` (Draco) | 4.6 KB |
| Reduction | **~89%** |

### Run

```bash
cd task-2
npm install
npm run dev
```

App runs at **http://localhost:5173** (or 5174 if task-1 is also running)

### Key files
| File | Purpose |
|------|---------|
| `src/App.jsx` | React.lazy + Suspense wrapping ModelViewer |
| `src/components/ModelViewer.jsx` | Three.js scene, GLTFLoader, DRACOLoader, dispose cleanup |
| `public/model-compressed.glb` | Draco-compressed GLB model |
| `public/model.glb` | Original uncompressed GLB (for size comparison) |
| `NOTES.md` | Detailed notes on compression ratios, lazy loading, and dispose() |
| `create-model.cjs` | Script used to generate the GLB programmatically |

---

## Tech Choices

- **Vite** — fast HMR, native ESM, optimal for React
- **Tailwind CSS v4** — utility-first, co-located with Vite plugin (no PostCSS config needed)
- **Formik + Yup** — battle-tested form state + schema validation
- **Three.js** (direct, not R3F) — as specified; dynamic import for lazy loading
- **IntersectionObserver** — scroll tracking without scroll event listeners (performant)
