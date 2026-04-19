/**
 * @fileoverview Main application layout — NexusFlow Venue Dashboard.
 *
 * Orchestrates the glassmorphic dashboard with:
 *   - Google Maps Embed (StadiumMap)
 *   - Virtual queue enrollment cards
 *   - Emergency SOS dispatch modal
 *   - Offline mesh networking mode
 *   - Real-time coordination feed
 */

import { useState } from 'react';
import { Activity, BadgeInfo, AlertTriangle, ShieldAlert, Plus } from 'lucide-react';
import StadiumMap from './components/StadiumMap';
import VirtualQueueCard from './components/VirtualQueueCard';
import AlertBanner from './components/AlertBanner';
import NetworkSyncPill from './components/NetworkSyncPill';
import ArrivalForecastCard from './components/ArrivalForecastCard';
import LiveNotificationFeed from './components/LiveNotificationFeed';
import EmergencySOSModal from './components/EmergencySOSModal';
import MeshChatModule from './components/MeshChatModule';

function App() {
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  return (
    <>
      {isOffline ? (
          <AlertBanner message="CRITICAL: Cellular Network Failure Detected. App is operating in Offline Local-Mesh Mode." />
      ) : (
          <AlertBanner message="The Concession Paradox active: Restroom B has lower wait times. AI suggests redirection." />
      )}
      
      <EmergencySOSModal isOpen={sosOpen} onClose={() => setSosOpen(false)} />
      
      <header className="top-nav">
        <div className="brand" style={{ color: isOffline ? '#f59e0b' : 'transparent' }}>
          <Activity color={isOffline ? "#f59e0b" : "var(--primary)"} />
          NexusFlow Hub
        </div>
        
        <nav aria-label="Main Navigation" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NetworkSyncPill isOffline={isOffline} onToggleMock={() => setIsOffline(!isOffline)} />
          <button 
            className="btn-primary" 
            onClick={() => setSosOpen(true)}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
             <Plus size={16} /> SOS / Safety
          </button>
        </nav>
      </header>

      <main className="dashboard-grid">
        {/* Left Column: Live Map & Wayfinding */}
        <section className="glass-panel map-container animate-in" aria-label="Interactive Stadium Map" style={{ border: isOffline ? '1px solid rgba(245,158,11,0.3)' : ''}}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
                {!isOffline ? (
                    <button 
                        onClick={() => setAccessibleMode(!accessibleMode)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
                            borderRadius: '8px', cursor: 'pointer', border: '1px solid',
                            background: accessibleMode ? 'var(--primary)' : 'rgba(0,0,0,0.5)',
                            color: accessibleMode ? 'var(--bg-color)' : 'var(--text-main)',
                            borderColor: accessibleMode ? 'var(--primary)' : 'var(--surface-border)',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        <BadgeInfo size={18} />
                        {accessibleMode ? 'Elevator/Ramp Route ACTIVE' : 'Toggle Accessible Route'}
                    </button>
                ) : (
                    <div style={{ background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #f59e0b', color: '#f59e0b', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <AlertTriangle size={16}/> CACHED MAP: Dynamic Heatmaps Disabled
                    </div>
                )}
            </div>
            <StadiumMap />
        </section>

        {/* Right Column: Coordination, Feed, & Interaction Cards */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 className="sr-only">Platform Feed</h2>
            
            <div style={{ animationDelay: '0.1s' }} className="animate-in">
                <MeshChatModule isOffline={isOffline} />
            </div>

            {!isOffline ? (
                <>
                    <div className="animate-in glass-panel" style={{ animationDelay: '0.2s', padding: '1.5rem' }}>
                        <LiveNotificationFeed />
                    </div>
                    
                    <div style={{ animationDelay: '0.3s' }} className="animate-in">
                      <ArrivalForecastCard />
                    </div>

                    <div style={{ animationDelay: '0.4s' }} className="animate-in">
                      <VirtualQueueCard targetId="CONCESSION_A" title="Burger Stand A (15m Wait)" />
                    </div>
                    
                    <div style={{ animationDelay: '0.5s' }} className="animate-in">
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                         <ShieldAlert size={14} color="var(--secondary)" /> Suggested Alternative
                      </div>
                      <VirtualQueueCard targetId="RESTROOM_2" title="Restrooms (Section 204)" />
                    </div>
                </>
            ) : (
                <div className="animate-in glass-panel" style={{ padding: '1.5rem', textAlign: 'center', opacity: 0.7 }}>
                    <p>Heavy API modules (Wait Times, Predictors, Feeds) are suspended to preserve local mesh bandwidth.</p>
                </div>
            )}
        </aside>
      </main>
    </>
  );
}

export default App;
