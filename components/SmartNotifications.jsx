import React, { useState, useEffect } from 'react';
import { Bell, MapPin, Clock, Settings, Zap, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import smartNotificationsService from '../services/smartNotificationsService';
import './SmartNotifications.css';

const SmartNotifications = ({ location }) => {
  const [serviceStatus, setServiceStatus] = useState({});
  const [alertZones, setAlertZones] = useState([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [newZone, setNewZone] = useState({
    name: '',
    radius: 1000,
    type: 'safety'
  });

  // Initialize service
  useEffect(() => {
    initializeService();
  }, []);

  // Check location against alert zones
  useEffect(() => {
    if (location && serviceStatus.canSendNotifications) {
      checkLocationAlerts();
    }
  }, [location, serviceStatus]);

  const initializeService = async () => {
    setIsInitializing(true);
    try {
      const result = await smartNotificationsService.initialize();
      updateServiceStatus();
      
      if (!result.success) {
        console.warn('Smart notifications initialization warning:', result.reason);
      }
    } catch (error) {
      console.error('Smart notifications initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const updateServiceStatus = () => {
    setServiceStatus(smartNotificationsService.getStatus());
  };

  const checkLocationAlerts = async () => {
    try {
      const result = await smartNotificationsService.checkLocationInZones(
        location.lat, 
        location.lng
      );

      if (result.success && result.triggeredZones.length > 0) {
        handleTriggeredZones(result.triggeredZones);
      }
    } catch (error) {
      console.error('Location alert check error:', error);
    }
  };

  const handleTriggeredZones = (zones) => {
    zones.forEach(zone => {
      // Check if we already notified for this zone recently
      const recentAlert = activeAlerts.find(alert => 
        alert.zoneId === zone.id && 
        Date.now() - alert.timestamp < 300000 // 5 minutes
      );

      if (!recentAlert) {
        const alert = {
          id: `alert_${Date.now()}`,
          zoneId: zone.id,
          zoneName: zone.name,
          type: zone.type,
          distance: zone.distance,
          timestamp: Date.now(),
          message: `You entered ${zone.name} (${zone.distance}m away)`
        };

        setActiveAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10

        // Send browser notification
        smartNotificationsService.createNotification(
          `📍 ${zone.name} Alert`,
          {
            body: `You're ${zone.distance}m from ${zone.name}. Stay safe!`,
            icon: '/pwa-192x192.png',
            tag: `zone_${zone.id}`
          }
        );
      }
    });
  };

  const addAlertZone = () => {
    if (!location || !newZone.name.trim()) return;

    const result = smartNotificationsService.addAlertZone({
      ...newZone,
      lat: location.lat,
      lng: location.lng
    });

    if (result.success) {
      setNewZone({ name: '', radius: 1000, type: 'safety' });
      updateServiceStatus();
      
      // Show success notification
      smartNotificationsService.createNotification(
        '✅ Alert Zone Created',
        {
          body: `${newZone.name} is now being monitored`,
          icon: '/pwa-192x192.png'
        }
      );
    }
  };

  const scheduleTestAlert = () => {
    const inOneMinute = new Date(Date.now() + 60000);
    
    const result = smartNotificationsService.scheduleTimeAlert({
      time: inOneMinute.toISOString(),
      title: '🕐 Test Time Alert',
      message: 'This is a scheduled test notification from Bachaoo Emergency.'
    });

    if (result.success) {
      smartNotificationsService.createNotification(
        '⏰ Alert Scheduled',
        {
          body: 'Test notification scheduled for 1 minute from now.',
          icon: '/pwa-192x192.png'
        }
      );
    }
  };

  const requestPermission = async () => {
    try {
      await smartNotificationsService.initialize();
      updateServiceStatus();
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const clearAlert = (alertId) => {
    setActiveAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getStatusColor = () => {
    if (!serviceStatus.isSupported) return '#ef4444';
    if (!serviceStatus.canSendNotifications) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = () => {
    if (!serviceStatus.isSupported) return 'Not Supported';
    if (!serviceStatus.permission) return 'Permission Required';
    if (serviceStatus.permission === 'denied') return 'Blocked';
    if (serviceStatus.permission === 'granted') return 'Active';
    return 'Unknown';
  };

  return (
    <div className="smart-notifications-widget">
      <div className="widget-header">
        <div className="header-content">
          <Bell className="header-icon" />
          <div className="header-text">
            <h3>Smart Notifications</h3>
            <p>Location-based and time-sensitive alerts</p>
          </div>
        </div>
        <div 
          className="status-indicator" 
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusText()}
        </div>
      </div>

      <div className="widget-content">
        {/* Service Status */}
        <div className="status-section">
          <div className="status-cards">
            <div className="status-card">
              <div className="status-icon">
                <Zap size={20} />
              </div>
              <div className="status-info">
                <span className="status-label">Notifications</span>
                <span className="status-value">
                  {serviceStatus.canSendNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div className="status-card">
              <div className="status-icon">
                <MapPin size={20} />
              </div>
              <div className="status-info">
                <span className="status-label">Alert Zones</span>
                <span className="status-value">{serviceStatus.alertZonesCount || 0}</span>
              </div>
            </div>
          </div>

          {!serviceStatus.canSendNotifications && serviceStatus.isSupported && (
            <div className="permission-prompt">
              <AlertTriangle size={16} />
              <span>Enable notifications for location alerts</span>
              <button className="enable-btn" onClick={requestPermission}>
                Enable
              </button>
            </div>
          )}

          {!serviceStatus.isSupported && (
            <div className="unsupported-warning">
              <AlertTriangle size={16} />
              <span>Smart notifications not supported in this browser</span>
            </div>
          )}
        </div>

        {/* Create Alert Zone */}
        <div className="zone-creation-section">
          <h4>📍 Create Alert Zone</h4>
          <p>Get notified when you enter specific areas</p>
          
          <div className="zone-form">
            <input
              type="text"
              placeholder="Zone name (e.g., Home, Work, High-risk Area)"
              value={newZone.name}
              onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
              className="zone-input"
            />
            
            <div className="zone-settings">
              <select
                value={newZone.radius}
                onChange={(e) => setNewZone(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                className="radius-select"
              >
                <option value={500}>500m radius</option>
                <option value={1000}>1km radius</option>
                <option value={2000}>2km radius</option>
                <option value={5000}>5km radius</option>
              </select>
              
              <select
                value={newZone.type}
                onChange={(e) => setNewZone(prev => ({ ...prev, type: e.target.value }))}
                className="type-select"
              >
                <option value="safety">Safety Alert</option>
                <option value="reminder">Reminder</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            
            <button 
              className="create-zone-btn"
              onClick={addAlertZone}
              disabled={!location || !newZone.name.trim() || isInitializing}
            >
              <MapPin size={16} />
              Create Alert Zone
            </button>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="alerts-section">
          <h4>🚨 Active Alerts</h4>
          
          {activeAlerts.length === 0 ? (
            <div className="no-alerts">
              <CheckCircle size={32} />
              <p>No active alerts</p>
              <small>You'll be notified when you enter alert zones</small>
            </div>
          ) : (
            <div className="alerts-list">
              {activeAlerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-icon">
                    {alert.type === 'safety' ? '🛡️' : 
                     alert.type === 'warning' ? '⚠️' : '💡'}
                  </div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      <span className="alert-time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="alert-distance">{alert.distance}m away</span>
                    </div>
                  </div>
                  <button 
                    className="clear-alert-btn"
                    onClick={() => clearAlert(alert.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Features */}
        <div className="test-section">
          <h4>🧪 Test Features</h4>
          <div className="test-buttons">
            <button 
              className="test-btn"
              onClick={scheduleTestAlert}
              disabled={!serviceStatus.canSendNotifications}
            >
              <Clock size={16} />
              Schedule Test Alert
            </button>
            
            <button 
              className="test-btn"
              onClick={() => smartNotificationsService.createNotification(
                '🔔 Test Notification',
                { body: 'This is a test notification from Bachaoo Emergency' }
              )}
              disabled={!serviceStatus.canSendNotifications}
            >
              <Bell size={16} />
              Send Test Notification
            </button>
          </div>
        </div>

        {/* Initialization Loader */}
        {isInitializing && (
          <div className="initialization-overlay">
            <div className="loader"></div>
            <p>Initializing smart notifications...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNotifications;