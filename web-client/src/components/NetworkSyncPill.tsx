import { Wifi, WifiOff } from 'lucide-react';

interface Props {
    isOffline: boolean;
    onToggleMock: () => void;
}

export default function NetworkSyncPill({ isOffline, onToggleMock }: Props) {
    return (
        <button 
            onClick={onToggleMock}
            style={{ 
                border: 'none',
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', 
                color: !isOffline ? '#10b981' : '#f59e0b', 
                background: !isOffline ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', 
                padding: '0.4rem 0.75rem', borderRadius: '999px',
                transition: 'all 0.3s'
            }}
            title="Click to Simulate Network Loss"
        >
            {!isOffline ? (
                <><Wifi size={14} /> LIVE SYNC: ON (Click to Kill Network)</>
            ) : (
                <><WifiOff size={14} /> MESH RELAY: ACTIVE (Click to Reconnect)</>
            )}
        </button>
    );
}
