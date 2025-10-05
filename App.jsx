import React, { useState, useEffect } from 'react';
import BachaooButton from './components/BachaooButton';
import HelperZProfile from './components/HelperZProfile';
import HelperZMap from './components/HelperZMap';
import { 
  AlertTriangle, Map, Navigation, Wifi, Satellite, Phone, 
  Shield, Brain, Radar, Bell, Siren, Heart, Home,
  User, Activity, Zap, RefreshCw, MapPin, Users, LifeBuoy,
  Target, Clock, Star, Award
} from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';
import EmergencyAI from './components/EmergencyAI';
import LiveRadar from './components/LiveRadar';
import SmartAlerts from './components/SmartAlerts';
import EmergencySOS from './components/EmergencySOS';
import LiveLocationTracker from './components/LiveLocationTracker';
import MedicalEmergency from './components/MedicalEmergency';
import SmartNotifications from './components/SmartNotifications';
import ErrorBoundary from './components/ErrorBoundary';
import RealTimeService from './services/realTimeService';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [activeTab, setActiveTab] = useState('bachaoo');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({ name: 'User' });
  const [systemStatus, setSystemStatus] = useState({
    gps: 'active',
    network: 'strong',
    battery: 85,
    lastUpdate: new Date(),
    nearbyServices: 0,
    address: 'Getting location...'
  });
  const [emergencyServices, setEmergencyServices] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get user location and initialize app
  useEffect(() => {
    let watchId;
    
    const startRealTimeTracking = async () => {
      try {
        if (navigator.geolocation) {
          // Get initial position
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              };
              
              setLocation(newLocation);
              await updateLocationData(newLocation);
              setIsLoading(false);
            },
            (error) => {
              console.error('Location error:', error);
              setIsLoading(false);
            },
            { 
              enableHighAccuracy: true, 
              timeout: 15000,
              maximumAge: 0
            }
          );

          // Watch for position changes
          watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp
              };
              
              setLocation(newLocation);
              await updateLocationData(newLocation);
            },
            (error) => {
              console.error('Location watch error:', error);
              setSystemStatus(prev => ({ ...prev, gps: 'inactive' }));
            },
            { 
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000
            }
          );
        } else {
          setIsLoading(false);
        }

        // Real network monitoring
        const updateNetworkStatus = () => {
          const online = navigator.onLine;
          setNetworkStatus(online ? 'online' : 'offline');
          
          if (navigator.connection) {
            setSystemStatus(prev => ({
              ...prev,
              network: navigator.connection.effectiveType
            }));
          }
        };

        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        updateNetworkStatus();

        // Battery status
        if (navigator.getBattery) {
          navigator.getBattery().then(battery => {
            const updateBattery = () => {
              setSystemStatus(prev => ({
                ...prev,
                battery: Math.round(battery.level * 100)
              }));
            };
            
            battery.addEventListener('levelchange', updateBattery);
            updateBattery();
          });
        }

        // Real-time system updates
        const systemInterval = setInterval(() => {
          setSystemStatus(prev => ({
            ...prev,
            lastUpdate: new Date()
          }));
        }, 30000);

        return () => {
          if (watchId) navigator.geolocation.clearWatch(watchId);
          clearInterval(systemInterval);
        };

      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    const updateLocationData = async (loc) => {
      try {
        // Get real address with error handling
        let addressData;
        try {
          addressData = await RealTimeService.getLocationAddress(loc.lat, loc.lng);
        } catch (error) {
          console.log('Using fallback address data');
          addressData = {
            city: 'Your Location',
            locality: `Lat: ${loc.lat.toFixed(4)}, Lng: ${loc.lng.toFixed(4)}`,
            address: 'GPS coordinates available'
          };
        }
        
        // Get real emergency services with error handling
        let services;
        try {
          services = await RealTimeService.getNearbyEmergencyServices(loc.lat, loc.lng);
        } catch (error) {
          console.log('Using fallback emergency services');
          services = [
            {
              id: 1,
              name: 'Police Emergency',
              type: 'police',
              distance: 1.5,
              phone: '15'
            },
            {
              id: 2,
              name: 'Ambulance Service', 
              type: 'medical',
              distance: 2.0,
              phone: '1122'
            }
          ];
        }
        
        setEmergencyServices(services);
        
        setSystemStatus(prev => ({
          ...prev,
          address: `${addressData.city || addressData.locality || 'Unknown location'}`,
          nearbyServices: services.length,
          gps: `active (±${Math.round(loc.accuracy)}m)`
        }));
      } catch (error) {
        console.error('Error updating location data:', error);
        // Set fallback data
        setSystemStatus(prev => ({
          ...prev,
          address: `Location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
          nearbyServices: 2,
          gps: `active (±${Math.round(loc.accuracy)}m)`
        }));
      }
    };

    startRealTimeTracking();
  }, []);

  const refreshData = async () => {
    if (!location || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      let services;
      try {
        services = await RealTimeService.getNearbyEmergencyServices(location.lat, location.lng);
      } catch (error) {
        console.log('Using fallback services for refresh');
        services = [
          {
            id: 1,
            name: 'Police Station',
            type: 'police',
            distance: 1.2,
            phone: '15'
          },
          {
            id: 2,
            name: 'Hospital', 
            type: 'medical',
            distance: 1.8,
            phone: '1122'
          }
        ];
      }
      
      setEmergencyServices(services);
      setSystemStatus(prev => ({
        ...prev,
        nearbyServices: services.length,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const callEmergency = (number) => {
    window.location.href = `tel:${number}`;
  };

  const shareLocation = () => {
    if (location) {
      const message = `🚨 EMERGENCY! My location: https://maps.google.com/?q=${location.lat},${location.lng}. Address: ${systemStatus.address}`;
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    } else {
      alert('Please allow location access to share your location');
    }
  };

  const emergencyNumbers = [
    { name: 'Police', number: '15', icon: '👮', color: '#3b82f6', type: 'law' },
    { name: 'Ambulance', number: '1122', icon: '🚑', color: '#ef4444', type: 'medical' },
    { name: 'Fire', number: '16', icon: '🚒', color: '#f59e0b', type: 'fire' },
    { name: 'Women Helpline', number: '1099', icon: '👩', color: '#8b5cf6', type: 'support' },
    { name: 'Disaster', number: '1122', icon: '🌪️', color: '#6366f1', type: 'disaster' },
    { name: 'Share Location', number: 'share', icon: '📍', color: '#10b981', type: 'share', action: shareLocation }
  ];

  // NEW BACHAOO TAB
  const renderBachaooTab = () => (
    <div className="bachaoo-tab">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <LifeBuoy size={48} />
          </div>
          <h1>Bachaoo Community Help</h1>
          <p>Get immediate help from nearby HelperZ or become one to help others</p>
        </div>
      </div>

      <div className="bachaoo-main-section">
        <div className="circular-bachaoo-container">
          <ErrorBoundary>
            <BachaooButton location={location} />
          </ErrorBoundary>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <Users size={20} />
            <div>
              <span className="stat-value">12</span>
              <span className="stat-label">HelperZ Online</span>
            </div>
          </div>
          <div className="stat-item">
            <Clock size={20} />
            <div>
              <span className="stat-value">2min</span>
              <span className="stat-label">Avg Response</span>
            </div>
          </div>
          <div className="stat-item">
            <Award size={20} />
            <div>
              <span className="stat-value">156</span>
              <span className="stat-label">Helps Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // NEW HELPERZ TAB
  const renderHelperZTab = () => (
    <div className="helperz-tab">
      <div className="tab-header">
        <div className="header-content">
          <Users size={32} />
          <div>
            <h1>HelperZ Network</h1>
            <p>Join the community and help people nearby</p>
          </div>
        </div>
      </div>

      <div className="helperz-content">
        <div className="helperz-main">
          <ErrorBoundary>
            <HelperZProfile user={user} location={location} />
          </ErrorBoundary>
        </div>

        <div className="helperz-sidebar">
          <div className="sidebar-widget">
            <h3>🏆 Leaderboard</h3>
            <div className="leaderboard-list">
              <div className="leader-item">
                <span className="rank">1</span>
                <span className="name">Ali Ahmed</span>
                <span className="points">250 pts</span>
              </div>
              <div className="leader-item">
                <span className="rank">2</span>
                <span className="name">Sara Khan</span>
                <span className="points">180 pts</span>
              </div>
              <div className="leader-item">
                <span className="rank">3</span>
                <span className="name">Usman Riaz</span>
                <span className="points">150 pts</span>
              </div>
            </div>
          </div>

          <div className="sidebar-widget">
            <h3>📊 Your Impact</h3>
            <div className="impact-stats">
              <div className="impact-item">
                <span>People Helped</span>
                <strong>0</strong>
              </div>
              <div className="impact-item">
                <span>Response Time</span>
                <strong>--</strong>
              </div>
              <div className="impact-item">
                <span>Community Rank</span>
                <strong>New</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // UPDATED EMERGENCY TAB
  const renderEmergencyTab = () => (
    <div className="emergency-tab">
      <div className="tab-header critical">
        <div className="header-content">
          <Siren size={32} />
          <div>
            <h1>Emergency Services</h1>
            <p>Immediate professional emergency contacts</p>
          </div>
        </div>
      </div>

      <div className="emergency-grid-professional">
        <div className="emergency-card police">
          <div className="card-icon">👮</div>
          <h3>Police</h3>
          <p>Immediate law enforcement response</p>
          <button className="emergency-call-btn" onClick={() => callEmergency('15')}>
            <Phone size={16} />
            Call 15
          </button>
        </div>

        <div className="emergency-card medical">
          <div className="card-icon">🚑</div>
          <h3>Ambulance</h3>
          <p>Medical emergency response</p>
          <button className="emergency-call-btn" onClick={() => callEmergency('1122')}>
            <Phone size={16} />
            Call 1122
          </button>
        </div>

        <div className="emergency-card fire">
          <div className="card-icon">🚒</div>
          <h3>Fire Brigade</h3>
          <p>Fire and rescue services</p>
          <button className="emergency-call-btn" onClick={() => callEmergency('16')}>
            <Phone size={16} />
            Call 16
          </button>
        </div>

        <div className="emergency-card women">
          <div className="card-icon">👩</div>
          <h3>Women Helpline</h3>
          <p>24/7 support for women</p>
          <button className="emergency-call-btn" onClick={() => callEmergency('1099')}>
            <Phone size={16} />
            Call 1099
          </button>
        </div>

        <div className="emergency-card location">
          <div className="card-icon">📍</div>
          <h3>Share Location</h3>
          <p>Share your location with emergency contacts</p>
          <button className="emergency-call-btn" onClick={shareLocation}>
            <Navigation size={16} />
            Share Now
          </button>
        </div>

        <div className="emergency-card disaster">
          <div className="card-icon">🌪️</div>
          <h3>Disaster Management</h3>
          <p>Natural disaster response</p>
          <button className="emergency-call-btn" onClick={() => callEmergency('1122')}>
            <Phone size={16} />
            Call 1122
          </button>
        </div>
      </div>

      <div className="emergency-ai-section">
        <ErrorBoundary>
          <EmergencyAI location={location} />
        </ErrorBoundary>
      </div>
    </div>
  );

  // UPDATED DASHBOARD TAB
  const renderDashboardTab = () => (
    <div className="dashboard-tab">
      <div className="tab-header">
        <div className="header-content">
          <Activity size={32} />
          <div>
            <h1>System Dashboard</h1>
            <p>Real-time monitoring and status</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-minimal">
        <div className="status-widget-minimal">
          <div className="widget-header">
            <Satellite size={20} />
            <h3>Location Status</h3>
          </div>
          <div className="status-content">
            <div className="status-badge active">
              <div className="pulse-dot"></div>
              Live GPS
            </div>
            <p className="location-text">{systemStatus.address}</p>
          </div>
        </div>

        <div className="status-widget-minimal">
          <div className="widget-header">
            <Wifi size={20} />
            <h3>Network Status</h3>
          </div>
          <div className="status-content">
            <div className={`status-badge ${networkStatus}`}>
              {networkStatus === 'online' ? '🟢 Online' : '🔴 Offline'}
            </div>
            <p>Connection: {systemStatus.network}</p>
          </div>
        </div>

        <div className="status-widget-minimal">
          <div className="widget-header">
            <User size={20} />
            <h3>Battery</h3>
          </div>
          <div className="status-content">
            <div className="battery-display">
              <div className="battery-level">
                <div 
                  className="battery-fill"
                  style={{ width: `${systemStatus.battery}%` }}
                ></div>
              </div>
              <span>{systemStatus.battery}%</span>
            </div>
          </div>
        </div>

        <div className="status-widget-minimal">
          <div className="widget-header">
            <Shield size={20} />
            <h3>Services</h3>
          </div>
          <div className="status-content">
            <div className="services-count">
              {systemStatus.nearbyServices} nearby
            </div>
            <p>Emergency services available</p>
          </div>
        </div>
      </div>

      <div className="map-section">
        <ErrorBoundary>
          <LiveLocationTracker location={location} />
        </ErrorBoundary>
      </div>
    </div>
  );

  // MAP TAB
  const renderMapTab = () => (
    <div className="map-tab">
      <div className="tab-header">
        <div className="header-content">
          <Map size={32} />
          <div>
            <h1>Live Location & HelperZ</h1>
            <p>Real-time mapping and community network</p>
          </div>
        </div>
      </div>
      <div className="map-container-full">
        <ErrorBoundary>
          <HelperZMap location={location} />
        </ErrorBoundary>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app professional-redesign">
      <header className="professional-header">
        <div className="header-main">
          <div className="brand-section">
            <div className="brand-logo">
              <LifeBuoy className="logo-icon" />
            </div>
            <div className="brand-text">
              <h1>Bachaoo</h1>
              <p>Community Safety Network</p>
            </div>
          </div>
          
          <div className="header-status">
            <div className="status-items">
              <div className="status-item-compact">
                <Satellite size={14} />
                <span>{location ? 'LIVE' : 'GPS'}</span>
              </div>
              <div className="status-item-compact">
                <Wifi size={14} />
                <span>{networkStatus === 'online' ? 'ON' : 'OFF'}</span>
              </div>
              <div className="status-item-compact">
                <div className="battery-compact">
                  <div 
                    className="battery-fill-compact"
                    style={{ width: `${systemStatus.battery}%` }}
                  ></div>
                </div>
                <span>{systemStatus.battery}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* NEW NAVIGATION */}
        <nav className="professional-nav-redesign">
          <button 
            className={`nav-item ${activeTab === 'bachaoo' ? 'active' : ''}`}
            onClick={() => setActiveTab('bachaoo')}
          >
            <LifeBuoy size={20} />
            <span>Bachaoo</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'helperz' ? 'active' : ''}`}
            onClick={() => setActiveTab('helperz')}
          >
            <Users size={20} />
            <span>HelperZ</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            <Siren size={20} />
            <span>Emergency</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <Map size={20} />
            <span>Map</span>
          </button>
        </nav>
      </header>

      <main className="professional-main-redesign">
        {activeTab === 'bachaoo' && renderBachaooTab()}
        {activeTab === 'helperz' && renderHelperZTab()}
        {activeTab === 'emergency' && renderEmergencyTab()}
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'map' && renderMapTab()}
      </main>

      <footer className="professional-footer-redesign">
        <div className="footer-content">
          <div className="system-status">
            <div className="status-dot live"></div>
            <span>Bachaoo Network • Live</span>
          </div>
          <div className="last-update">
            Updated: {systemStatus.lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;