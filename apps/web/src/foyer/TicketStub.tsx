interface TicketStubProps {
  mark_count?: number;
}

// §8.4, §4.3: the ticket stub. Diegetic, lives in the guest's pocket.
// Marks accumulate as consequences trigger (§21.5). The factory
// acknowledges respawn / consequence count via the stub's appearance.
export function TicketStub({ mark_count = 0 }: TicketStubProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        width: '140px',
        height: '52px',
        background: 'linear-gradient(135deg, #f6e7c3 0%, #d8b97c 100%)',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        fontSize: '0.75rem',
        color: '#3a2a1c',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-label={`Your ticket stub${mark_count ? `, ${mark_count} marks` : ''}`}
    >
      <span>ADMIT ONE</span>
      {mark_count > 0 && (
        <span
          style={{
            marginTop: '2px',
            fontSize: '0.65rem',
            letterSpacing: '0.06em',
            opacity: 0.75,
          }}
        >
          {'• '.repeat(Math.min(mark_count, 5)).trim()}
        </span>
      )}
    </div>
  );
}
