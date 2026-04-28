const SECTIONS = [
  { id: 'section-a', label: 'Personal Info', letter: 'A' },
  { id: 'section-b', label: 'Contact Details', letter: 'B' },
  { id: 'section-c', label: 'Professional', letter: 'C' },
  { id: 'section-d', label: 'Preferences', letter: 'D' },
];

/**
 * SidebarNav — Fixed left sidebar with cumulative scroll highlighting.
 * activeSections: array of section indices that have been scrolled into view (cumulative).
 */
export default function SidebarNav({ activeSections }) {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside
      className="flex flex-col"
      style={{
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: '2rem',
        height: 'fit-content',
      }}
    >
      {/* Brand */}
      <div className="mb-8">
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Vima3ya
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}
        >
          Registration
        </div>
      </div>

      {/* Progress indicator */}
      <div
        className="mb-8 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="progress-ring" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
            {activeSections.length}
          </span>
        </div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Progress
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--text-primary)' }}>
            {activeSections.length} / 4 sections
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col">
        {SECTIONS.map((section, i) => {
          const isActive = activeSections.includes(i);
          const isLast = i === SECTIONS.length - 1;

          return (
            <div key={section.id} className="flex">
              {/* Bullet + line column */}
              <div className="flex flex-col items-center mr-4" style={{ paddingTop: 2 }}>
                <div className={`nav-bullet${isActive ? ' active' : ''}`} />
                {!isLast && (
                  <div className={`nav-line${isActive ? ' active' : ''}`} style={{ marginTop: 4 }} />
                )}
              </div>

              {/* Label */}
              <button
                onClick={() => handleScrollTo(section.id)}
                className="flex flex-col pb-10 text-left"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  paddingBottom: isLast ? 0 : 36,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'color 0.3s',
                  }}
                >
                  Section {section.letter}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.3s',
                    marginTop: 2,
                  }}
                >
                  {section.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom info card */}
      <div
        className="mt-6 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Tip
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Fill all fields to trigger automatic form completion with live API simulation.
        </p>
      </div>
    </aside>
  );
}
