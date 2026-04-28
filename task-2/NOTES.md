# Task 2 — NOTES.md

## GLB File Size

| File | Size |
|------|------|
| `model.glb` (original) | 44.2 KB |
| `model-compressed.glb` (Draco) | 4.6 KB |
| **Reduction** | **~89%** |

The model was created programmatically (torus + box geometry) and compressed using:
```bash
npx gltf-pipeline -i model.glb -o model-compressed.glb --draco.compressMeshes
```

---

## What Lazy Loading Three.js Prevents (and Why It Matters)

Three.js is a ~600KB JavaScript bundle. Loading it synchronously (via a top-level `import`) means:

1. **The browser cannot render anything** until the full Three.js bundle has been downloaded, parsed, and executed — this blocks the main thread.
2. The initial "Time to Interactive" (TTI) and "First Contentful Paint" (FCP) metrics are severely degraded, especially on slow connections.

Using `const THREE = await import('three')` (dynamic import) means:
- The page shell and loading UI render **immediately** — the user sees something right away.
- Three.js is fetched in the background as a **non-blocking code split chunk**.
- If the user never reaches the 3D viewer (e.g. they close early), Three.js is **never downloaded** — saving bytes on the wire.

In React, the equivalent is `React.lazy` + `<Suspense>`, which we use in `App.jsx`:

```jsx
const ModelViewer = lazy(() => import('./components/ModelViewer'));
// → The entire ModelViewer chunk (which imports Three.js) is deferred
```

---

## What Would Break if You Skipped `dispose()` in a Long-Running Session

Three.js objects allocate **GPU resources** (geometry buffers, textures, shader programs) that exist **outside the JavaScript garbage collector**. The JS heap may be freed, but the WebGL context holds references the GC cannot see.

Without calling `dispose()`:

| Resource | Effect |
|----------|--------|
| **Geometries** (`BufferGeometry.dispose()`) | Vertex/index buffers stay in GPU VRAM. Load 50 models without disposing and you'll exhaust GPU memory (crash or severe slowdown). |
| **Textures** (`Texture.dispose()`) | Texture units are a limited hardware resource (~16–32 slots). Leaked textures fill them up; new textures fail to bind. |
| **Materials** (`Material.dispose()`) | Compiled shader programs accumulate in the WebGL context. Many browsers cap compiled programs; new ones fail silently. |
| **Renderer** (`WebGLRenderer.dispose()`) | The WebGL context itself stays alive. Browsers allow only a small number of simultaneous contexts (~8–16). Leaking them causes new `<canvas>` contexts to fail with "Too many active WebGL contexts". |
| **DRACOLoader** (`DRACOLoader.dispose()`) | The Draco Web Worker stays alive, consuming memory and CPU. |

In our cleanup (`useEffect` return function) we traverse the full scene graph and call:

```js
child.geometry?.dispose();
child.material?.dispose();
dracoLoader.dispose();
controls.dispose();
renderer.dispose();
```

This ensures a clean slate on every React unmount — critical for any SPA where the viewer component can be mounted/unmounted multiple times (e.g. a route that navigates away and back).
