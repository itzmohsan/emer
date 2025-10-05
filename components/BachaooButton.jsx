import React, { useState, useEffect } from 'react';
import { Users, Navigation, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import realTimeService from '../services/realTimeService';

const BachaooButton = ({ location }) => {
  const [helpStatus, setHelpStatus] = useState('idle');
  const [helperZ, setHelperZ] = useState(null);
  const [eta, setEta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);

  // Real-time updates
  useEffect(() => {
    const handleRealTimeUpdate = (update) => {
      if (update.type === 'REQUEST_ACCEPTED' && update.data.id === currentRequestId) {
        // Our request was accepted!
        const helper = realTimeService.getAvailableHelpers().find(h => h.id === update.data.acceptedBy);
        if (helper) {
          setHelperZ({
            id: helper.id,
            name: helper.name || 'Nearby Helper',
            distance: realTimeService.calculateDistance(
              location.lat, location.lng,
              helper.location.lat, helper.location.lng
            ).toFixed(1),
            eta: Math.max(2, Math.round(helper.distance * 10))
          });
          setHelpStatus('help_coming');
          setEta(Math.max(2, Math.round(helper.distance * 10)));
        }
      }
    };

    realTimeService.subscribe('bachaoo_button', handleRealTimeUpdate);
    
    return () => {
      realTimeService.unsubscribe('bachaoo_button');
    };
  }, [location, currentRequestId]);

  const requestHelp = async () => {
    try {
      if (!location) {
        alert('📍 Please enable location services to request help');
        return;
      }

      setIsLoading(true);
      setError(null);
      setHelpStatus('seeking');

      // Create REAL help request
      const request = realTimeService.createHelpRequest({
        location: location,
        emergencyType: 'General Help Needed',
        userData: {
          name: 'User needing help',
          phone: 'Unknown'
        }
      });

      setCurrentRequestId(request.id);

      // Immediately check for nearby helpers
      const nearbyHelpers = realTimeService.findNearbyHelpers(location, 2);
      
      if (nearbyHelpers.length > 0) {
        // Simulate helper accepting (in real app, this would be automatic)
        setTimeout(() => {
          if (helpStatus === 'seeking') {
            // Auto-accept by first available helper for demo
            const acceptedRequest = realTimeService.acceptHelpRequest(request.id, nearbyHelpers[0].id);
            if (acceptedRequest) {
              const helper = nearbyHelpers[0];
              setHelperZ({
                id: helper.id,
                name: helper.name || 'Nearby Helper',
                distance: helper.distance.toFixed(1),
                eta: Math.max(2, Math.round(helper.distance * 10))
              });
              setHelpStatus('help_coming');
              setEta(Math.max(2, Math.round(helper.distance * 10)));
            }
          }
        }, 3000);
      } else {
        setHelpStatus('seeking');
        // Keep searching
        const searchInterval = setInterval(() => {
          const helpers = realTimeService.findNearbyHelpers(location, 2);
          if (helpers.length > 0 && helpStatus === 'seeking') {
            const acceptedRequest = realTimeService.acceptHelpRequest(request.id, helpers[0].id);
            if (acceptedRequest) {
              const helper = helpers[0];
              setHelperZ({
                id: helper.id,
                name: helper.name || 'Nearby Helper',
                distance: helper.distance.toFixed(1),
                eta: Math.max(2, Math.round(helper.distance * 10))
              });
              setHelpStatus('help_coming');
              setEta(Math.max(2, Math.round(helper.distance * 10)));
              clearInterval(searchInterval);
            }
          }
        }, 5000);

        // Auto-cancel after 30 seconds if no helpers
        setTimeout(() => {
          if (helpStatus === 'seeking') {
            clearInterval(searchInterval);
            cancelHelp();
            alert('No helpers found nearby. Please try emergency services.');
          }
        }, 30000);
      }
      
    } catch (err) {
      setError('Failed to find helpers. Please try again.');
      setHelpStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelHelp = () => {
    try {
      if (currentRequestId) {
        realTimeService.completeHelpRequest(currentRequestId);
      }
      
      setHelpStatus('idle');
      setHelperZ(null);
      setEta(null);
      setError(null);
      setCurrentRequestId(null);
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const completeHelp = () => {
    try {
      if (currentRequestId) {
        realTimeService.completeHelpRequest(currentRequestId);
        
        // Award points to helper
        if (helperZ) {
          const helperStats = JSON.parse(localStorage.getItem('helperz_stats') || '{}');
          const updatedStats = {
            ...helperStats,
            points: (helperStats.points || 0) + 10,
            helpsGiven: (helperStats.helpsGiven || 0) + 1,
            rating: ((helperStats.rating || 0) * (helperStats.helpsGiven || 0) + 5) / ((helperStats.helpsGiven || 0) + 1)
          };
          localStorage.setItem('helperz_stats', JSON.stringify(updatedStats));
        }
      }
      
      setHelpStatus('idle');
      setHelperZ(null);
      setEta(null);
      setCurrentRequestId(null);
      alert('✅ Thank you! HelperZ has been awarded 10 points.');
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  if (error) {
    return (
      <div className="bachaoo-error-state">
        <AlertTriangle size={32} />
        <p>{error}</p>
        <button onClick={() => setError(null)} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bachaoo-system">
      <div className={`bachaoo-button-container ${helpStatus}`}>
        <button 
          className={`bachaoo-main-btn ${helpStatus} ${isLoading ? 'loading' : ''}`}
          onClick={helpStatus === 'idle' ? requestHelp : cancelHelp}
          disabled={isLoading}
        >
          <div className="button-content">
            <Shield size={24} />
            <span className="btn-text">
              {isLoading ? 'Finding Help...' : 
               helpStatus === 'idle' ? 'Bachaoo' :
               helpStatus === 'seeking' ? 'Seeking HelperZ...' :
               helpStatus === 'help_coming' ? 'Help Coming!' : 'Help Completed'}
            </span>
          </div>
          
          {helpStatus === 'seeking' && (
            <div className="searching-indicator">
              <div className="pulse-ring"></div>
              <span>Searching within 2km</span>
            </div>
          )}
        </button>
      </div>

      {helperZ && (
        <div className="helperz-info-card">
          <div className="helper-header">
            <div className="helper-avatar">
              <Users size={20} />
            </div>
            <div className="helper-details">
              <h4>HelperZ Coming!</h4>
              <div className="helper-stats">
                <span className="distance">{helperZ.distance}km away</span>
                <span className="eta">ETA: {helperZ.eta} min</span>
              </div>
            </div>
          </div>

          {eta !== null && (
            <div className="eta-display">
              <Clock size={16} />
              <span>Helper is on the way: {eta} minutes</span>
            </div>
          )}

          <div className="helper-actions">
            <button className="nav-btn" onClick={() => {
              const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
              window.open(mapsUrl, '_blank');
            }}>
              <Navigation size={16} />
              Share Location
            </button>
          </div>

          {helpStatus === 'help_coming' && (
            <button className="complete-btn" onClick={completeHelp}>
              <CheckCircle size={16} />
              Mark as Helped
            </button>
          )}
        </div>
      )}

      <div className="network-status">
        <div className="status-item">
          <span className="status-dot online"></span>
          <span>Real-time HelperZ Network Active</span>
        </div>
      </div>
    </div>
  );
};

export default BachaooButton;