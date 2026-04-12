import { Map } from 'lucide-react';

export default function StadiumMap() {
    return (
        <div className="map-placeholder">
            <div className="live-badge">REAL-TIME TELEMETRY</div>
            
            <Map size={64} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--primary)', fontSize: '1.5rem', marginBottom: '0.5rem', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>Google Maps SDK Hook</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', textAlign: 'center', fontSize: '0.9rem' }}>
                This region is reserved for the Maps rendering engine. Real-time A* pathfinding routes from the Python API will overlay seamlessly utilizing the dynamically updated heatmap thresholds.
            </p>

            {/* Simulated Path Overlay Graphic */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path 
                    d="M 100 500 Q 200 300 400 400 T 700 100" 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="4"
                    strokeDasharray="10 10"
                    className="path-animate"
                />
            </svg>
            <style>{`
                .path-animate {
                    stroke-dashoffset: 1000;
                    animation: dash 20s linear infinite;
                    filter: drop-shadow(0 0 8px var(--primary-glow));
                }
                @keyframes dash {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    );
}
