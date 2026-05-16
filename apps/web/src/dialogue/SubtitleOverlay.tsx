interface SubtitleOverlayProps {
  speaker?: string;
  text?: string;
}

// §11.4, §6 (Diegetic over chrome): the subtitle band sits low on the
// screen like a kindly stage prompter. Empty `text` hides the band.
export function SubtitleOverlay({ speaker, text }: SubtitleOverlayProps) {
  if (!text) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '4.5rem',
        transform: 'translateX(-50%)',
        maxWidth: 'min(72ch, 90vw)',
        padding: '0.5rem 1rem',
        background: 'rgba(20, 14, 10, 0.7)',
        color: '#f6e7c3',
        fontFamily: 'serif',
        fontSize: '1.05rem',
        lineHeight: 1.4,
        letterSpacing: '0.01em',
        textAlign: 'center',
        borderRadius: '2px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }}
      aria-live="polite"
    >
      {speaker ? (
        <span style={{ opacity: 0.7, marginRight: '0.5rem', fontStyle: 'italic' }}>{speaker}:</span>
      ) : null}
      {text}
    </div>
  );
}
