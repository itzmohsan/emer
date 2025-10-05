import React, { useState } from 'react';

const DisasterPreparedness = ({ location }) => {
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [checklistProgress, setChecklistProgress] = useState({});

  const disasterTypes = [
    {
      id: 'earthquake',
      name: '🌋 Earthquake',
      color: '#f59e0b',
      checklist: [
        'Drop, Cover, and Hold On',
        'Stay away from windows',
        'Do not use elevators',
        'Check for gas leaks',
        'Be prepared for aftershocks',
        'Listen to emergency broadcasts'
      ],
      immediateActions: [
        'Protect yourself immediately',
        'Move to a safe location',
        'Check for injuries',
        'Evacuate if building is damaged'
      ],
      emergencyNumbers: ['100', '108', '101']
    },
    {
      id: 'flood',
      name: '🌊 Flood',
      color: '#3b82f6',
      checklist: [
        'Move to higher ground',
        'Do not walk through moving water',
        'Turn off electricity at main switch',
        'Evacuate if instructed',
        'Avoid driving in flood areas',
        'Stay away from power lines'
      ],
      immediateActions: [
        'Evacuate to safe location',
        'Avoid flood waters',
        'Do not drive through flooded areas',
        'Listen to weather alerts'
      ],
      emergencyNumbers: ['100', '108', '101']
    },
    {
      id: 'fire',
      name: '🔥 Fire',
      color: '#ef4444',
      checklist: [
        'Alert others and evacuate immediately',
        'Use stairs, not elevators',
        'Check doors for heat before opening',
        'Stay low to avoid smoke',
        'Use fire extinguisher if safe',
        'Meet at designated safe area'
      ],
      immediateActions: [
        'Evacuate immediately',
        'Call fire department',
        'Alert neighbors',
        'Do not re-enter building'
      ],
      emergencyNumbers: ['101', '100', '108']
    },
    {
      id: 'medical',
      name: '🚑 Medical Emergency',
      color: '#dc2626',
      checklist: [
        'Check ABC (Airway, Breathing, Circulation)',
        'Call emergency medical services',
        'Perform CPR if trained',
        'Control bleeding with pressure',
        'Do not move injured person unnecessarily',
        'Keep person warm and comfortable'
      ],
      immediateActions: [
        'Call ambulance immediately',
        'Provide first aid',
        'Stay with the person',
        'Prepare medical information'
      ],
      emergencyNumbers: ['108', '100']
    }
  ];

  const survivalGuides = [
    {
      title: 'Emergency Kit Essentials',
      items: [
        '📱 Charged power bank and cables',
        '💧 Bottled water (1 gallon per person per day)',
        '🍫 Non-perishable food (3-day supply)',
        '💊 First aid kit and medications',
        '🔦 Flashlight with extra batteries',
        '📻 Battery-powered radio',
        '📄 Important documents copies',
        '💰 Cash in small denominations',
        '🧥 Warm clothing and blankets',
        '🧴 Personal hygiene items'
      ]
    },
    {
      title: 'Emergency Communication Plan',
      items: [
        '📞 Designate emergency contacts',
        '📍 Identify meeting locations',
        '📱 Keep phones charged',
        '📶 Have backup communication methods',
        '👥 Inform family of your plans',
        '🏠 Know evacuation routes',
        '🆘 Learn emergency signals',
        '📋 Practice your plan regularly'
      ]
    },
    {
      title: 'First Aid Basics',
      items: [
        '🩹 Learn CPR and basic first aid',
        '💊 Know how to use your first aid kit',
        '🩸 Learn to control bleeding',
        '🔥 Treat for shock',
        '🦴 Immobilize fractures',
        '🌡️ Recognize signs of distress',
        '🚰 Know when to seek medical help',
        '📞 Keep emergency numbers handy'
      ]
    }
  ];

  const toggleChecklistItem = (disasterId, itemIndex) => {
    const key = `${disasterId}-${itemIndex}`;
    setChecklistProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getChecklistProgress = (disasterId) => {
    const totalItems = disasterTypes.find(d => d.id === disasterId)?.checklist.length || 0;
    const completedItems = disasterTypes.find(d => d.id === disasterId)?.checklist.filter((_, index) => 
      checklistProgress[`${disasterId}-${index}`]
    ).length || 0;
    
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const sendEmergencyAlert = (disaster) => {
    const message = location
      ? `🚨 ${disaster.name.toUpperCase()} EMERGENCY! Following emergency protocol. My location: https://maps.google.com/?q=${location.lat},${location.lng}`
      : `🚨 ${disaster.name.toUpperCase()} EMERGENCY! Following emergency protocol. Location unavailable.`;
    
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    
    // Auto-dial primary emergency number after a delay
    setTimeout(() => {
      window.location.href = `tel:${disaster.emergencyNumbers[0]}`;
    }, 2000);
  };

  const resetChecklist = (disasterId) => {
    const newProgress = { ...checklistProgress };
    disasterTypes.find(d => d.id === disasterId)?.checklist.forEach((_, index) => {
      delete newProgress[`${disasterId}-${index}`];
    });
    setChecklistProgress(newProgress);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>🛡️</span>
        <h3 style={styles.headerTitle}>Disaster Preparedness</h3>
      </div>

      {/* Disaster Type Selection */}
      <div style={styles.disasterGrid}>
        {disasterTypes.map(disaster => (
          <button
            key={disaster.id}
            style={{
              ...styles.disasterBtn,
              borderColor: disaster.color,
              ...(activeDisaster?.id === disaster.id && { backgroundColor: `${disaster.color}20` })
            }}
            onClick={() => setActiveDisaster(disaster)}
          >
            <span style={styles.disasterIcon}>{disaster.name.split(' ')[0]}</span>
            <span style={styles.disasterName}>{disaster.name.split(' ').slice(1).join(' ')}</span>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${getChecklistProgress(disaster.id)}%`,
                  backgroundColor: disaster.color
                }}
              ></div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Disaster Guide */}
      {activeDisaster && (
        <div style={styles.disasterGuide}>
          <div style={styles.guideHeader}>
            <div style={styles.guideTitleSection}>
              <span style={styles.guideIcon}>{activeDisaster.name.split(' ')[0]}</span>
              <h4 style={styles.guideTitle}>{activeDisaster.name} Emergency Guide</h4>
            </div>
            <button 
              style={styles.closeBtn}
              onClick={() => setActiveDisaster(null)}
            >
              ✕
            </button>
          </div>

          {/* Immediate Actions */}
          <div style={styles.section}>
            <h5 style={styles.sectionTitle}>🚨 Immediate Actions</h5>
            <div style={styles.actionsList}>
              {activeDisaster.immediateActions.map((action, index) => (
                <div key={index} style={styles.actionItem}>
                  <span style={styles.actionNumber}>{index + 1}</span>
                  <span style={styles.actionText}>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Checklist */}
          <div style={styles.section}>
            <div style={styles.checklistHeader}>
              <h5 style={styles.sectionTitle}>📋 Emergency Checklist</h5>
              <button 
                style={styles.resetBtn}
                onClick={() => resetChecklist(activeDisaster.id)}
              >
                🔄 Reset
              </button>
            </div>
            <div style={styles.checklist}>
              {activeDisaster.checklist.map((item, index) => {
                const isChecked = checklistProgress[`${activeDisaster.id}-${index}`];
                return (
                  <div 
                    key={index}
                    style={{
                      ...styles.checklistItem,
                      ...(isChecked && styles.checklistItemChecked)
                    }}
                    onClick={() => toggleChecklistItem(activeDisaster.id, index)}
                  >
                    <span style={styles.checkbox}>
                      {isChecked ? '✅' : '⬜'}
                    </span>
                    <span style={styles.checklistText}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div style={styles.section}>
            <h5 style={styles.sectionTitle}>📞 Emergency Numbers</h5>
            <div style={styles.emergencyNumbers}>
              {activeDisaster.emergencyNumbers.map((number, index) => (
                <button
                  key={index}
                  style={styles.emergencyBtn}
                  onClick={() => window.location.href = `tel:${number}`}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Alert Button */}
          <button 
            style={{
              ...styles.alertBtn,
              backgroundColor: activeDisaster.color
            }}
            onClick={() => sendEmergencyAlert(activeDisaster)}
          >
            🚨 Send Emergency Alert
          </button>
        </div>
      )}

      {/* Survival Guides */}
      <div style={styles.guidesSection}>
        <h4 style={styles.guidesTitle}>📚 Survival Guides</h4>
        <div style={styles.guidesGrid}>
          {survivalGuides.map((guide, index) => (
            <div key={index} style={styles.guideCard}>
              <h5 style={styles.guideCardTitle}>{guide.title}</h5>
              <ul style={styles.guideList}>
                {guide.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={styles.guideListItem}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Preparedness Tips */}
      <div style={styles.tipsSection}>
        <h4 style={styles.tipsTitle}>💡 Emergency Preparedness Tips</h4>
        <div style={styles.tipsGrid}>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>🕒</span>
            <span>Practice your emergency plan regularly</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>📱</span>
            <span>Keep emergency numbers saved and accessible</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>🔋</span>
            <span>Maintain emergency kit with fresh supplies</span>
          </div>
          <div style={styles.tipItem}>
            <span style={styles.tipIcon}>🗺️</span>
            <span>Know your evacuation routes and shelters</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: 'rgba(45, 45, 45, 0.9)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '2px solid #333'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  headerIcon: {
    fontSize: '24px'
  },
  headerTitle: {
    margin: 0,
    color: 'white',
    fontSize: '20px'
  },
  disasterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px'
  },
  disasterBtn: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: '2px solid',
    color: 'white',
    padding: '15px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  disasterIcon: {
    fontSize: '24px'
  },
  disasterName: {
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    background: '#333',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease'
  },
  disasterGuide: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid #444'
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  guideTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  guideIcon: {
    fontSize: '24px'
  },
  guideTitle: {
    margin: 0,
    color: 'white',
    fontSize: '18px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '5px'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    marginBottom: '12px',
    color: 'white'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  actionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px'
  },
  actionNumber: {
    background: '#ef4444',
    color: 'white',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  actionText: {
    color: 'white',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  checklistHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  resetBtn: {
    background: 'none',
    border: '1px solid #666',
    color: '#a0a0a0',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  checklistItemChecked: {
    opacity: 0.6,
    background: 'rgba(0, 0, 0, 0.1)'
  },
  checkbox: {
    fontSize: '16px',
    flexShrink: 0,
    marginTop: '2px'
  },
  checklistText: {
    color: 'white',
    fontSize: '14px',
    lineHeight: '1.4',
    flex: 1
  },
  emergencyNumbers: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  emergencyBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  alertBtn: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    width: '100%',
    marginTop: '10px'
  },
  guidesSection: {
    marginBottom: '20px'
  },
  guidesTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: 'white'
  },
  guidesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  guideCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  guideCardTitle: {
    margin: '0 0 12px 0',
    color: 'white',
    fontSize: '16px'
  },
  guideList: {
    margin: 0,
    paddingLeft: '15px'
  },
  guideListItem: {
    color: '#a0a0a0',
    fontSize: '13px',
    marginBottom: '6px',
    lineHeight: '1.4'
  },
  tipsSection: {
    marginTop: '10px'
  },
  tipsTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: 'white'
  },
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  tipItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    color: 'white'
  },
  tipIcon: {
    fontSize: '16px',
    flexShrink: 0
  }
};

export default DisasterPreparedness;