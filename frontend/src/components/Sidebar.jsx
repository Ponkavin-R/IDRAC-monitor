import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaServer, FaChartLine, FaBars, FaTimes } from 'react-icons/fa';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Dashboard', icon: <FaChartLine />, path: '/' },
    { name: 'Servers', icon: <FaServer />, path: '/servers' },
  ];

  return (
    <div
      className={`relative h-screen bg-gray-900 text-gray-300 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } border-r border-gray-700`}
    >
      {/* Header and Toggle Button */}
      <div className="flex items-center justify-between p-4">
        <h2
          className={`text-xl font-bold text-gray-100 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          iDRAC
        </h2>
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white focus:outline-none transition-transform duration-300"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      <nav className="mt-8">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={`flex items-center p-3 mx-4 rounded-lg transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {React.cloneElement(item.icon, { size: 18 })}
                </div>
                <span
                  className={`ml-4 text-sm font-medium transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 w-0'
                  } whitespace-nowrap overflow-hidden`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;