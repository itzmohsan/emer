// Safe Smart Notifications Service - Won't break main app
class SmartNotificationsService {
  constructor() {
    this.isSupported = this.checkSupport();
    this.permission = null;
    this.alertZones = new Map();
    this.isInitialized = false;
  }

  // Check if browser supports notifications
  checkSupport() {
    try {
      return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    } catch (error) {
      console.warn('Notifications not supported:', error);
      return false;
    }
  }

  // Safe initialization
  async initialize() {
    if (!this.isSupported || this.isInitialized) {
      return { success: false, reason: 'not_supported' };
    }

    try {
      // Request permission
      this.permission = await Notification.requestPermission();
      
      // Register service worker for push notifications
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      }

      this.isInitialized = true;
      return { success: true, permission: this.permission };
    } catch (error) {
      console.error('Smart notifications initialization failed:', error);
      return { success: false, reason: 'initialization_failed', error: error.message };
    }
  }

  // Safe notification creation
  async createNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return { success: false, reason: 'not_allowed' };
    }

    try {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return { success: true, notification };
    } catch (error) {
      console.error('Notification creation failed:', error);
      return { success: false, reason: 'creation_failed', error: error.message };
    }
  }

  // Location-based alert zones
  addAlertZone(zone) {
    try {
      const zoneId = `zone_${Date.now()}`;
      this.alertZones.set(zoneId, {
        id: zoneId,
        name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        radius: zone.radius || 1000, // meters
        type: zone.type || 'safety',
        enabled: true,
        createdAt: new Date()
      });
      return { success: true, zoneId };
    } catch (error) {
      console.error('Add alert zone failed:', error);
      return { success: false, reason: 'zone_creation_failed' };
    }
  }

  // Check if location is in any alert zone
  checkLocationInZones(currentLat, currentLng) {
    try {
      const triggeredZones = [];
      
      for (const [zoneId, zone] of this.alertZones) {
        if (!zone.enabled) continue;

        const distance = this.calculateDistance(
          currentLat, currentLng, 
          zone.lat, zone.lng
        );

        if (distance <= zone.radius) {
          triggeredZones.push({
            ...zone,
            distance: Math.round(distance)
          });
        }
      }

      return { success: true, triggeredZones };
    } catch (error) {
      console.error('Location zone check failed:', error);
      return { success: false, reason: 'location_check_failed', triggeredZones: [] };
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI/180);
  }

  // Time-based alerts
  scheduleTimeAlert(alert) {
    try {
      const now = new Date();
      const alertTime = new Date(alert.time);
      
      if (alertTime <= now) {
        return { success: false, reason: 'invalid_time' };
      }

      const timeout = alertTime.getTime() - now.getTime();
      const timerId = setTimeout(() => {
        this.createNotification(alert.title, {
          body: alert.message,
          tag: 'time_alert'
        });
      }, timeout);

      return { success: true, timerId };
    } catch (error) {
      console.error('Time alert scheduling failed:', error);
      return { success: false, reason: 'scheduling_failed' };
    }
  }

  // Get current notification status
  getStatus() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      isInitialized: this.isInitialized,
      alertZonesCount: this.alertZones.size,
      canSendNotifications: this.isSupported && this.permission === 'granted' && this.isInitialized
    };
  }

  // Cleanup
  destroy() {
    try {
      this.alertZones.clear();
      this.isInitialized = false;
      return { success: true };
    } catch (error) {
      console.error('Cleanup failed:', error);
      return { success: false };
    }
  }
}

// Create singleton instance
const smartNotificationsService = new SmartNotificationsService();
export default smartNotificationsService;