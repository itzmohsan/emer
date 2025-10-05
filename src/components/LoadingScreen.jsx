import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring delay-1"></div>
          <div className="spinner-ring delay-2"></div>
        </div>
        <div className="loading-text">
          <h2>Bachaoo Emergency</h2>
          <p>Loading emergency services...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;