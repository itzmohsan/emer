import React from 'react';
import LiveHelperMap from './LiveHelperMap';

const HelperZMap = ({ location }) => {
  return (
    <div className="helperz-map-container">
      <LiveHelperMap location={location} />
    </div>
  );
};

export default HelperZMap;