import { EmergencyDB } from './database.js';

export class SyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  handleOnline() {
    this.isOnline = true;
    this.processPendingSync();
    this.syncMedicalInfo();
    this.syncContacts();
  }

  handleOffline() {
    this.isOnline = false;
  }

  async processPendingSync() {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      const pendingOperations = await EmergencyDB.getPendingSync();
      
      for (const operation of pendingOperations) {
        try {
          await this.processSyncOperation(operation);
          await EmergencyDB.removeFromSync(operation.id);
        } catch (error) {
          console.error('Sync operation failed:', error);
          operation.attempts += 1;
          
          if (operation.attempts < 3) {
            // Retry later
            await EmergencyDB.queueForSync(operation);
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncOperation(operation) {
    switch (operation.type) {
      case 'EMERGENCY_ALERT':
        await this.syncEmergencyAlert(operation.data);
        break;
      case 'MEDICAL_INFO_UPDATE':
        await this.syncMedicalInfoUpdate(operation.data);
        break;
      case 'CONTACT_UPDATE':
        await this.syncContactUpdate(operation.data);
        break;
      default:
        console.warn('Unknown sync operation:', operation.type);
    }
  }

  async syncEmergencyAlert(alertData) {
    // Implement API call to your backend
    const response = await fetch('/api/emergency-alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData)
    });

    if (!response.ok) {
      throw new Error('Failed to sync emergency alert');
    }
  }

  async syncMedicalInfo() {
    const medicalInfo = await EmergencyDB.getMedicalInfo();
    if (medicalInfo) {
      // Sync with backend
      await this.queueSyncOperation('MEDICAL_INFO_UPDATE', medicalInfo);
    }
  }

  async syncContacts() {
    const contacts = await EmergencyDB.getContacts();
    if (contacts.length > 0) {
      await this.queueSyncOperation('CONTACT_UPDATE', { contacts });
    }
  }

  async queueSyncOperation(type, data) {
    if (this.isOnline) {
      try {
        await this.processSyncOperation({ type, data });
      } catch (error) {
        await EmergencyDB.queueForSync({ type, data });
      }
    } else {
      await EmergencyDB.queueForSync({ type, data });
    }
  }
}

export const syncManager = new SyncManager();