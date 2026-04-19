/**
 * @fileoverview Mesh Chat Module — peer-to-peer communication fallback.
 * When the network goes offline, this component simulates BLE Mesh Relay
 * messaging, allowing fans to coordinate locally without cellular connectivity.
 */

import { useState } from 'react';
import { Send, Users, Bluetooth, AlertTriangle } from 'lucide-react';

interface Props {
    isOffline: boolean;
}

interface Message {
    id: number;
    text: string;
    sender: 'me' | 'friend';
    status: 'sent' | 'bouncing' | 'delivered';
}

export default function MeshChatModule({ isOffline }: Props) {
    const [msgText, setMsgText] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Are you still near Gate 3?", sender: 'friend', status: 'delivered' }
    ]);

    const sendMessage = () => {
        if (!msgText.trim()) return;
        
        const newMsg: Message = {
            id: Date.now(),
            text: msgText,
            sender: 'me',
            status: isOffline ? 'bouncing' : 'delivered'
        };
        
        setMessages(prev => [...prev, newMsg]);
        setMsgText('');

        if (isOffline) {
            // Simulate BLE mesh delivery delay
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
            }, 3000);
        }
    };

    return (
        <article className="glass-panel" style={{ 
            display: 'flex', flexDirection: 'column', height: '100%', 
            minHeight: isOffline ? '400px' : 'auto',
            border: isOffline ? '1px solid #f59e0b' : '1px solid var(--surface-border)'
        }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="var(--primary)" />
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>Friend Group</h3>
                </div>
                {isOffline && (
                    <div className="live-badge" style={{ position: 'static', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: '#f59e0b', padding: '0.2rem 0.5rem' }}>
                        <Bluetooth size={12} /> BLE MESH ACTIVE
                    </div>
                )}
            </div>

            {/* Offline Helper Text */}
            {isOffline && (
                <div style={{ background: 'rgba(245,158,11,0.05)', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <AlertTriangle size={14} /> Network disconnected. Messages are bouncing locally via surrounding devices. Expect slight delivery delays.
                </div>
            )}

            {/* Message Area */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                        <div style={{ 
                            background: msg.sender === 'me' ? (isOffline ? 'rgba(245,158,11,0.2)' : 'var(--primary)') : 'rgba(255,255,255,0.1)',
                            color: msg.sender === 'me' && !isOffline ? 'var(--bg-color)' : 'var(--text-main)',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px'
                        }}>
                            {msg.text}
                        </div>
                        {msg.sender === 'me' && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                                {msg.status === 'bouncing' ? 'Bouncing via Mesh...' : 'Delivered'}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '0.5rem' }}>
                <input 
                    type="text" 
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isOffline ? "Send via local mesh..." : "Type a message..."} 
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px' }}
                />
                <button 
                    onClick={sendMessage}
                    className="btn-primary" 
                    style={{ padding: '0.5rem 1rem', minWidth: 'auto', background: isOffline ? '#f59e0b' : '', borderColor: isOffline ? '#f59e0b' : '' }}
                >
                    <Send size={18} />
                </button>
            </div>
        </article>
    );
}
