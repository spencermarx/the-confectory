// §8.4, §4.3: the ticket stub. Diegetic, lives in the guest's pocket.
// Phase 1: a small corner element showing the blank stub. Marks land
// in week 11-13 with the consequence work.
export function TicketStub() {
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
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        fontSize: '0.75rem',
        color: '#3a2a1c',
        letterSpacing: '0.08em',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-label="Your ticket stub"
    >
      ADMIT ONE
    </div>
  );
}
