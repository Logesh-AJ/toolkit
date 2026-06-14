export default function HomePage({ theme, toggleTheme }) {
  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>
        ToolForge is loading...
      </h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Phase 1 complete. Run <code>continue</code> to build the full UI.
      </p>
      <button
        onClick={toggleTheme}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'var(--brand-primary)',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        Toggle theme (current: {theme})
      </button>
    </div>
  )
}