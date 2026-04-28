import { useEffect, useRef, useState } from 'react';

/**
 * ModelViewer — loads a Draco-compressed GLB using Three.js
 *
 * Key optimisations:
 * 1. Three.js is dynamically imported (lazy) so it does NOT block initial page render
 * 2. GLTFLoader + DRACOLoader configured with the official Draco decoder CDN
 * 3. Load time is logged to the console in milliseconds
 * 4. All Three.js objects are disposed on unmount to prevent memory leaks
 */
export default function ModelViewer() {
  const mountRef = useRef(null);
  const sceneRef = useRef({}); // holds all Three.js objects for cleanup
  const [loadState, setLoadState] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [loadMs, setLoadMs] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animFrameId;
    let mounted = true;

    async function init() {
      // ── Step 3: Lazy-load Three.js — does NOT block initial render ──────────
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      if (!mounted) return;

      const container = mountRef.current;
      const W = container.clientWidth;
      const H = container.clientHeight;

      // ── Renderer ────────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(W, H);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // ── Scene ───────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();

      // ── Camera ──────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
      camera.position.set(0, 0.5, 3.5);

      // ── Lights ──────────────────────────────────────────────────────────────
      const ambient = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0x4466ff, 3.5);
      key.position.set(3, 5, 4);
      key.castShadow = true;
      scene.add(key);

      const fill = new THREE.DirectionalLight(0x00e5b4, 1.5);
      fill.position.set(-4, 2, -2);
      scene.add(fill);

      const rim = new THREE.DirectionalLight(0xffffff, 1.2);
      rim.position.set(0, -3, -4);
      scene.add(rim);

      // ── Point lights for glow effect ─────────────────────────────────────
      const pLight1 = new THREE.PointLight(0x3d4bff, 2, 8);
      pLight1.position.set(0, 1, 2);
      scene.add(pLight1);

      // ── Controls ────────────────────────────────────────────────────────────
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1.5;
      controls.maxDistance = 8;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.8;

      // ── Draco Loader ────────────────────────────────────────────────────────
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      dracoLoader.preload();

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      // ── Load model with timing ───────────────────────────────────────────────
      const start = performance.now();

      loader.load(
        '/model-compressed.glb',
        (gltf) => {
          if (!mounted) return;

          const elapsed = performance.now() - start;
          console.log(`Model loaded in ${elapsed.toFixed(2)}ms`);

          const model = gltf.scene;

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.0 / maxDim;

          model.scale.setScalar(scale);
          model.position.sub(center.multiplyScalar(scale));

          // Enable shadows + enhance materials
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.envMapIntensity = 1.5;
              }
            }
          });

          scene.add(model);
          sceneRef.current.model = model;

          setLoadMs(elapsed.toFixed(0));
          setLoadState('loaded');
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            setProgress(Math.round((xhr.loaded / xhr.total) * 100));
          }
        },
        (error) => {
          console.error('GLB load error:', error);
          if (mounted) setLoadState('error');
        }
      );

      // ── Ground plane ─────────────────────────────────────────────────────
      const groundGeo = new THREE.PlaneGeometry(20, 20);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x0a0b0f,
        roughness: 0.95,
        metalness: 0.1,
        transparent: true,
        opacity: 0.8,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.2;
      ground.receiveShadow = true;
      scene.add(ground);

      // ── Resize handler ───────────────────────────────────────────────────
      const onResize = () => {
        const W2 = container.clientWidth;
        const H2 = container.clientHeight;
        camera.aspect = W2 / H2;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
      };
      window.addEventListener('resize', onResize);

      // ── Render loop ──────────────────────────────────────────────────────
      const clock = new THREE.Clock();
      const animate = () => {
        animFrameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        // Animate point light
        pLight1.position.x = Math.sin(t * 0.7) * 2;
        pLight1.position.z = Math.cos(t * 0.5) * 2;

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // ── Store refs for cleanup ───────────────────────────────────────────
      sceneRef.current = {
        ...sceneRef.current,
        renderer,
        scene,
        camera,
        controls,
        dracoLoader,
        ground,
        groundGeo,
        groundMat,
        onResize,
        THREE,
      };
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(animFrameId);

      const s = sceneRef.current;
      window.removeEventListener('resize', s.onResize);

      // dispose() — prevents memory leaks in long-running sessions
      // Without this, GPU memory and JS heap grow unboundedly:
      // - Geometries stay in GPU VRAM
      // - Textures stay in GPU texture units
      // - The WebGL context accumulates orphaned resources
      if (s.model) {
        s.model.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
      s.groundGeo?.dispose();
      s.groundMat?.dispose();
      s.dracoLoader?.dispose();
      s.controls?.dispose();
      s.renderer?.dispose();

      // Remove canvas from DOM
      if (mountRef.current && s.renderer) {
        mountRef.current.removeChild(s.renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'var(--bg)', display: 'flex', position: 'relative' }}>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ flex: 1, height: '100%', position: 'relative' }} />

      {/* Loading overlay */}
      {loadState === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            zIndex: 10,
          }}
        >
          {/* Animated logo */}
          <div style={{ marginBottom: 32, position: 'relative' }}>
            <div className="loader-ring" style={{ width: 72, height: 72, borderWidth: 4 }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L25 9.5V20.5L14 27L3 20.5V9.5L14 3Z" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
                <circle cx="14" cy="14" r="4" fill="var(--accent)" opacity="0.8"/>
              </svg>
            </div>
          </div>

          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Loading 3D Model
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-dim)', marginBottom: 24 }}>
            Draco-compressed GLB · {progress}%
          </p>

          {/* Progress bar */}
          <div style={{ width: 240, height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent2), var(--accent))',
              borderRadius: 99,
              transition: 'width 0.2s ease',
            }} />
          </div>
        </div>
      )}

      {/* UI overlay — shown once loaded */}
      {loadState !== 'loading' && (
        <>
          {/* Top header */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(6,7,9,0.9) 0%, transparent 100%)',
            zIndex: 5,
          }}>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>
                Task 2 — 3D Viewer
              </p>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                Vima3ya · Model Viewer
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge">Three.js r169</span>
              <span className="badge" style={{ color: 'var(--accent2)', background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' }}>Draco</span>
            </div>
          </div>

          {/* Side stats panel */}
          <div style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 5,
          }}>
            <div className="panel" style={{ padding: 20, minWidth: 160 }}>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 16 }}>
                Performance
              </p>

              <div className="stat-row" style={{ marginBottom: 16 }}>
                <span className="stat-label">Load Time</span>
                <span className="stat-value">{loadMs}ms</span>
              </div>

              <div className="stat-row" style={{ marginBottom: 16 }}>
                <span className="stat-label">Original</span>
                <span className="stat-value" style={{ fontSize: 15 }}>44.2 KB</span>
              </div>

              <div className="stat-row" style={{ marginBottom: 20 }}>
                <span className="stat-label">Compressed</span>
                <span className="stat-value" style={{ fontSize: 15, color: 'var(--accent)' }}>4.6 KB</span>
              </div>

              <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

              <div className="stat-row">
                <span className="stat-label">Saved</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>89%</span>
              </div>
            </div>
          </div>

          {/* Bottom controls hint */}
          <div style={{
            position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 5,
          }}>
            <div className="panel" style={{ padding: '10px 20px', display: 'flex', gap: 20 }}>
              {[
                { icon: '🖱️', text: 'Drag to rotate' },
                { icon: '⚲', text: 'Scroll to zoom' },
                { icon: '⇥', text: 'Right-drag to pan' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-dim)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {loadState === 'error' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)',
        }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, color: '#ff4d6d' }}>
            Failed to load model
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
            Check console for details
          </p>
        </div>
      )}
    </div>
  );
}
