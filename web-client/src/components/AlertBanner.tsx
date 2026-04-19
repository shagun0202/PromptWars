/**
 * @fileoverview Alert Banner — dynamic status notifications displayed at the top of the viewport.
 * Uses ARIA role="alert" and aria-live="polite" for screen reader accessibility.
 */

import { AlertTriangle } from 'lucide-react';

interface Props {
    message: string;
}

export default function AlertBanner({ message }: Props) {
    return (
        <div 
            style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                borderBottom: '1px solid var(--danger)',
                padding: '0.75rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
            }}
            role="alert"
            aria-live="polite"
        >
            <AlertTriangle size={18} color="var(--danger)" />
            <span>{message}</span>
        </div>
    );
}
