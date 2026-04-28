/**
 * ShimmerLoader — shown for 3 seconds after form is complete
 * Simulates an API call response skeleton
 */
export default function ShimmerLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '36px',
          width: '440px',
          maxWidth: '90vw',
        }}
      >
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div className="shimmer-line" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
          <div className="flex flex-col gap-2 flex-1">
            <div className="shimmer-line" style={{ width: '60%', height: 14 }} />
            <div className="shimmer-line" style={{ width: '40%', height: 11 }} />
          </div>
        </div>

        {/* Content rows */}
        {[90, 75, 85, 60, 70].map((w, i) => (
          <div key={i} className="shimmer-line mb-3" style={{ width: `${w}%`, height: 13 }} />
        ))}

        {/* Tags skeleton */}
        <div className="flex gap-2 mt-4 mb-6">
          {[80, 100, 65].map((w, i) => (
            <div key={i} className="shimmer-line" style={{ width: w, height: 28, borderRadius: 20 }} />
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex gap-3">
          <div className="shimmer-line flex-1" style={{ height: 44, borderRadius: 12 }} />
          <div className="shimmer-line" style={{ width: 120, height: 44, borderRadius: 12 }} />
        </div>

        {/* Indicator text */}
        <p
          className="text-center mt-5"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          Processing your submission…
        </p>
      </div>
    </div>
  );
}
