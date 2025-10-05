import React, { useState, useEffect } from 'react';

const EmergencyContacts = ({ location }) => {
  const [contacts, setContacts] = useState([
    { 
      id: 1, 
      name: 'Family Member', 
      phone: '+1234567890', 
      relationship: 'Family',
      priority: 'high',
      enabled: true,
      lastNotified: null
    },
    { 
      id: 2, 
      name: 'Close Friend', 
      phone: '+1234567891', 
      relationship: 'Friend',
      priority: 'medium',
      enabled: true,
      lastNotified: null
    },
    { 
      id: 3, 
      name: 'Emergency Contact', 
      phone: '+1234567892', 
      relationship: 'Emergency',
      priority: 'high',
      enabled: true,
      lastNotified: null
    }
  ]);

  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: 'Family',
    priority: 'medium'
  });
  const [isAdding, setIsAdding] = useState(false);

  const notifyAllContacts = (message) => {
    const enabledContacts = contacts.filter(contact => contact.enabled);
    
    if (enabledContacts.length === 0) {
      alert('No enabled contacts to notify');
      return;
    }

    let notificationCount = 0;
    
    enabledContacts.forEach((contact, index) => {
      setTimeout(() => {
        const updatedContacts = contacts.map(c => 
          c.id === contact.id ? { ...c, lastNotified: new Date() } : c
        );
        setContacts(updatedContacts);
        
        window.location.href = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        notificationCount++;
        
        if (notificationCount === enabledContacts.length) {
          alert(`✅ Notified ${notificationCount} emergency contacts`);
        }
      }, index * 1000); // Stagger notifications by 1 second
    });
  };

  const testNotification = () => {
    const testMessage = location 
      ? `🔔 TEST: Emergency system check. My location: https://maps.google.com/?q=${location.lat},${location.lng}`
      : `🔔 TEST: Emergency system check. Location unavailable.`;
    
    notifyAllContacts(testMessage);
  };

  const emergencyNotify = () => {
    const emergencyMessage = location
      ? `🚨 EMERGENCY! I need immediate assistance! My location: https://maps.google.com/?q=${location.lat},${location.lng}`
      : `🚨 EMERGENCY! I need immediate assistance! Location unavailable.`;
    
    if (confirm('🚨 Send emergency alert to all enabled contacts?')) {
      notifyAllContacts(emergencyMessage);
    }
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      alert('Please fill in name and phone number');
      return;
    }

    const contact = {
      id: Date.now(),
      ...newContact,
      enabled: true,
      lastNotified: null
    };

    setContacts(prev => [...prev, contact]);
    setNewContact({ name: '', phone: '', relationship: 'Family', priority: 'medium' });
    setIsAdding(false);
  };

  const toggleContact = (id) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === id ? { ...contact, enabled: !contact.enabled } : contact
      )
    );
  };

  const deleteContact = (id) => {
    if (confirm('Delete this emergency contact?')) {
      setContacts(prev => prev.filter(contact => contact.id !== id));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  const enabledContactsCount = contacts.filter(c => c.enabled).length;

  return (
    <div style={styles.contactsContainer}>
      <div style={styles.contactsHeader}>
        <span style={styles.contactsIcon}>👥</span>
        <h3 style={styles.contactsTitle}>Emergency Contact Network</h3>
        <div style={styles.contactsStats}>
          <span style={styles.statsText}>{enabledContactsCount}/{contacts.length} enabled</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <button 
          style={styles.testBtn}
          onClick={testNotification}
          disabled={enabledContactsCount === 0}
        >
          <span style={styles.btnIcon}>🔔</span>
          Test Notification
        </button>
        <button 
          style={styles.emergencyBtn}
          onClick={emergencyNotify}
          disabled={enabledContactsCount === 0}
        >
          <span style={styles.btnIcon}>🚨</span>
          Emergency Alert
        </button>
      </div>

      {/* Contacts List */}
      <div style={styles.contactsList}>
        <div style={styles.listHeader}>
          <h4 style={styles.listTitle}>Emergency Contacts</h4>
          <button 
            style={styles.addBtn}
            onClick={() => setIsAdding(true)}
          >
            + Add Contact
          </button>
        </div>

        {contacts.map(contact => (
          <div 
            key={contact.id} 
            style={{
              ...styles.contactItem,
              ...(!contact.enabled && styles.contactDisabled)
            }}
          >
            <div style={styles.contactMain}>
              <div style={styles.contactInfo}>
                <div style={styles.contactHeader}>
                  <span style={styles.contactName}>{contact.name}</span>
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: getPriorityColor(contact.priority)
                  }}>
                    {getPriorityIcon(contact.priority)} {contact.priority}
                  </span>
                </div>
                <span style={styles.contactPhone}>{contact.phone}</span>
                <span style={styles.contactRelationship}>{contact.relationship}</span>
                {contact.lastNotified && (
                  <span style={styles.lastNotified}>
                    Last notified: {contact.lastNotified.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <div style={styles.contactActions}>
                <button 
                  style={
                    contact.enabled ? styles.toggleBtnOn : styles.toggleBtnOff
                  }
                  onClick={() => toggleContact(contact.id)}
                  title={contact.enabled ? 'Disable' : 'Enable'}
                >
                  {contact.enabled ? '✅' : '❌'}
                </button>
                <button 
                  style={styles.deleteBtn}
                  onClick={() => deleteContact(contact.id)}
                  title="Delete contact"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div style={styles.noContacts}>
            <span style={styles.noContactsIcon}>👥</span>
            <p>No emergency contacts added</p>
            <p style={styles.noContactsSub}>Add contacts to enable emergency notifications</p>
          </div>
        )}
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <div style={styles.addForm}>
          <h4 style={styles.formTitle}>Add Emergency Contact</h4>
          
          <div style={styles.formGroup}>
            <input
              type="text"
              placeholder="Contact Name"
              value={newContact.name}
              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <input
              type="tel"
              placeholder="Phone Number"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Relationship</label>
              <select 
                value={newContact.relationship}
                onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                style={styles.formSelect}
              >
                <option value="Family">Family</option>
                <option value="Friend">Friend</option>
                <option value="Emergency">Emergency</option>
                <option value="Medical">Medical</option>
                <option value="Work">Work</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Priority</label>
              <select 
                value={newContact.priority}
                onChange={(e) => setNewContact(prev => ({ ...prev, priority: e.target.value }))}
                style={styles.formSelect}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={styles.formActions}>
            <button 
              style={styles.cancelBtn}
              onClick={() => {
                setIsAdding(false);
                setNewContact({ name: '', phone: '', relationship: 'Family', priority: 'medium' });
              }}
            >
              Cancel
            </button>
            <button 
              style={styles.saveBtn}
              onClick={addContact}
            >
              Save Contact
            </button>
          </div>
        </div>
      )}

      {/* Emergency Instructions */}
      <div style={styles.instructions}>
        <h4 style={styles.instructionsTitle}>📋 Emergency Protocol</h4>
        <ul style={styles.instructionsList}>
          <li style={styles.instructionItem}>
            <strong>Test Notification:</strong> Sends a test message to all enabled contacts
          </li>
          <li style={styles.instructionItem}>
            <strong>Emergency Alert:</strong> Sends urgent emergency message with your location
          </li>
          <li style={styles.instructionItem}>
            <strong>Priority Levels:</strong> High (immediate), Medium (important), Low (informational)
          </li>
          <li style={styles.instructionItem}>
            <strong>Best Practice:</strong> Keep at least 2-3 emergency contacts enabled
          </li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  contactsContainer: {
    background: 'rgba(45, 45, 45, 0.9)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  contactsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'space-between'
  },
  contactsIcon: {
    fontSize: '24px'
  },
  contactsTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px',
    flex: 1
  },
  contactsStats: {
    background: 'rgba(0,0,0,0.3)',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#a0a0a0'
  },
  statsText: {
    fontSize: '12px'
  },
  quickActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px'
  },
  testBtn: {
    background: 'rgba(59, 130, 246, 0.2)',
    border: '1px solid #3b82f6',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  emergencyBtn: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid #ef4444',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  btnIcon: {
    fontSize: '16px'
  },
  contactsList: {
    marginBottom: '20px'
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  listTitle: {
    margin: 0,
    color: 'white',
    fontSize: '18px'
  },
  addBtn: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  contactItem: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid #333'
  },
  contactDisabled: {
    opacity: 0.5,
    background: 'rgba(0, 0, 0, 0.1)'
  },
  contactMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '15px'
  },
  contactInfo: {
    flex: 1
  },
  contactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  contactName: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  priorityBadge: {
    fontSize: '10px',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '8px',
    textTransform: 'uppercase'
  },
  contactPhone: {
    display: 'block',
    color: '#a0a0a0',
    fontSize: '14px',
    marginBottom: '4px'
  },
  contactRelationship: {
    display: 'block',
    color: '#6b7280',
    fontSize: '12px',
    marginBottom: '4px'
  },
  lastNotified: {
    display: 'block',
    color: '#10b981',
    fontSize: '11px',
    fontStyle: 'italic'
  },
  contactActions: {
    display: 'flex',
    gap: '8px'
  },
  toggleBtnOn: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px'
  },
  toggleBtnOff: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px'
  },
  noContacts: {
    textAlign: 'center',
    color: '#a0a0a0',
    padding: '40px 20px'
  },
  noContactsIcon: {
    fontSize: '48px',
    marginBottom: '10px',
    opacity: 0.5
  },
  noContactsSub: {
    fontSize: '12px',
    marginTop: '5px',
    opacity: 0.7
  },
  addForm: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #333'
  },
  formTitle: {
    margin: '0 0 15px 0',
    color: 'white',
    fontSize: '16px'
  },
  formGroup: {
    marginBottom: '12px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '12px'
  },
  formLabel: {
    display: 'block',
    color: '#a0a0a0',
    fontSize: '12px',
    marginBottom: '4px'
  },
  formInput: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid #666',
    color: 'white',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px'
  },
  formSelect: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid #666',
    color: 'white',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '14px'
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px'
  },
  cancelBtn: {
    flex: 1,
    background: 'none',
    border: '1px solid #666',
    color: 'white',
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  saveBtn: {
    flex: 1,
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  instructions: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  instructionsTitle: {
    margin: '0 0 10px 0',
    color: 'white',
    fontSize: '16px'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '15px'
  },
  instructionItem: {
    color: '#a0a0a0',
    fontSize: '12px',
    marginBottom: '6px',
    lineHeight: '1.4'
  }
};

export default EmergencyContacts;