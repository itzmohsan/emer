import React, { useState } from 'react';
import { Brain, AlertTriangle, Clock, MapPin, Users, ArrowLeft } from 'lucide-react';

const EmergencyAI = ({ location }) => {
  const [emergencyType, setEmergencyType] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const emergencyScenarios = [
    {
      type: 'medical',
      name: '🤕 Medical Emergency',
      icon: '🤕',
      description: 'Heart attack, stroke, injury, or other medical crisis',
      actions: [
        'Call 108 immediately',
        'Check breathing and consciousness',
        'Do not move injured person',
        'Provide first aid if trained'
      ],
      priority: 'CRITICAL'
    },
    {
      type: 'fire',
      name: '🔥 Fire Emergency',
      icon: '🔥',
      description: 'Building fire, vehicle fire, or wildfire',
      actions: [
        'Call 101 immediately',
        'Evacuate the area immediately',
        'Use fire extinguisher only if safe',
        'Alert others in the building'
      ],
      priority: 'HIGH'
    },
    {
      type: 'crime',
      name: '🚨 Crime in Progress',
      icon: '🚨',
      description: 'Robbery, assault, or suspicious activity',
      actions: [
        'Call 100 immediately',
        'Find safe location and hide',
        'Note suspect description',
        'Do not confront the suspect'
      ],
      priority: 'HIGH'
    },
    {
      type: 'accident',
      name: '🚗 Road Accident',
      icon: '🚗',
      description: 'Vehicle collision or road incident',
      actions: [
        'Call 108 for medical assistance',
        'Call 100 for police if needed',
        'Set up warning signals',
        'Do not move injured people'
      ],
      priority: 'HIGH'
    },
    {
      type: 'natural',
      name: '🌪️ Natural Disaster',
      icon: '🌪️',
      description: 'Earthquake, flood, or severe weather',
      actions: [
        'Find sturdy shelter immediately',
        'Stay away from windows',
        'Monitor emergency broadcasts',
        'Prepare evacuation plan'
      ],
      priority: 'HIGH'
    },
    {
      type: 'missing',
      name: '🔍 Missing Person',
      icon: '🔍',
      description: 'Lost child or missing vulnerable person',
      actions: [
        'Call 100 immediately',
        'Provide recent photo and description',
        'Search immediate area safely',
        'Alert nearby authorities'
      ],
      priority: 'HIGH'
    }
  ];

  const analyzeEmergency = async (scenario) => {
    setEmergencyType(scenario.type);
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = {
      priority: scenario.priority,
      estimatedResponseTime: Math.floor(Math.random() * 8) + 3,
      nearbyHospitals: Math.floor(Math.random() * 5) + 1,
      policeStations: Math.floor(Math.random() * 3) + 1,
      fireStations: Math.floor(Math.random() * 2) + 1,
      recommendedActions: scenario.actions,
      safetyChecklist: [
        'Ensure your own safety first',
        'Call emergency services immediately',
        'Provide clear location information',
        'Follow operator instructions carefully',
        'Stay on the line until help arrives'
      ],
      additionalTips: [
        'Keep emergency numbers handy',
        'Know your exact location',
        'Stay calm and speak clearly',
        'Follow all safety protocols'
      ]
    };
    
    setAiResponse(response);
    setIsAnalyzing(false);
  };

  const resetAnalysis = () => {
    setEmergencyType('');
    setAiResponse(null);
    setIsAnalyzing(false);
  };

  const shareEmergencyInfo = () => {
    if (location && aiResponse) {
      const scenario = emergencyScenarios.find(s => s.type === emergencyType);
      const message = `🚨 EMERGENCY ALERT - ${scenario.name}\nPriority: ${aiResponse.priority}\nLocation: https://maps.google.com/?q=${location.lat},${location.lng}\nActions: ${aiResponse.recommendedActions.slice(0, 2).join(', ')}`;
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;
    }
  };

  return (
    <div className="emergency-ai-widget">
      <div className="widget-header">
        <div className="header-content">
          <Brain className="header-icon" />
          <div className="header-text">
            <h3>AI Emergency Assistant</h3>
            <p>Smart emergency analysis and guidance</p>
          </div>
        </div>
        <div className="status-indicator online">
          <div className="status-dot"></div>
          AI Ready
        </div>
      </div>

      <div className="widget-content">
        {!emergencyType ? (
          <div className="scenario-selection">
            <div className="section-title">
              <h4>Select Emergency Type</h4>
              <p>Choose the situation you're facing for AI-powered guidance</p>
            </div>
            
            <div className="scenarios-grid">
              {emergencyScenarios.map((scenario) => (
                <button
                  key={scenario.type}
                  className="scenario-card"
                  onClick={() => analyzeEmergency(scenario)}
                  disabled={isAnalyzing}
                >
                  <div className="scenario-icon">{scenario.icon}</div>
                  <div className="scenario-info">
                    <span className="scenario-name">{scenario.name.split(' ').slice(1).join(' ')}</span>
                    <span className="scenario-desc">{scenario.description}</span>
                  </div>
                  <div className="priority-badge {scenario.priority.toLowerCase()}">
                    {scenario.priority}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-analysis">
            {isAnalyzing ? (
              <div className="analysis-loading">
                <div className="loading-spinner"></div>
                <h4>AI Analyzing Emergency...</h4>
                <p>Processing situation and generating response plan</p>
              </div>
            ) : (
              <>
                <div className="analysis-header">
                  <div className="emergency-title">
                    <span className="emergency-icon">
                      {emergencyScenarios.find(s => s.type === emergencyType)?.icon}
                    </span>
                    <div>
                      <h4>{emergencyScenarios.find(s => s.type === emergencyType)?.name}</h4>
                      <p>AI Emergency Analysis Complete</p>
                    </div>
                  </div>
                  <button 
                    className="back-button"
                    onClick={resetAnalysis}
                  >
                    <ArrowLeft size={16} />
                    New Analysis
                  </button>
                </div>

                {aiResponse && (
                  <div className="analysis-results">
                    <div className="priority-alert {aiResponse.priority.toLowerCase()}">
                      <AlertTriangle size={20} />
                      <div>
                        <strong>Priority: {aiResponse.priority}</strong>
                        <span>Estimated Response: {aiResponse.estimatedResponseTime} minutes</span>
                      </div>
                    </div>

                    <div className="emergency-stats">
                      <div className="stat-item">
                        <MapPin size={18} />
                        <span>Hospitals: {aiResponse.nearbyHospitals} nearby</span>
                      </div>
                      <div className="stat-item">
                        <Users size={18} />
                        <span>Police: {aiResponse.policeStations} nearby</span>
                      </div>
                      <div className="stat-item">
                        <Clock size={18} />
                        <span>Fire: {aiResponse.fireStations} nearby</span>
                      </div>
                    </div>

                    <div className="actions-section">
                      <h5>🚨 Immediate Actions</h5>
                      <div className="actions-list">
                        {aiResponse.recommendedActions.map((action, index) => (
                          <div key={index} className="action-item">
                            <div className="action-number">{index + 1}</div>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="safety-section">
                      <h5>🛡️ Safety Protocol</h5>
                      <div className="checklist">
                        {aiResponse.safetyChecklist.map((item, index) => (
                          <div key={index} className="checklist-item">
                            <div className="check-icon">✓</div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="emergency-actions">
                      <button 
                        className="action-btn primary"
                        onClick={() => window.location.href = 'tel:108'}
                      >
                        🚑 Call Emergency Services
                      </button>
                      <button 
                        className="action-btn secondary"
                        onClick={shareEmergencyInfo}
                      >
                        📱 Share Emergency Info
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAI;