import { useState, useEffect } from 'react';
import { BellRing, ShieldAlert, Info } from 'lucide-react';

interface BroadcastEvent {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: string;
}

export default function LiveNotificationFeed() {
    const [events, setEvents] = useState<BroadcastEvent[]>([]);

    useEffect(() => {
        // Simulate real-time Coordination Hub WebSocket feed pushing dynamic changes
        setEvents([
            { id: '1', type: 'info', message: 'Halftime show is delayed by 5 minutes. Concessions remain open.', timestamp: 'Just now' }
        ]);

        const timer = setTimeout(() => {
            setEvents(prev => [
                { id: '2', type: 'critical', message: 'GATE 3 IS CLOSED due to congestion. Please reroute to Gate 4 or 5 for exiting.', timestamp: 'Live' },
                ...prev
            ]);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const getIcon = (type: string) => {
        if (type === 'critical') return <ShieldAlert size={16} color="var(--danger)" />;
        if (type === 'warning') return <BellRing size={16} color="#f59e0b" />;
        return <Info size={16} color="var(--primary)" />;
    };

    return (
        <div style={{ position: 'relative' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                <BellRing size={18} /> PA Broadcast Feed
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} role="log" aria-live="polite">
                {events.map(ev => (
                    <div key={ev.id} className="animate-in" style={{
                        background: ev.type === 'critical' ? 'rgba(239,68,68,0.1)' : 'var(--surface-color)',
                        borderLeft: `4px solid ${ev.type === 'critical' ? 'var(--danger)' : 'var(--primary)'}`,
                        padding: '1rem',
                        borderRadius: '0 8px 8px 0',
                        display: 'flex',
                        gap: '1rem',
                        boxShadow: ev.type === 'critical' ? '0 0 15px rgba(239,68,68,0.2)' : 'none'
                    }}>
                        <div style={{ marginTop: '0.2rem' }}>{getIcon(ev.type)}</div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{ev.timestamp}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>{ev.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
