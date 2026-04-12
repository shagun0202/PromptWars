import { useState } from 'react';
import { Sparkles, Ticket, CheckCircle2 } from 'lucide-react';

export default function ArrivalForecastCard() {
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);

    const handleClaim = () => {
        setLoading(true);
        // Simulate API verification to claim the fast-pass
        setTimeout(() => {
            setLoading(false);
            setClaimed(true);
        }, 800);
    };

    return (
        <article className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
            {/* The Surge Predictor Visualizer */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                <Sparkles size={120} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                <Sparkles size={18} />
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Entry Predictor</h3>
            </div>
            
            {!claimed ? (
                <>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Gate A is heavily congested. Vertex AI models suggest staggering your entry to minimize wait time.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ flex: 1, padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: '0.25rem' }}>NOW</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>25m</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Wait</div>
                        </div>
                        <div style={{ flex: 1, padding: '1rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--primary)', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>IN 15 MINS</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>5m</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security Wait</div>
                        </div>
                    </div>

                    <button 
                        className="btn-primary" 
                        onClick={handleClaim}
                        disabled={loading}
                        aria-busy={loading}
                        style={{ width: '100%', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {loading ? 'Verifying Timeslot...' : <><Ticket size={16} /> Delay Entry & Claim Fast-Pass</>}
                    </button>
                </>
            ) : (
                <div className="animate-in" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                        <CheckCircle2 size={24} />
                        <strong>Fast-Pass Claimed!</strong>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Thank you for helping reduce the surge. Your new entry window is bound to your digital ticket.
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed #10b981', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>Valid For</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>VIP Gate B</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Entry anytime after 6:15 PM</div>
                    </div>
                </div>
            )}
        </article>
    );
}
