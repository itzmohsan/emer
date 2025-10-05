// Real-time service with all required functions
class RealTimeService {
  // Mock location address service
  static async getLocationAddress(lat, lng) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock address data
      return {
        city: 'Lahore',
        locality: 'Gulberg',
        address: `Nearby location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return {
        city: 'Unknown',
        locality: 'Area',
        address: 'Location services unavailable'
      };
    }
  }

  // Mock emergency services
  static async getNearbyEmergencyServices(lat, lng) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return mock emergency services
      return [
        {
          id: 1,
          name: 'Services Hospital',
          type: 'hospital',
          distance: 1.2,
          phone: '042-111-111-111'
        },
        {
          id: 2,
          name: 'Gulberg Police Station',
          type: 'police', 
          distance: 0.8,
          phone: '15'
        },
        {
          id: 3,
          name: 'Rescue 1122',
          type: 'rescue',
          distance: 1.5,
          phone: '1122'
        },
        {
          id: 4,
          name: 'Jinnah Hospital',
          type: 'hospital',
          distance: 2.1,
          phone: '042-111-111-222'
        }
      ];
    } catch (error) {
      console.error('Error getting emergency services:', error);
      return [];
    }
  }

  // Real-time communication system
  constructor() {
    this.listeners = new Map();
    this.setupRealTimeListener();
  }

  setupRealTimeListener() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'helperz_network_updates') {
        this.notifyAll(JSON.parse(event.newValue || '{}'));
      }
    });

    setInterval(() => {
      const updates = localStorage.getItem('helperz_network_updates');
      if (updates) {
        this.notifyAll(JSON.parse(updates));
      }
    }, 2000);
  }

  subscribe(componentId, callback) {
    this.listeners.set(componentId, callback);
  }

  unsubscribe(componentId) {
    this.listeners.delete(componentId);
  }

  notifyAll(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    });
  }

  broadcastUpdate(type, data) {
    const update = {
      type,
      data,
      timestamp: Date.now(),
      tabId: Math.random().toString(36).substr(2, 9)
    };
    
    localStorage.setItem('helperz_network_updates', JSON.stringify(update));
    
    setTimeout(() => {
      this.notifyAll(update);
    }, 100);
  }

  registerHelper(helperData) {
    const helpers = this.getAvailableHelpers();
    const existingIndex = helpers.findIndex(h => h.id === helperData.id);
    
    if (existingIndex >= 0) {
      helpers[existingIndex] = { ...helpers[existingIndex], ...helperData, lastSeen: Date.now() };
    } else {
      helpers.push({ ...helperData, lastSeen: Date.now() });
    }
    
    localStorage.setItem('available_helpers', JSON.stringify(helpers));
    this.broadcastUpdate('HELPER_UPDATE', helpers);
    return helpers;
  }

  unregisterHelper(helperId) {
    const helpers = this.getAvailableHelpers();
    const updatedHelpers = helpers.filter(h => h.id !== helperId);
    localStorage.setItem('available_helpers', JSON.stringify(updatedHelpers));
    this.broadcastUpdate('HELPER_UPDATE', updatedHelpers);
    return updatedHelpers;
  }

  createHelpRequest(requestData) {
    const requests = this.getActiveRequests();
    const newRequest = {
      id: Date.now().toString(),
      ...requestData,
      status: 'pending',
      createdAt: Date.now(),
      helpersNotified: []
    };
    
    requests.push(newRequest);
    localStorage.setItem('active_help_requests', JSON.stringify(requests));
    this.broadcastUpdate('NEW_HELP_REQUEST', newRequest);
    return newRequest;
  }

  acceptHelpRequest(requestId, helperId) {
    const requests = this.getActiveRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex >= 0) {
      requests[requestIndex].status = 'accepted';
      requests[requestIndex].acceptedBy = helperId;
      requests[requestIndex].acceptedAt = Date.now();
      
      localStorage.setItem('active_help_requests', JSON.stringify(requests));
      this.broadcastUpdate('REQUEST_ACCEPTED', requests[requestIndex]);
      
      this.unregisterHelper(helperId);
      
      return requests[requestIndex];
    }
    return null;
  }

  completeHelpRequest(requestId) {
    const requests = this.getActiveRequests();
    const updatedRequests = requests.filter(r => r.id !== requestId);
    localStorage.setItem('active_help_requests', JSON.stringify(updatedRequests));
    this.broadcastUpdate('REQUEST_COMPLETED', { requestId });
    return updatedRequests;
  }

  getAvailableHelpers() {
    const helpers = JSON.parse(localStorage.getItem('available_helpers') || '[]');
    const now = Date.now();
    const activeHelpers = helpers.filter(h => (now - h.lastSeen) < 30000);
   
    if (activeHelpers.length !== helpers.length) {
      localStorage.setItem('available_helpers', JSON.stringify(activeHelpers));
    }
    
    return activeHelpers;
  }

  getActiveRequests() {
    const requests = JSON.parse(localStorage.getItem('active_help_requests') || '[]');
    const now = Date.now();
    const activeRequests = requests.filter(r => (now - r.createdAt) < 300000);
    
    if (activeRequests.length !== requests.length) {
      localStorage.setItem('active_help_requests', JSON.stringify(activeRequests));
    }
    
    return activeRequests;
  }

  updateHelperLocation(helperId, location) {
    const helpers = this.getAvailableHelpers();
    const helperIndex = helpers.findIndex(h => h.id === helperId);
    
    if (helperIndex >= 0) {
      helpers[helperIndex].location = location;
      helpers[helperIndex].lastSeen = Date.now();
      localStorage.setItem('available_helpers', JSON.stringify(helpers));
      this.broadcastUpdate('HELPER_LOCATION_UPDATE', helpers[helperIndex]);
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  findNearbyHelpers(userLocation, maxDistance = 2) {
    const helpers = this.getAvailableHelpers();
    return helpers
      .map(helper => ({
        ...helper,
        distance: this.calculateDistance(
          userLocation.lat, userLocation.lng,
          helper.location.lat, helper.location.lng
        )
      }))
      .filter(helper => helper.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  findNearbyRequests(userLocation, maxDistance = 2) {
    const requests = this.getActiveRequests();
    return requests
      .filter(request => request.status === 'pending')
      .map(request => ({
        ...request,
        distance: this.calculateDistance(
          userLocation.lat, userLocation.lng,
          request.location.lat, request.location.lng
        )
      }))
      .filter(request => request.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}

// Create singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;