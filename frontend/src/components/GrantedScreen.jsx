export default function GrantedScreen() {
  return (
    <div className="granted-screen">
      <div className="granted-particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="particle" style={{ "--i": i }} />
        ))}
      </div>
      <div className="granted-content">
        <div className="granted-glyph">기리고</div>
        <div className="granted-icon">🕯️</div>
        <h1 className="granted-title">Your wish is granted.</h1>
        <p className="granted-body">The spirits have heard you.<br />What you asked for has been set in motion.</p>
        <div className="granted-divider" />
        <p className="granted-footer">Whether it brings what you hoped for — only time will tell.</p>
      </div>
    </div>
  );
}