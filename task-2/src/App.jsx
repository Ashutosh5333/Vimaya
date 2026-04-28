import { Suspense, lazy } from 'react';

// Lazy load the heavy 3D viewer — prevents Three.js from blocking initial render
const ModelViewer = lazy(() => import('./components/ModelViewer'));

function ViewerFallback() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height: '100vh', background: 'var(--bg)' }}>
      <div className="loader-ring mb-4" />
      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
        Initialising viewer…
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<ViewerFallback />}>
      <ModelViewer />
    </Suspense>
  );
}
