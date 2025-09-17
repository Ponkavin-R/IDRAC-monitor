import React from 'react';
import { FaLaptop, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ServerCard = ({ server, onClick }) => {
  const { ip, data, error } = server;
  const healthStatus = data?.data?.system?.health?.toLowerCase() || 'unknown';
  const powerState = data?.data?.system?.power_state?.toLowerCase() || 'off';
  const model = data?.data?.system?.model || 'Unknown Model';

  const statusColor = healthStatus === 'ok' 
    ? 'bg-green-500' 
    : healthStatus === 'warning' 
    ? 'bg-yellow-500'
    : healthStatus === 'critical'
    ? 'bg-red-500'
    : 'bg-gray-400';

  const statusIcon = healthStatus === 'ok' 
    ? <FaCheckCircle className="text-white" /> 
    : healthStatus === 'warning' 
    ? <FaExclamationTriangle className="text-white" />
    : <FaTimesCircle className="text-white" />;

  return (
    <button 
      className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer text-left" 
      onClick={onClick}
    >
      <div className={`flex items-center justify-between p-4 ${statusColor}`}>
        <div className="flex items-center">
          <FaLaptop className="text-white mr-4 text-2xl" />
          <h3 className="text-white text-lg font-semibold">{ip}</h3>
        </div>
        {statusIcon}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 font-bold">{model}</p>
        <div className={`mt-2 text-sm font-semibold`}>
          <span className={`px-2 py-1 rounded-full text-white text-xs ${powerState === 'on' ? 'bg-green-600' : 'bg-red-600'}`}>
            {powerState.toUpperCase()}
          </span>
          {error && <span className="text-red-500 ml-2">Error</span>}
        </div>
      </div>
    </button>
  );
};

export default ServerCard;