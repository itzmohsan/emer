import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, MapPin, Users, Clock, Navigation } from 'lucide-react';

function SimpleBachaooButton() {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [emergencyStatus, setEmergencyStatus] = useState('ready');
  const [location, setLocation] = useState(null);
  const [contactsNotified, setContactsNotified] = useState(0);
  const [helpersNotified, setHelpersNotified] = useState(0);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  }, []);

  const handleButtonClick = () => {
    if (emergencyStatus === 'ready') {
      setEmergencyStatus('counting');
      setIsActive(true);
      setCountdown(5);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            triggerEmergencyAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      cancelEmergency();
    }
  };

  const triggerEmergencyAlert = () => {
    setEmergencyStatus('activated');
    simulateNotifications();
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    setTimeout(() => {
      alert('🚨 EMERGENCY ALERT ACTIVATED! 🚨\n\n✅ Your location has been shared\n✅ Emergency contacts notified\n✅ Nearby HelperZ alerted\n✅ Authorities have been informed');
    }, 500);
    
    setTimeout(() => {
      resetEmergency();
    }, 10000);
  };

  const simulateNotifications = () => {
    let contactsCount = 0;
    const contactInterval = setInterval(() => {
      contactsCount += 1;
      setContactsNotified(contactsCount);
      if (contactsCount >= 3) clearInterval(contactInterval);
    }, 800);

    let helpersCount = 0;
    const helperInterval = setInterval(() => {
      helpersCount += Math.floor(Math.random() * 2) + 1;
      if (helpersCount > 12) helpersCount = 12;
      setHelpersNotified(helpersCount);
      if (helpersCount >= 12) clearInterval(helperInterval);
    }, 600);
  };

  const cancelEmergency = () => {
    setEmergencyStatus('ready');
    setIsActive(false);
    setCountdown(null);
    setContactsNotified(0);
    setHelpersNotified(0);
  };

  const resetEmergency = () => {
    setEmergencyStatus('ready');
    setIsActive(false);
    setCountdown(null);
    setContactsNotified(0);
    setHelpersNotified(0);
  };

  const getButtonConfig = () => {
    switch (emergencyStatus) {
      case 'counting':
        return {
          main: countdown,
          sub: 'CANCEL',
          emoji: '⏰',
          class: 'safety-button-warning',
          icon: Clock
        };
      case 'activated':
        return {
          main: 'SENT!',
          sub: 'ACTIVE',
          emoji: '✅',
          class: 'safety-button-emergency',
          icon: AlertTriangle
        };
      default:
        return {
          main: 'BACHAOO',
          sub: 'PRESS IN EMERGENCY',
          emoji: '🛡️',
          class: 'safety-button-ready',
          icon: Shield
        };
    }
  };

  const buttonConfig = getButtonConfig();
  const StatusIcon = buttonConfig.icon;

  return (
    <div className="emergency-interface" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '500px',
      gap: '2rem',
      padding: '1rem'
    }}>
      {/* Status Header */}
      <div className="glass status-indicator" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 2rem',
        borderRadius: '16px',
        color: emergencyStatus === 'ready' ? '#10b981' : 
               emergencyStatus === 'counting' ? '#f59e0b' : '#ef4444',
        fontSize: '1rem',
        fontWeight: '600'
      }}>
        <StatusIcon size={20} />
        <span>
          {emergencyStatus === 'ready' && 'SYSTEM READY • SAFE • MONITORING'}
          {emergencyStatus === 'counting' && `EMERGENCY COUNTDOWN • ${countdown}s • CANCEL AVAILABLE`}
          {emergencyStatus === 'activated' && 'EMERGENCY ACTIVATED • HELP IS COMING • STAY SAFE'}
        </span>
      </div>

      {/* Main Emergency Button */}
      <button
        onClick={handleButtonClick}
        className={buttonConfig.class}
        style={{
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          border: 'none',
          color: 'white',
          fontSize: '1.3rem',
          fontWeight: 'bold',
          cursor: emergencyStatus === 'activated' ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          opacity: emergencyStatus === 'activated' ? 0.9 : 1
        }}
        disabled={emergencyStatus === 'activated'}
      >
        <div style={{ fontSize: emergencyStatus === 'counting' ? '4rem' : '2.5rem', fontWeight: 'bold' }}>
          {buttonConfig.emoji}
        </div>
        <div style={{ fontSize: emergencyStatus === 'counting' ? '3.5rem' : '1.5rem', fontWeight: 'bold' }}>
          {buttonConfig.main}
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {buttonConfig.sub}
        </div>
      </button>

      {/* Emergency Stats */}
      {emergencyStatus === 'activated' && (
        <div className="emergency-stats" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div className="glass" style={{
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Users size={20} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {contactsNotified}/3
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Contacts Notified</div>
          </div>
          <div className="glass" style={{
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Shield size={20} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {helpersNotified}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>HelperZ Nearby</div>
          </div>
          <div className="glass" style={{
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
            gridColumn: 'span 2'
          }}>
            <MapPin size={20} style={{ color: '#ef4444', marginBottom: '0.5rem' }} />
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {location ? `${location.lat}, ${location.lng}` : 'Acquiring location...'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Live GPS Tracking Active</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass" style={{
        textAlign: 'center',
        color: '#94a3b8',
        maxWidth: '400px',
        lineHeight: '1.6',
        padding: '1.5rem',
        borderRadius: '12px'
      }}>
        {emergencyStatus === 'ready' && (
          <div>
            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              🛡️ You're Protected
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Press the button in emergency situations<br/>
              <strong>5-second safety countdown</strong> prevents accidental activation<br/>
              Alerts your contacts, nearby HelperZ, and authorities
            </div>
          </div>
        )}
        {emergencyStatus === 'counting' && (
          <div>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              ⚠️ Emergency Alert Pending
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Alert will activate in <strong>{countdown} seconds</strong><br/>
              Tap button to cancel • Release to send alert<br/>
              Emergency services are on standby
            </div>
          </div>
        )}
        {emergencyStatus === 'activated' && (
          <div>
            <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              🚨 Help Is On The Way!
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Your location is being shared in real-time<br/>
              Keep your phone accessible and visible<br/>
              System will automatically reset in a few moments
            </div>
          </div>
        )}
      </div>

      {/* System Status */}
      {emergencyStatus === 'ready' && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div className="glass" style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <Navigation size={16} style={{ color: location ? '#10b981' : '#f59e0b', marginBottom: '0.25rem' }} />
            <div style={{ color: location ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
              {location ? 'GPS LIVE' : 'GPS...'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Location</div>
          </div>
          <div className="glass" style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>ONLINE</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Network</div>
          </div>
          <div className="glass" style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            textAlign: 'center',
            minWidth: '100px'
          }}>
            <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>12</div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>HelperZ Ready</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleBachaooButton;