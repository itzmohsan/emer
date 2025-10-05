import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EmergencyDB } from '../utils/database.js';
import { syncManager } from '../utils/syncManager.js';

const EmergencySOS = ({ location, offlineMode = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [settings, setSettings] = useState({
    autoSend: true,
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  const countdownRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    loadAppData();
    setupAudioContext();
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      cleanupAudioContext();
    };
  }, []);

  const loadAppData = async () => {
    try {
      const [contacts, savedSettings, savedLocation] = await Promise.all([
        EmergencyDB.getContacts(),
        EmergencyDB.getSetting('sos_settings'),
        EmergencyDB.getSetting('last_known_location')
      ]);

      if (contacts.length > 0) {
        setEmergencyContacts(contacts);
      } else {
        // Default emergency contacts
        const defaultContacts = [
          { name: 'Emergency Services', number: '911', priority: 1 },
          { name: 'Local Police', number: '911', priority: 2 }
        ];
        setEmergencyContacts(defaultContacts);
        await Promise.all(defaultContacts.map(contact => EmergencyDB.saveContact(contact)));
      }

      if (savedSettings) setSettings(savedSettings);
      if (savedLocation) setLastKnownLocation(savedLocation);
    } catch (error) {
      console.error('Failed to load app data:', error);
    }
  };

  const setupAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  };

  const cleanupAudioContext = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const initiateSOS = useCallback(() => {
    if (offlineMode) {
      triggerOfflineEmergency();
      return;
    }

    setIsActive(true);
    setCountdown(5);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          triggerEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Visual and haptic feedback
    triggerCountdownEffects();
  }, [offlineMode, settings]);

  const cancelSOS = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsActive(false);
    setCountdown(5);
    stopCountdownEffects();
  }, []);

  const triggerEmergency = useCallback(async () => {
    const locationData = location || lastKnownLocation;
    
    try {
      const emergencyData = {
        type: 'SOS_EMERGENCY',
        timestamp: new Date().toISOString(),
        location: locationData,
        contacts: emergencyContacts,
        settings: settings
      };

      // Save to database
      await EmergencyDB.saveAlert(emergencyData);

      // Queue for sync
      await syncManager.queueSyncOperation('EMERGENCY_ALERT', emergencyData);

      // Send emergency messages
      if (settings.autoSend) {
        await sendEmergencyMessages(emergencyData);
      }

      // Trigger effects
      triggerEmergencyEffects();

      // Log successful trigger
      console.log('Emergency SOS triggered successfully');
    } catch (error) {
      console.error('Failed to trigger emergency:', error);
      // Fallback to basic SMS
      sendFallbackSMS(locationData);
    } finally {
      setIsActive(false);
      setCountdown(5);
    }
  }, [location, lastKnownLocation, emergencyContacts, settings]);

  const sendEmergencyMessages = async (emergencyData) => {
    const locationString = emergencyData.location 
      ? `https://maps.google.com/?q=${emergencyData.location.lat},${emergencyData.location.lng}`
      : 'Location unavailable';

    const message = `🚨 EMERGENCY SOS ALERT! I need immediate assistance! My location: ${locationString}`;

    for (const contact of emergencyContacts) {
      try {
        if (offlineMode) {
          // Queue for later sending
          await EmergencyDB.queueForSync({
            type: 'SMS_MESSAGE',
            data: { to: contact.number, message }
          });
        } else {
          // Send immediately
          window.location.href = `sms:${contact.number}?body=${encodeURIComponent(message)}`;
          // Add delay between messages to avoid blocking
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send to ${contact.name}:`, error);
      }
    }
  };

  const triggerOfflineEmergency = useCallback(async () => {
    const locationData = lastKnownLocation || location;
    
    const emergencyData = {
      type: 'OFFLINE_SOS_EMERGENCY',
      timestamp: new Date().toISOString(),
      location: locationData,
      contacts: emergencyContacts,
      status: 'PENDING_OFFLINE'
    };

    try {
      await EmergencyDB.saveAlert(emergencyData);
      await syncManager.queueSyncOperation('EMERGENCY_ALERT', emergencyData);
      
      triggerEmergencyEffects();
      
      // Show confirmation
      alert(`🚨 OFFLINE EMERGENCY ACTIVATED\n\nEmergency saved locally. Will auto-send when connection is restored.`);
    } catch (error) {
      console.error('Failed to save offline emergency:', error);
      alert('❌ Failed to save emergency. Please try again.');
    }
  }, [lastKnownLocation, location, emergencyContacts]);

  const triggerCountdownEffects = () => {
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    if (settings.soundEnabled) {
      playCountdownSound();
    }

    // Visual pulse effect
    document.body.style.transition = 'background-color 0.5s';
    document.body.style.backgroundColor = '#450a0a';
  };

  const stopCountdownEffects = () => {
    document.body.style.backgroundColor = '';
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  const triggerEmergencyEffects = () => {
    // Intense visual feedback
    document.body.style.backgroundColor = '#7f1d1d';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 2000);

    // Sound and vibration
    if (settings.soundEnabled) {
      playEmergencySound();
    }
    
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500]);
    }
  };

  const playCountdownSound = () => {
    if (!audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.3);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.3);
    } catch (error) {
      console.warn('Countdown sound failed:', error);
    }
  };

  const playEmergencySound = () => {
    if (!audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Emergency siren pattern
      const times = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
      const frequencies = [800, 600, 800, 600, 800, 600];
      
      times.forEach((time, index) => {
        oscillator.frequency.setValueAtTime(
          frequencies[index], 
          audioContextRef.current.currentTime + time
        );
      });
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.6);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.6);
    } catch (error) {
      console.warn('Emergency sound failed:', error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await EmergencyDB.saveSetting('sos_settings', newSettings);
  };

  return (
    <div style={styles.sosContainer}>
      <div style={styles.sosHeader}>
        <span style={styles.sosIcon}>🚨</span>
        <h2 style={styles.sosTitle}>Emergency SOS</h2>
        {offlineMode && <span style={styles.offlineBadge}>📵 OFFLINE</span>}
      </div>

      {offlineMode && (
        <div style={styles.offlineWarning}>
          <strong>Offline Mode Active</strong>
          <div style={styles.offlineStatus}>
            Emergencies will be saved locally and auto-sent when online
          </div>
        </div>
      )}

      <div style={styles.sosButtonContainer}>
        {!isActive ? (
          <button
            style={{
              ...styles.sosButton,
              ...(offlineMode && styles.offlineSosButton)
            }}
            onClick={initiateSOS}
            onTouchStart={initiateSOS}
            aria-label="Activate Emergency SOS"
          >
            <span style={styles.sosButtonText}>
              {offlineMode ? '🚨 OFFLINE SOS' : '🚨 EMERGENCY SOS'}
            </span>
            <span style={styles.sosButtonSubtext}>
              {offlineMode ? 'Press to activate' : 'Hold for 5 seconds'}
            </span>
          </button>
        ) : (
          <button
            style={styles.sosCountdown}
            onClick={cancelSOS}
            onTouchEnd={cancelSOS}
            aria-label={`Cancel emergency - ${countdown} seconds left`}
          >
            <span style={styles.countdownText}>{countdown}</span>
            <span style={styles.cancelText}>Tap to Cancel</span>
          </button>
        )}
      </div>

      <div style={styles.settingsPanel}>
        <h4 style={styles.settingsTitle}>Settings</h4>
        <div style={styles.settingsGrid}>
          <label style={styles.settingItem}>
            <input
              type="checkbox"
              checked={settings.autoSend}
              onChange={(e) => updateSetting('autoSend', e.target.checked)}
            />
            Auto-send alerts
          </label>
          <label style={styles.settingItem}>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
            />
            Emergency sounds
          </label>
          <label style={styles.settingItem}>
            <input
              type="checkbox"
              checked={settings.vibrationEnabled}
              onChange={(e) => updateSetting('vibrationEnabled', e.target.checked)}
            />
            Vibration
          </label>
        </div>
      </div>

      <div style={styles.emergencyInfo}>
        <h4 style={styles.infoTitle}>Emergency Contacts</h4>
        <div style={styles.contactsList}>
          {emergencyContacts.map((contact, index) => (
            <div key={index} style={styles.contactItem}>
              <span style={styles.contactName}>{contact.name}</span>
              <span style={styles.contactNumber}>{contact.number}</span>
            </div>
          ))}
        </div>
        
        <div style={styles.locationInfo}>
          <span style={styles.locationIcon}>📍</span>
          {location ? (
            <span>Live GPS Location Available</span>
          ) : lastKnownLocation ? (
            <span>Using Last Known Location</span>
          ) : (
            <span style={styles.noLocation}>No Location Available</span>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  sosContainer: {
    background: 'rgba(45, 45, 45, 0.95)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    border: '2px solid #333',
    textAlign: 'center'
  },
  sosHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative'
  },
  sosIcon: { fontSize: '28px' },
  sosTitle: { margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold' },
  offlineBadge: {
    position: 'absolute',
    right: 0,
    background: '#f59e0b',
    color: 'black',
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  offlineWarning: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #f59e0b',
    fontSize: '14px'
  },
  offlineStatus: { fontSize: '12px', marginTop: '8px', opacity: 0.9 },
  sosButtonContainer: { margin: '30px 0' },
  sosButton: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '50%',
    width: '180px',
    height: '180px',
    cursor: 'pointer',
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4)'
  },
  offlineSosButton: {
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)'
  },
  sosButtonText: { fontSize: '20px', fontWeight: 'bold' },
  sosButtonSubtext: { fontSize: '12px', opacity: 0.9 },
  sosCountdown: {
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    border: 'none',
    borderRadius: '50%',
    width: '180px',
    height: '180px',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    animation: 'pulse 1s infinite'
  },
  countdownText: { fontSize: '48px', fontWeight: 'bold' },
  cancelText: { fontSize: '12px', opacity: 0.9 },
  settingsPanel: {
    background: 'rgba(30, 30, 30, 0.8)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px'
  },
  settingsTitle: { color: 'white', margin: '0 0 12px 0', fontSize: '16px' },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px'
  },
  settingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer'
  },
  emergencyInfo: {
    background: 'rgba(30, 30, 30, 0.8)',
    borderRadius: '12px',
    padding: '16px'
  },
  infoTitle: { color: 'white', margin: '0 0 12px 0', fontSize: '16px' },
  contactsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px'
  },
  contactItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '6px'
  },
  contactName: { color: 'white', fontSize: '14px' },
  contactNumber: { color: '#ef4444', fontSize: '14px', fontWeight: 'bold' },
  locationInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    padding: '8px',
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '6px',
    fontSize: '14px'
  },
  locationIcon: { fontSize: '16px' },
  noLocation: { color: '#ef4444' }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
  }
`);

export default EmergencySOS;