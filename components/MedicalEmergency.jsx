import React, { useState, useEffect, useCallback } from 'react';
import { EmergencyDB } from '../utils/database.js';
import { syncManager } from '../utils/syncManager.js';

const MedicalEmergency = ({ location, offlineMode = false }) => {
  const [medicalInfo, setMedicalInfo] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: '',
    emergencyContact: '',
    insuranceProvider: '',
    doctorContact: '',
    pharmacyContact: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [emergencyHistory, setEmergencyHistory] = useState([]);

  useEffect(() => {
    loadMedicalData();
  }, []);

  const loadMedicalData = async () => {
    try {
      const [savedMedicalInfo, history] = await Promise.all([
        EmergencyDB.getMedicalInfo(),
        EmergencyDB.getAlerts(10)
      ]);
      
      if (savedMedicalInfo) {
        setMedicalInfo(savedMedicalInfo);
      }
      
      const medicalAlerts = history.filter(alert => 
        alert.type && alert.type.includes('MEDICAL')
      );
      setEmergencyHistory(medicalAlerts);
    } catch (error) {
      console.error('Failed to load medical data:', error);
    }
  };

  const saveMedicalInfo = async (newInfo) => {
    try {
      setMedicalInfo(newInfo);
      await EmergencyDB.saveMedicalInfo(newInfo);
      await syncManager.queueSyncOperation('MEDICAL_INFO_UPDATE', newInfo);
    } catch (error) {
      console.error('Failed to save medical info:', error);
    }
  };

  const handleInputChange = (field, value) => {
    saveMedicalInfo({
      ...medicalInfo,
      [field]: value
    });
  };

  const triggerMedicalEmergency = async (emergencyType, severity = 'high') => {
    const locationData = location || await EmergencyDB.getSetting('last_known_location');
    
    try {
      const emergencyData = {
        type: `MEDICAL_${emergencyType.toUpperCase()}`,
        severity,
        timestamp: new Date().toISOString(),
        location: locationData,
        medicalInfo: medicalInfo,
        status: offlineMode ? 'PENDING_OFFLINE' : 'ACTIVE'
      };

      // Save to database
      await EmergencyDB.saveAlert(emergencyData);
      
      // Queue for sync
      await syncManager.queueSyncOperation('EMERGENCY_ALERT', emergencyData);

      // Send emergency messages
      await sendMedicalEmergency(emergencyData, emergencyType);

      // Update history
      setEmergencyHistory(prev => [emergencyData, ...prev.slice(0, 9)]);

      // Show confirmation
      showEmergencyConfirmation(emergencyType, offlineMode);

    } catch (error) {
      console.error('Medical emergency failed:', error);
      alert('❌ Failed to trigger medical emergency. Please try again.');
    }
  };

  const sendMedicalEmergency = async (emergencyData, emergencyType) => {
    const locationString = emergencyData.location 
      ? `https://maps.google.com/?q=${emergencyData.location.lat},${emergencyData.location.lng}`
      : 'Location unavailable';

    const emergencyTemplates = {
      cardiac: {
        title: 'CARDIAC EMERGENCY',
        message: 'Heart attack, chest pain, or cardiac arrest emergency'
      },
      breathing: {
        title: 'BREATHING EMERGENCY',
        message: 'Severe breathing difficulty or respiratory distress'
      },
      injury: {
        title: 'TRAUMA EMERGENCY',
        message: 'Serious injury with bleeding or fractures'
      },
      allergic: {
        title: 'ALLERGIC REACTION',
        message: 'Severe allergic reaction or anaphylaxis'
      },
      seizure: {
        title: 'NEUROLOGICAL EMERGENCY',
        message: 'Seizures, stroke, or neurological emergency'
      },
      diabetic: {
        title: 'DIABETIC EMERGENCY',
        message: 'Diabetic emergency - low or high blood sugar'
      }
    };

    const template = emergencyTemplates[emergencyType] || {
      title: 'MEDICAL EMERGENCY',
      message: 'General medical emergency requiring immediate assistance'
    };

    const fullMessage = `🚑 ${template.title}!
${template.message}

Patient Medical Information:
🩸 Blood Type: ${medicalInfo.bloodType || 'Not specified'}
⚠️ Allergies: ${medicalInfo.allergies || 'None listed'}
🎗️ Conditions: ${medicalInfo.conditions || 'None listed'}
💊 Medications: ${medicalInfo.medications || 'None listed'}
🏥 Insurance: ${medicalInfo.insuranceProvider || 'Not specified'}

📍 Location: ${locationString}

📞 Emergency Contact: ${medicalInfo.emergencyContact || 'Not specified'}
👨‍⚕️ Doctor: ${medicalInfo.doctorContact || 'Not specified'}

Please send emergency medical assistance immediately!`;

    if (offlineMode) {
      // Queue for later sending
      await EmergencyDB.queueForSync({
        type: 'MEDICAL_EMERGENCY_SMS',
        data: { 
          message: fullMessage,
          emergencyType,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Send to emergency services
      window.location.href = `sms:911?body=${encodeURIComponent(fullMessage)}`;
      
      // Send to emergency contact if available
      if (medicalInfo.emergencyContact) {
        setTimeout(() => {
          window.location.href = `sms:${medicalInfo.emergencyContact}?body=${encodeURIComponent(fullMessage)}`;
        }, 1000);
      }
    }
  };

  const showEmergencyConfirmation = (emergencyType, isOffline) => {
    const confirmationMessage = isOffline 
      ? `📱 Medical emergency saved offline. Will auto-send when connection is restored.\n\nType: ${emergencyType.toUpperCase()}`
      : `✅ Medical emergency alert sent!\n\nType: ${emergencyType.toUpperCase()}`;
    
    alert(confirmationMessage);
  };

  const emergencyTypes = [
    { 
      type: 'cardiac', 
      label: '💓 Cardiac', 
      description: 'Heart attack, chest pain, cardiac arrest',
      severity: 'critical'
    },
    { 
      type: 'breathing', 
      label: '🌬️ Breathing', 
      description: 'Asthma, choking, respiratory distress',
      severity: 'critical'
    },
    { 
      type: 'injury', 
      label: '🩸 Trauma', 
      description: 'Severe bleeding, fractures, head injury',
      severity: 'high'
    },
    { 
      type: 'allergic', 
      label: '⚠️ Allergic', 
      description: 'Anaphylaxis, severe allergy response',
      severity: 'critical'
    },
    { 
      type: 'seizure', 
      label: '⚡ Neurological', 
      description: 'Seizures, stroke, paralysis',
      severity: 'high'
    },
    { 
      type: 'diabetic', 
      label: '🩺 Diabetic', 
      description: 'Low/high blood sugar emergency',
      severity: 'high'
    }
  ];

  const hasMedicalInfo = Object.values(medicalInfo).some(val => val && val.trim() !== '');

  return (
    <div style={styles.medicalContainer}>
      <div style={styles.medicalHeader}>
        <span style={styles.medicalIcon}>🚑</span>
        <h2 style={styles.medicalTitle}>Medical Emergency</h2>
        {offlineMode && <span style={styles.offlineBadge}>📵 OFFLINE</span>}
      </div>

      {offlineMode && (
        <div style={styles.offlineWarning}>
          <strong>Offline Medical Mode</strong>
          <div style={styles.offlineStatus}>
            Emergencies saved locally • Auto-send when online
          </div>
        </div>
      )}

      {/* Medical Information Section */}
      <div style={styles.medicalInfoSection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>📋 Medical Information</h3>
          <button 
            style={styles.editButton}
            onClick={() => setIsEditing(!isEditing)}
            aria-label={isEditing ? 'Save medical information' : 'Edit medical information'}
          >
            {isEditing ? '💾 Save' : '✏️ Edit'}
          </button>
        </div>

        {!hasMedicalInfo && !isEditing && (
          <div style={styles.setupPrompt}>
            <p>⚠️ No medical information set up</p>
            <button 
              style={styles.setupButton}
              onClick={() => setIsEditing(true)}
            >
              Set Up Medical Info
            </button>
          </div>
        )}

        <div style={styles.medicalForm}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Blood Type</label>
              <select
                value={medicalInfo.bloodType}
                onChange={(e) => handleInputChange('bloodType', e.target.value)}
                style={styles.select}
                disabled={!isEditing}
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Allergies</label>
              <input
                type="text"
                placeholder="Food, drug, environmental allergies"
                value={medicalInfo.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Medical Conditions</label>
              <input
                type="text"
                placeholder="Chronic conditions, disabilities"
                value={medicalInfo.conditions}
                onChange={(e) => handleInputChange('conditions', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Current Medications</label>
              <input
                type="text"
                placeholder="Prescription and OTC medications"
                value={medicalInfo.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Emergency Contact</label>
              <input
                type="tel"
                placeholder="Primary emergency contact number"
                value={medicalInfo.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Insurance Provider</label>
              <input
                type="text"
                placeholder="Health insurance company"
                value={medicalInfo.insuranceProvider}
                onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Doctor Contact</label>
              <input
                type="tel"
                placeholder="Primary care physician"
                value={medicalInfo.doctorContact}
                onChange={(e) => handleInputChange('doctorContact', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Pharmacy Contact</label>
              <input
                type="tel"
                placeholder="Preferred pharmacy"
                value={medicalInfo.pharmacyContact}
                onChange={(e) => handleInputChange('pharmacyContact', e.target.value)}
                style={styles.input}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {!isEditing && hasMedicalInfo && (
          <div style={styles.medicalSummary}>
            <h4 style={styles.summaryTitle}>Your Medical Summary</h4>
            <div style={styles.summaryGrid}>
              {medicalInfo.bloodType && (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryIcon}>🩸</span>
                  <span>Blood Type: {medicalInfo.bloodType}</span>
                </div>
              )}
              {medicalInfo.allergies && (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryIcon}>⚠️</span>
                  <span>Allergies: {medicalInfo.allergies}</span>
                </div>
              )}
              {medicalInfo.conditions && (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryIcon}>🎗️</span>
                  <span>Conditions: {medicalInfo.conditions}</span>
                </div>
              )}
              {medicalInfo.medications && (
                <div style={styles.summaryItem}>
                  <span style={styles.summaryIcon}>💊</span>
                  <span>Medications: {medicalInfo.medications}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Buttons */}
      <div style={styles.emergencySection}>
        <h3 style={styles.sectionTitle}>🚨 Emergency Types</h3>
        <div style={styles.emergencyGrid}>
          {emergencyTypes.map((emergency) => (
            <button
              key={emergency.type}
              style={{
                ...styles.emergencyButton,
                ...(emergency.severity === 'critical' && styles.criticalButton),
                ...(offlineMode && styles.offlineButton)
              }}
              onClick={() => triggerMedicalEmergency(emergency.type, emergency.severity)}
              aria-label={`Trigger ${emergency.type} emergency`}
            >
              <span style={styles.emergencyIcon}>{emergency.label.split(' ')[0]}</span>
              <span style={styles.emergencyLabel}>
                {emergency.label.replace(/^[^\s]+\s/, '')}
              </span>
              <span style={styles.emergencyDescription}>
                {emergency.description}
              </span>
              {offlineMode && <span style={styles.offlineTag}>📵</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Emergency History */}
      {emergencyHistory.length > 0 && (
        <div style={styles.historySection}>
          <h3 style={styles.sectionTitle}>📜 Recent Emergencies</h3>
          <div style={styles.historyList}>
            {emergencyHistory.slice(0, 5).map((emergency, index) => (
              <div key={index} style={styles.historyItem}>
                <div style={styles.historyMain}>
                  <span style={styles.historyType}>
                    {emergency.type?.replace('MEDICAL_', '')}
                  </span>
                  <span style={styles.historyTime}>
                    {new Date(emergency.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <span style={styles.historyStatus}>
                  {emergency.status === 'PENDING_OFFLINE' ? '🔄 Pending' : '✅ Sent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  medicalContainer: {
    background: 'rgba(45, 45, 45, 0.95)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  medicalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    justifyContent: 'space-between'
  },
  medicalIcon: { fontSize: '28px' },
  medicalTitle: { margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold', flex: 1 },
  offlineBadge: {
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
  medicalInfoSection: {
    background: 'rgba(30, 30, 30, 0.8)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: { color: 'white', margin: 0, fontSize: '18px' },
  editButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.2s'
  },
  setupPrompt: {
    textAlign: 'center',
    padding: '20px',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  setupButton: {
    background: '#f59e0b',
    color: 'black',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '8px',
    fontWeight: 'bold'
  },
  medicalForm: { marginBottom: '16px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: 'white', fontSize: '14px', fontWeight: 'bold' },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #555',
    background: '#333',
    color: 'white',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #555',
    background: '#333',
    color: 'white',
    fontSize: '14px'
  },
  medicalSummary: {
    background: 'rgba(59, 130, 246, 0.1)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #3b82f6'
  },
  summaryTitle: { color: '#3b82f6', margin: '0 0 12px 0', fontSize: '16px' },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'white',
    fontSize: '14px'
  },
  summaryIcon: { fontSize: '16px' },
  emergencySection: { marginBottom: '20px' },
  emergencyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '16px'
  },
  emergencyButton: {
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: 'white',
    border: 'none',
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'all 0.2s',
    position: 'relative'
  },
  criticalButton: {
    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
    border: '2px solid #ef4444'
  },
  offlineButton: { opacity: 0.9 },
  emergencyIcon: { fontSize: '20px', marginBottom: '4px' },
  emergencyLabel: { fontSize: '14px', fontWeight: 'bold' },
  emergencyDescription: { fontSize: '11px', opacity: 0.9, lineHeight: '1.3' },
  offlineTag: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    fontSize: '12px'
  },
  historySection: {
    background: 'rgba(30, 30, 30, 0.8)',
    borderRadius: '12px',
    padding: '16px'
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px'
  },
  historyMain: { display: 'flex', flexDirection: 'column', gap: '4px' },
  historyType: { color: 'white', fontSize: '14px', fontWeight: 'bold' },
  historyTime: { color: '#9ca3af', fontSize: '12px' },
  historyStatus: { 
    color: '#10b981', 
    fontSize: '12px',
    background: 'rgba(16, 185, 129, 0.2)',
    padding: '4px 8px',
    borderRadius: '12px'
  }
};

// Add hover effects
Object.assign(styles.editButton, {
  ':hover': { backgroundColor: '#2563eb' }
});

Object.assign(styles.emergencyButton, {
  ':hover': { 
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  }
});

Object.assign(styles.setupButton, {
  ':hover': { backgroundColor: '#d97706' }
});

export default MedicalEmergency;