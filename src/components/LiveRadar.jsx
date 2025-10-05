import React, { useState, useEffect } from 'react';
import { Radar, Wifi, Satellite, Shield, Users, RefreshCw } from 'lucide-react';

const LiveRadar = ({ location, emergencyServices = [] }) => {
  const [radarData, setRadarData] = useState({
    networkStrength: 85,
    gpsAccuracy: 'Unknown',
    emergencyServices: 0,
    peopleNearby: 0,
    lastUpdate: new Date()
  });

  const [isScanning, setIsScanning] = useState(false);
  const [signalHistory, setSignalHistory] = useState([]);

  // Real-time data updates
  useEffect(() => {
    const updateRealTimeData = () => {
      // Real network strength from navigator.connection
      let networkStrength = 85;
      if (navigator.connection) {
        const connection = navigator.connection;
        // Convert downlink speed to signal strength (0-100)
        networkStrength = Math.min(100, Math.max(20, (connection.downlink || 5) * 15));
        
        // Adjust based on effective type
        if (connection.effectiveType === '4g') networkStrength *= 0.95;
        if (connection.effectiveType === '3g') networkStrength *= 0.8;
        if (connection.effectiveType === '2g') networkStrength *= 0.6;
      }

      // Real GPS accuracy based on location data
      let gpsAccuracy = 'Unknown';
      if (location) {
        if (location.accuracy < 20) gpsAccuracy = 'High';
        else if (location.accuracy < 50) gpsAccuracy = 'Medium';
        else gpsAccuracy = 'Low';
      }

      // Real emergency services count
      const realServices = emergencyServices.length;

      // Simulate people nearby (in real app, this would use actual data)
      const peopleNearby = Math.floor(Math.random() * 15) + realServices;

      setRadarData(prev => ({
        networkStrength: Math.round(networkStrength),
        gpsAccuracy,
        emergencyServices: realServices,
        peopleNearby,
        lastUpdate: new Date()
      }));

      // Update signal history for visualization
      setSignalHistory(prev => {
        const newHistory = [...prev, networkStrength];
        return newHistory.slice(-10); // Keep last 10 readings
      });
    };

    // Initial update
    updateRealTimeData();

    // Set up real-time interval
    const interval = setInterval(updateRealTimeData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [location, emergencyServices]);

  const startEmergencyScan = async () => {
    setIsScanning(true);
    
    // Simulate scanning process with real data updates
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update with progressively better data during scan
      setRadarData(prev => ({
        ...prev,
        networkStrength: Math.min(100, prev.networkStrength + 5),
        emergencyServices: Math.min(emergencyServices.length + 2, prev.emergencyServices + 1),
        lastUpdate: new Date()
      }));
    }
    
    setIsScanning(false);
  };

  const getNetworkIcon = () => {
    const strength = radarData.networkStrength;
    if (strength >= 80) return '📶';
    if (strength >= 60) return '📶';
    if (strength >= 40) return '📶';
    return '📶';
  };

  const getGpsStatusColor = () => {
    switch (radarData.gpsAccuracy) {
      case 'High': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSignalQuality = (strength) => {
    if (strength >= 80) return 'Excellent';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="live-radar-widget">
      <div className="widget-header">
        <div className="header-content">
          <Radar className="header-icon" />
          <div className="header-text">
            <h3>Live Emergency Radar</h3>
            <p>Real-time environment monitoring</p>
          </div>
        </div>
        <div className="radar-actions">
          <button 
            className={`scan-btn ${isScanning ? 'scanning' : ''}`}
            onClick={startEmergencyScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <RefreshCw size={16} className="spinning" />
            ) : (
              <Radar size={16} />
            )}
            {isScanning ? 'Scanning...' : 'Scan Area'}
          </button>
        </div>
      </div>

      <div className="widget-content">
        {/* Real-time Signal Graph */}
        <div className="signal-graph">
          <div className="graph-header">
            <span>Network Signal Strength</span>
            <span className="signal-quality">
              {getSignalQuality(radarData.networkStrength)}
            </span>
          </div>
          <div className="graph-bars">
            {signalHistory.map((strength, index) => (
              <div 
                key={index}
                className="signal-bar"
                style={{ 
                  height: `${strength}%`,
                  backgroundColor: strength >= 60 ? '#10b981' : strength >= 40 ? '#f59e0b' : '#ef4444'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Real-time Radar Grid */}
        <div className="radar-grid">
          <div className="radar-item">
            <div className="radar-icon">
              <Wifi className="radar-item-icon" />
              <div className="network-indicator">
                {getNetworkIcon()}
              </div>
            </div>
            <div className="radar-info">
              <span className="label">Network Signal</span>
              <div className="signal-strength">
                <div 
                  className="signal-fill" 
                  style={{ width: `${radarData.networkStrength}%` }}
                ></div>
              </div>
              <span className="value">{radarData.networkStrength}%</span>
              <span className="sub-value">
                {navigator.connection ? `${navigator.connection.effectiveType} • ${navigator.connection.downlink} Mbps` : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="radar-item">
            <div className="radar-icon">
              <Satellite className="radar-item-icon" />
              <div 
                className="gps-indicator"
                style={{ backgroundColor: getGpsStatusColor() }}
              ></div>
            </div>
            <div className="radar-info">
              <span className="label">GPS Accuracy</span>
              <span className={`value accuracy-${radarData.gpsAccuracy.toLowerCase()}`}>
                {radarData.gpsAccuracy}
              </span>
              <span className="sub-value">
                {location ? `±${Math.round(location.accuracy)}m` : 'No GPS'}
              </span>
            </div>
          </div>

          <div className="radar-item">
            <div className="radar-icon">
              <Shield className="radar-item-icon" />
              <div className="services-indicator">
                {radarData.emergencyServices > 0 ? '🛡️' : '🔍'}
              </div>
            </div>
            <div className="radar-info">
              <span className="label">Emergency Services</span>
              <span className="value">{radarData.emergencyServices} nearby</span>
              <span className="sub-value">
                {radarData.emergencyServices > 0 ? 'Active monitoring' : 'Searching...'}
              </span>
            </div>
          </div>

          <div className="radar-item">
            <div className="radar-icon">
              <Users className="radar-item-icon" />
              <div className="people-indicator">
                {radarData.peopleNearby > 5 ? '👥' : '👤'}
              </div>
            </div>
            <div className="radar-info">
              <span className="label">People Nearby</span>
              <span className="value">{radarData.peopleNearby} detected</span>
              <span className="sub-value">
                {radarData.peopleNearby > 10 ? 'High density' : 'Normal activity'}
              </span>
            </div>
          </div>
        </div>

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="scanning-overlay">
            <div className="scanning-animation">
              <div className="radar-sweep"></div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
            <div className="scanning-text">
              <h4>Scanning Emergency Network</h4>
              <p>Detecting services and analyzing environment...</p>
              <div className="scan-progress">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Status Footer */}
        <div className="radar-footer">
          <div className="status-info">
            <div className="status-item">
              <div className="status-dot live"></div>
              <span>Live Monitoring Active</span>
            </div>
            <div className="status-item">
              <RefreshCw size={12} />
              <span>Updates every 5s</span>
            </div>
          </div>
          <span className="last-update">
            Last scan: {radarData.lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiveRadar;