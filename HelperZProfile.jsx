import React from 'react';

const HelperZProfile = ({ user, location }) => {
  return (
    <div className="helperz-profile">
      <div className="profile-header">
        <div className="avatar">👤</div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>Community Helper</p>
        </div>
      </div>
      
      <div className="helper-status">
        <div className="status-card">
          <h3>Helper Status</h3>
          <div className="status-badge inactive">Inactive</div>
          <p>Become a HelperZ to help people in your area</p>
          <button className="activate-btn">
            Activate Helper Mode
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .helperz-profile {
          background: rgba(30, 41, 59, 0.8);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid #334155;
        }
        
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .avatar {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .status-card {
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          margin: 1rem 0;
        }
        
        .status-badge.inactive {
          background: #64748b;
          color: white;
        }
        
        .activate-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default HelperZProfile;