import { openDB } from 'idb';

const DB_NAME = 'EmergencyPWA';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Emergency alerts store
      if (!db.objectStoreNames.contains('alerts')) {
        const alertStore = db.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
        alertStore.createIndex('timestamp', 'timestamp');
        alertStore.createIndex('type', 'type');
        alertStore.createIndex('status', 'status');
      }

      // Medical information store
      if (!db.objectStoreNames.contains('medicalInfo')) {
        db.createObjectStore('medicalInfo', { keyPath: 'id' });
      }

      // Emergency contacts store
      if (!db.objectStoreNames.contains('contacts')) {
        const contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
        contactStore.createIndex('priority', 'priority');
      }

      // Pending sync operations
      if (!db.objectStoreNames.contains('pendingSync')) {
        const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type');
        syncStore.createIndex('timestamp', 'timestamp');
      }

      // App settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    }
  });
};

export const EmergencyDB = {
  // Alerts operations
  async saveAlert(alert) {
    const db = await initDB();
    return db.add('alerts', {
      ...alert,
      timestamp: new Date().toISOString(),
      status: 'active'
    });
  },

  async getAlerts(limit = 50) {
    const db = await initDB();
    return db.getAllFromIndex('alerts', 'timestamp', null, limit);
  },

  async markAlertRead(id) {
    const db = await initDB();
    return db.put('alerts', { id, read: true });
  },

  // Medical info operations
  async saveMedicalInfo(info) {
    const db = await initDB();
    return db.put('medicalInfo', { id: 'user_medical', ...info });
  },

  async getMedicalInfo() {
    const db = await initDB();
    return db.get('medicalInfo', 'user_medical');
  },

  // Contacts operations
  async saveContact(contact) {
    const db = await initDB();
    return db.add('contacts', contact);
  },

  async getContacts() {
    const db = await initDB();
    return db.getAll('contacts');
  },

  async deleteContact(id) {
    const db = await initDB();
    return db.delete('contacts', id);
  },

  // Sync operations
  async queueForSync(operation) {
    const db = await initDB();
    return db.add('pendingSync', {
      ...operation,
      timestamp: new Date().toISOString(),
      attempts: 0
    });
  },

  async getPendingSync() {
    const db = await initDB();
    return db.getAll('pendingSync');
  },

  async removeFromSync(id) {
    const db = await initDB();
    return db.delete('pendingSync', id);
  },

  // Settings operations
  async saveSetting(key, value) {
    const db = await initDB();
    return db.put('settings', { key, value });
  },

  async getSetting(key) {
    const db = await initDB();
    const result = await db.get('settings', key);
    return result?.value;
  }
};