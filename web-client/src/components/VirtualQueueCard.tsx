import { useState } from 'react';
import { Clock, Users, CheckCircle2 } from 'lucide-react';

interface Props {
    targetId: string;
    title: string;
}

export default function VirtualQueueCard({ targetId, title }: Props) {
    const [loading, setLoading] = useState(false);
    const [waitData, setWaitData] = useState<{ ms: number } | null>(null);

    const handleJoinQueue = async () => {
        setLoading(true);
        // Simulate API Gateway latency over HTTP
        setTimeout(() => {
            // Mocking the Use Case result
            const calculatedWait = Math.floor(Math.random() * 15) * 60000 + 120000; // Random ms representation
            setWaitData({ ms: calculatedWait });
            setLoading(false);
        }, 600);
    };

    const isJoined = waitData !== null;

    return (
        <article className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
            
            {!isJoined ? (
                <>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Join the virtual line to avoid physical crowding. We'll notify your device when it's your turn.
                    </p>
                    <button 
                        className="btn-primary" 
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        onClick={handleJoinQueue}
                        disabled={loading}
                        aria-busy={loading}
                    >
                        {loading ? 'Processing...' : <><Users size={18} /> Join Virtual Queue</>}
                    </button>
                </>
            ) : (
                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                        <CheckCircle2 size={20} />
                        <strong>Reserved Successfully</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        <Clock size={16} /> 
                        Estimated Wait: <span style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>{Math.round(waitData.ms / 60000)} mins</span>
                    </div>
                </div>
            )}
        </article>
    );
}
