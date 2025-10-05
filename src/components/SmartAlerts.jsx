import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, MessageCircle, Send, AlertTriangle, Clock } from 'lucide-react';

const SmartAlerts = ({ location }) => {
  const [alerts, setAlerts] = useState([]);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [quickMessage, setQuickMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const quickMessages = [
    "I need help immediately!",
    "Emergency! Send assistance.",
    "I'm in danger, call emergency services.",
    "Medical emergency, need ambulance.",
    "Fire emergency, need fire department.",
    "Car accident, need help urgently."
  ];

  useEffect(() => {
    // Simulate incoming emergency alerts safely
    const alertTypes = [
      { 
        type: 'weather', 
        message: 'Severe weather alert in your area - take precautions', 
        priority: 'medium',
        icon: '🌧️'
      },
      { 
        type: 'traffic', 
        message: 'Major accident reported nearby - avoid area if possible', 
        priority: 'high',
        icon: '🚗'
      },
      { 
        type: 'safety', 
        message: 'Emergency services dispatched to your area', 
        priority: 'high',
        icon: '🚨'
      },
      { 
        type: 'system', 
        message: 'Emergency network activated - all systems operational', 
        priority: 'medium',
        icon: '🛡️'
      },
      { 
        type: 'medical', 
        message: 'Medical emergency response team is active in your region', 
        priority: 'high',
        icon: '🚑'
      }
    ];

    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of alert
        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const newAlert = {
          id: Date.now() + Math.random(),
          ...randomAlert,
          timestamp: new Date(),
          read: false
        };
        
        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep only 10 latest alerts
        
        // Play sound if enabled
        if (isSoundOn) {
          playEmergencySound();
        }
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [isSoundOn]);

  const playEmergencySound = () => {
    try {
      // Safe audio context creation
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Lower volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        
        // Close audio context after use
        setTimeout(() => {
          audioContext.close();
        }, 300);
      }
    } catch (error) {
      console.log('Audio not supported or blocked:', error);
    }
  };

  const markAsRead = (id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const sendQuickAlert = async (message) => {
    if (isSending) return;
    
    setIsSending(true);
    
    try {
      if (location) {
        const fullMessage = `${message} My location: https://maps.google.com/?q=${location.lat},${location.lng}`;
        const smsUrl = `sms:?body=${encodeURIComponent(fullMessage)}`;
        
        // Try to open SMS
        window.location.href = smsUrl;
        
        // Add to alerts as sent
        const sentAlert = {
          id: Date.now(),
          type: 'sent',
          message: `Message sent: ${message}`,
          priority: 'info',
          icon: '📤',
          timestamp: new Date(),
          read: true
        };
        
        setAlerts(prev => [sentAlert, ...prev.slice(0, 9)]);
      } else {
        // Fallback if no location
        const fallbackAlert = {
          id: Date.now(),
          type: 'warning',
          message: 'Location unavailable. Please enable location services.',
          priority: 'medium',
          icon: '📍',
          timestamp: new Date(),
          read: false
        };
        
        setAlerts(prev => [fallbackAlert, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      
      const errorAlert = {
        id: Date.now(),
        type: 'error',
        message: 'Failed to send message. Please try again.',
        priority: 'high',
        icon: '❌',
        timestamp: new Date(),
        read: false
      };
      
      setAlerts(prev => [errorAlert, ...prev.slice(0, 9)]);
    } finally {
      setIsSending(false);
    }
  };

  const sendCustomMessage = () => {
    if (quickMessage.trim() && !isSending) {
      sendQuickAlert(quickMessage);
      setQuickMessage('');
    }
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'info': return '🔵';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="smart-alerts-widget">
      <div className="widget-header">
        <div className="header-content">
          <Bell className="header-icon" />
          <div className="header-text">
            <h3>Smart Alert System</h3>
            <p>Emergency notifications and quick messaging</p>
          </div>
        </div>
        <div className="alert-actions">
          <button 
            className={`sound-toggle ${isSoundOn ? 'on' : 'off'}`}
            onClick={() => setIsSoundOn(!isSoundOn)}
            title={isSoundOn ? 'Mute sounds' : 'Enable sounds'}
          >
            {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {alerts.length > 0 && (
            <button 
              className="clear-alerts-btn"
              onClick={clearAllAlerts}
              title="Clear all alerts"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="widget-content">
        {/* Quick Message Buttons */}
        <div className="quick-messages-section">
          <div className="section-title">
            <MessageCircle size={18} />
            <h4>Quick Emergency Messages</h4>
          </div>
          <p className="section-description">
            Send pre-written emergency messages with your location
          </p>
          <div className="quick-messages-grid">
            {quickMessages.map((message, index) => (
              <button
                key={index}
                className="quick-message-btn"
                onClick={() => sendQuickAlert(message)}
                disabled={isSending}
              >
                <Send size={14} />
                <span>{message}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message Input */}
        <div className="custom-message-section">
          <div className="section-title">
            <Send size={18} />
            <h4>Custom Emergency Message</h4>
          </div>
          <div className="message-input-container">
            <input
              type="text"
              placeholder="Type your custom emergency message..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
              disabled={isSending}
              maxLength={200}
            />
            <button 
              className="send-custom-btn"
              onClick={sendCustomMessage}
              disabled={!quickMessage.trim() || isSending}
            >
              {isSending ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <div className="char-count">
            {quickMessage.length}/200
          </div>
        </div>

        {/* Live Alerts Feed */}
        <div className="alerts-feed-section">
          <div className="section-header">
            <div className="section-title">
              <AlertTriangle size={18} />
              <h4>Live Alert Feed</h4>
            </div>
            <div className="alerts-count">
              {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
            </div>
          </div>
          
          <div className="alerts-container">
            {alerts.length === 0 ? (
              <div className="no-alerts-state">
                <div className="no-alerts-icon">📡</div>
                <h5>No Active Alerts</h5>
                <p>Monitoring your area for emergency notifications...</p>
                <div className="monitoring-indicator">
                  <div className="pulse-dot"></div>
                  System Active
                </div>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`alert-item ${alert.priority} ${alert.read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="alert-icon">
                      {alert.icon}
                    </div>
                    <div className="alert-content">
                      <div className="alert-message">{alert.message}</div>
                      <div className="alert-meta">
                        <span className="alert-time">
                          <Clock size={12} />
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                        <span className="alert-priority">
                          {getPriorityIcon(alert.priority)} {alert.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {!alert.read && (
                      <div className="unread-indicator">
                        <div className="unread-dot"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emergency Sound Test */}
        <div className="sound-test-section">
          <button 
            className="sound-test-btn"
            onClick={playEmergencySound}
            disabled={!isSoundOn}
          >
            <Volume2 size={16} />
            Test Emergency Sound
          </button>
          <p className="sound-test-note">
            {isSoundOn 
              ? 'Emergency sounds are enabled' 
              : 'Emergency sounds are muted'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartAlerts;