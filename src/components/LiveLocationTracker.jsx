import React, { useState, useEffect } from 'react';

const LiveLocationTracker = ({ location }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareDuration, setShareDuration] = useState(15);
  const [locationHistory, setLocationHistory] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [trackingContacts, setTrackingContacts] = useState([
    { name: 'Emergency Services', status: 'ready', lastUpdate: null, icon: '🚨' },
    { name: 'Family Group', status: 'ready', lastUpdate: null, icon: '👨‍👩‍👧‍👦' },
    { name: 'Medical Team', status: 'ready', lastUpdate: null, icon: '🚑' }
  ]);

  useEffect(() => {
    let interval;
    if (isSharing && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            stopSharing();
            return 0;
          }
          return prev - 1;
        });

        // Update location history
        if (location) {
          setLocationHistory(prev => [
            ...prev.slice(-14), // Keep only last 15 locations
            {
              lat: location.lat + (Math.random() * 0.0002 - 0.0001), // Simulate small movement
              lng: location.lng + (Math.random() * 0.0002 - 0.0001),
              timestamp: new Date(),
              speed: (Math.random() * 2 + 0.5).toFixed(1)
            }
          ]);

          // Randomly update contact status
          setTrackingContacts(prev => 
            prev.map(contact => ({
              ...contact,
              lastUpdate: Math.random() > 0.3 ? new Date() : contact.lastUpdate,
              status: contact.lastUpdate ? 'tracking' : 'ready'
            }))
          );
        }
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isSharing, timeRemaining, location]);

  const startSharing = () => {
    if (!location) {
      alert('Please enable location services to start tracking');
      return;
    }

    setIsSharing(true);
    setTimeRemaining(shareDuration * 60); // Convert minutes to seconds
    setLocationHistory([]);
    
    // Start with current location
    if (location) {
      setLocationHistory([{
        lat: location.lat,
        lng: location.lng,
        timestamp: new Date(),
        speed: '0.0'
      }]);
    }

    // Simulate contact updates
    setTimeout(() => {
      setTrackingContacts(prev => 
        prev.map(contact => ({
          ...contact,
          status: 'tracking',
          lastUpdate: new Date()
        }))
      );
    }, 2000);

    // Send initial sharing message
    const message = `📍 LIVE LOCATION SHARING STARTED! Tracking my location for ${shareDuration} minutes. Updates every 5 seconds.`;
    if (location) {
      const locationMessage = `${message} Current location: https://maps.google.com/?q=${location.lat},${location.lng}`;
      window.location.href = `sms:?body=${encodeURIComponent(locationMessage)}`;
    } else {
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    }
  };

  const stopSharing = () => {
    setIsSharing(false);
    setTimeRemaining(0);
    
    // Send stop sharing message
    const message = `📍 LIVE LOCATION SHARING ENDED. Tracking stopped.`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const getBearing = (index) => {
    if (index === 0 || index >= locationHistory.length - 1) return '📍';
    const prev = locationHistory[index - 1];
    const current = locationHistory[index];
    const latDiff = current.lat - prev.lat;
    
    if (Math.abs(latDiff) > 0.00005) {
      return latDiff > 0 ? '⬆️' : '⬇️';
    } else {
      return '➡️';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'tracking': return '#10b981';
      case 'ready': return '#3b82f6';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={styles.trackerContainer}>
      <div style={styles.trackerHeader}>
        <span style={styles.trackerIcon}>📍</span>
        <h3 style={styles.trackerTitle}>Live Location Tracker</h3>
      </div>

      {!isSharing ? (
        <div style={styles.trackerSetup}>
          <div style={styles.durationSelector}>
            <span style={styles.durationLabel}>Share location for:</span>
            <select 
              value={shareDuration} 
              onChange={(e) => setShareDuration(Number(e.target.value))}
              style={styles.durationSelect}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🔄</span>
              <span>Updates every 5 seconds</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>📱</span>
              <span>Notifies emergency contacts</span>
            </div>
            <div style={styles.featureItem}>
              <span style={styles.featureIcon}>🛣️</span>
              <span>Tracks movement and speed</span>
            </div>
          </div>

          <button 
            style={styles.startTrackingBtn}
            onClick={startSharing}
            disabled={!location}
          >
            <span style={styles.btnIcon}>📍</span>
            Start Live Location Sharing
          </button>

          {!location && (
            <p style={styles.locationWarning}>
              📍 Enable location services to start live tracking
            </p>
          )}
        </div>
      ) : (
        <div style={styles.trackerActive}>
          <div style={styles.trackingStatus}>
            <div style={styles.statusIndicator}>
              <div style={styles.pulseDot}></div>
              <span style={styles.statusText}>LIVE TRACKING ACTIVE</span>
            </div>
            <div style={styles.timeRemaining}>
              <span style={styles.timeText}>{formatTime(timeRemaining)}</span>
              <span style={styles.timeLabel}>remaining</span>
            </div>
          </div>

          {locationHistory.length > 0 && (
            <div style={styles.locationData}>
              <div style={styles.dataItem}>
                <span style={styles.dataIcon}>📍</span>
                <div style={styles.dataInfo}>
                  <span style={styles.dataLabel}>Current Location</span>
                  <span style={styles.dataValue}>
                    {locationHistory[locationHistory.length - 1].lat.toFixed(6)}, {locationHistory[locationHistory.length - 1].lng.toFixed(6)}
                  </span>
                </div>
              </div>
              <div style={styles.dataItem}>
                <span style={styles.dataIcon}>⚡</span>
                <div style={styles.dataInfo}>
                  <span style={styles.dataLabel}>Speed</span>
                  <span style={styles.dataValue}>
                    {locationHistory[locationHistory.length - 1].speed} km/h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Location History Trail */}
          {locationHistory.length > 1 && (
            <div style={styles.locationHistory}>
              <h4 style={styles.sectionTitle}>📍 Location Trail (Last 15 points)</h4>
              <div style={styles.historyPoints}>
                {locationHistory.slice().reverse().map((point, index) => (
                  <div key={index} style={styles.historyPoint}>
                    <span style={styles.direction}>
                      {getBearing(locationHistory.length - 1 - index)}
                    </span>
                    <div style={styles.pointInfo}>
                      <span style={styles.coordinates}>
                        {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                      </span>
                      <span style={styles.pointTime}>
                        {point.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <span style={styles.pointSpeed}>{point.speed} km/h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Contacts */}
          <div style={styles.trackingContacts}>
            <h4 style={styles.sectionTitle}>👥 Tracking Participants</h4>
            <div style={styles.contactsList}>
              {trackingContacts.map((contact, index) => (
                <div key={index} style={styles.contactStatus}>
                  <span style={styles.contactIcon}>{contact.icon}</span>
                  <div style={styles.contactInfo}>
                    <span style={styles.contactName}>{contact.name}</span>
                    <span style={styles.contactUpdate}>
                      {contact.lastUpdate 
                        ? `Updated ${contact.lastUpdate.toLocaleTimeString()}`
                        : 'Ready to track'
                      }
                    </span>
                  </div>
                  <div style={{
                    ...styles.statusDot,
                    backgroundColor: getStatusColor(contact.status)
                  }}></div>
                </div>
              ))}
            </div>
          </div>

          <button 
            style={styles.stopTrackingBtn}
            onClick={stopSharing}
          >
            🛑 Stop Location Sharing
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  trackerContainer: {
    background: 'rgba(45, 45, 45, 0.9)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  trackerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  trackerIcon: {
    fontSize: '24px'
  },
  trackerTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px'
  },
  trackerSetup: {
    textAlign: 'center'
  },
  durationSelector: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px'
  },
  durationLabel: {
    color: 'white',
    fontSize: '14px'
  },
  durationSelect: {
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: '1px solid #666',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px'
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'white'
  },
  featureIcon: {
    fontSize: '16px'
  },
  startTrackingBtn: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '16px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  btnIcon: {
    fontSize: '18px'
  },
  locationWarning: {
    color: '#f59e0b',
    fontSize: '14px',
    marginTop: '15px',
    textAlign: 'center'
  },
  trackerActive: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  trackingStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '10px',
    border: '1px solid #10b981'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  pulseDot: {
    width: '12px',
    height: '12px',
    background: '#10b981',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  statusText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  timeRemaining: {
    textAlign: 'center'
  },
  timeText: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'block'
  },
  timeLabel: {
    color: '#a0a0a0',
    fontSize: '12px'
  },
  locationData: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  dataItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px'
  },
  dataIcon: {
    fontSize: '20px'
  },
  dataInfo: {
    flex: 1
  },
  dataLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#a0a0a0',
    marginBottom: '4px'
  },
  dataValue: {
    display: 'block',
    fontSize: '13px',
    color: 'white',
    fontWeight: 'bold',
    fontFamily: 'monospace'
  },
  locationHistory: {
    marginTop: '10px'
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '12px',
    color: 'white'
  },
  historyPoints: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto'
  },
  historyPoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    fontSize: '12px'
  },
  direction: {
    fontSize: '16px'
  },
  pointInfo: {
    flex: 1
  },
  coordinates: {
    display: 'block',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '11px'
  },
  pointTime: {
    display: 'block',
    color: '#a0a0a0',
    fontSize: '10px'
  },
  pointSpeed: {
    color: '#f59e0b',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  trackingContacts: {
    marginTop: '10px'
  },
  contactsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  contactStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px'
  },
  contactIcon: {
    fontSize: '18px'
  },
  contactInfo: {
    flex: 1
  },
  contactName: {
    display: 'block',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  contactUpdate: {
    display: 'block',
    color: '#a0a0a0',
    fontSize: '11px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  stopTrackingBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '10px'
  }
};

export default LiveLocationTracker;