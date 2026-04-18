import { Map } from 'lucide-react';

export default function StadiumMap() {
    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="live-badge" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                Google Services: REAL-TIME TELEMETRY
            </div>
            
            {/* Native Google Maps Embed (No API Key Required!) */}
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13233.158229892305!2d-118.350361!3d33.9534346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2b786cbfb8f4f%3A0x5fb99cb7ec48cb09!2sSoFi%20Stadium!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" 
                width="100%" 
                height="100%" 
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(80%)' }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Service View"
            ></iframe>
        </div>
    );
}
