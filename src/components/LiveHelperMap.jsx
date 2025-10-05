import React, { useState, useEffect } from 'react';
import { MapPin, Users, Navigation, MessageCircle, Shield } from 'lucide-react';
import realTimeService from '../services/realTimeService';

const LiveHelperMap = ({ location }) => {
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (location) {
      updateMapData();
      
      const handleRealTimeUpdate = (update) => {
        if (update.type === 'HELPER_UPDATE' || update.type === 'NEW_HELP_REQUEST') {
          updateMapData();
        }
      };

      realTimeService.subscribe('live_helper_map', handleRealTimeUpdate);
      
      const interval = setInterval(updateMapData, 10000);
      
      return () => {
        realTimeService.unsubscribe('live_helper_map');
        clearInterval(interval);
      };
    }
  }, [location]);

  const updateMapData = () => {
    if (!location) return;
    
    const helpers = realTimeService.findNearbyHelpers(location, 5);
    const requests = realTimeService.findNearbyRequests(location, 5);
    
    setNearbyHelpers(helpers);
    setActiveRequests(requests);
  };

  const startSecureChat = (helper) => {
    setSelectedHelper(helper);
    setShowChat(true);
  };

  const requestDiscreetMeetup = (helper) => {
    const publicPlaces = [
      "Nearby Cafe/Restaurant",
      "Shopping Mall Entrance", 
      "Park Public Area",
      "Gas Station",
      "Hospital Waiting Area"
    ];
    
    const randomPlace = publicPlaces[Math.floor(Math.random() * publicPlaces.length)];
    alert(`📍 Safe Meetup: ${randomPlace}\n\nPublic location for everyone's safety.`);
  };

  if (!location) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="live-helper-map">
      <div className="map-header">
        <div className="header-content">
          <MapPin size={24} />
          <div>
            <h2>Live HelperZ Map</h2>
            <p>Real-time community help network</p>
          </div>
        </div>
        <div className="map-stats">
          <span className="stat">
            <Users size={16} />
            {nearbyHelpers.length} HelperZ online
          </span>
        </div>
      </div>

      <div className="map-visualization-real">
        <div className="map-container-real">
          <div className="map-center-point">
            <div className="user-marker">
              <div className="pulse-ring"></div>
              <span>You</span>
            </div>
          </div>

          {nearbyHelpers.map((helper, index) => {
            const angle = (index / Math.max(nearbyHelpers.length, 1)) * 2 * Math.PI;
            const distance = Math.min(helper.distance * 20, 120);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            return (
              <div 
                key={helper.id}
                className="helper-marker-real"
                style={{ transform: `translate(${x}px, ${y}px)` }}
                onClick={() => setSelectedHelper(helper)}
              >
                <div className="marker-avatar">
                  <Users size={14} />
                </div>
                <div className="marker-tooltip">
                  <strong>{helper.name || 'HelperZ'}</strong>
                  <span>{helper.distance.toFixed(1)} km away</span>
                  <div className="marker-actions">
                    <button onClick={() => startSecureChat(helper)}>Chat</button>
                    <button onClick={() => requestDiscreetMeetup(helper)}>Meet</button>
                  </div>
                </div>
              </div>
            );
          })}

          {activeRequests.map((request, index) => (
            <div 
              key={request.id}
              className="request-marker-real"
              style={{ transform: `translate(${Math.cos(index * 0.8) * 80}px, ${Math.sin(index * 0.8) * 80}px)` }}
            >
              <div className="request-pulse"></div>
              <div className="marker-tooltip">
                <strong>🆘 Help Needed</strong>
                <span>{request.distance.toFixed(1)} km away</span>
              </div>
            </div>
          ))}
        </div>

        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker user"></div>
            <span>Your Location</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker helper"></div>
            <span>Available HelperZ</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker request"></div>
            <span>Help Requests</span>
          </div>
        </div>
      </div>

      <div className="nearby-helpers-section">
        <h3>Nearby HelperZ ({nearbyHelpers.length})</h3>
        <div className="helpers-list-real">
          {nearbyHelpers.length > 0 ? (
            nearbyHelpers.map(helper => (
              <div key={helper.id} className="helper-card">
                <div className="helper-avatar">
                  <Users size={20} />
                </div>
                <div className="helper-info">
                  <span className="helper-name">{helper.name || 'Community Helper'}</span>
                  <div className="helper-details">
                    <span>{helper.distance.toFixed(1)} km</span>
                    <span>⭐ {helper.rating || 'New'}</span>
                  </div>
                </div>
                <div className="helper-actions">
                  <button onClick={() => startSecureChat(helper)}>Chat</button>
                  <button onClick={() => requestDiscreetMeetup(helper)}>Meet</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-helpers">
              <Users size={32} />
              <p>No HelperZ online nearby</p>
            </div>
          )}
        </div>
      </div>

      {showChat && selectedHelper && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-header">
              <div className="chat-helper-info">
                <Users size={20} />
                <div>
                  <h4>Secure Chat</h4>
                  <p>With {selectedHelper.name || 'Helper'}</p>
                </div>
              </div>
              <button className="close-chat" onClick={() => setShowChat(false)}>×</button>
            </div>
            
            <div className="chat-messages">
              <div className="system-message">
                <Shield size={14} />
                <span>Secure chat started. Privacy protected.</span>
              </div>
            </div>
            
            <div className="chat-input">
              <input type="text" placeholder="Type message..." />
              <button>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveHelperMap;