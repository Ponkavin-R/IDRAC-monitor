import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ReactDOM from 'react-dom/client';

// Icons for the sidebar
const ServerIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width={size} height={size}>
    <path d="M48 48a48 48 0 1 1 96 0 48 48 0 1 1-96 0zm74 152H440c44.2 0 80 35.8 80 80v64c0 44.2-35.8 80-80 80H122c-44.2 0-80-35.8-80-80v-64c0-44.2 35.8-80 80-80zM224 400a48 48 0 1 1 96 0 48 48 0 1 1-96 0zm-54-80a24 24 0 1 1-48 0 24 24 0 1 1 48 0zM400 400a24 24 0 1 1-48 0 24 24 0 1 1 48 0z"/>
  </svg>
);

const ChartLineIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width={size} height={size}>
    <path d="M496 224c-11.4 0-21.7 5.7-27.7 15.3l-88 144c-4.9 8-16 10.4-24 5.5s-10.4-16-5.5-24l88-144c1.9-3.1 5.2-5 8.7-5h.5c6.6 0 12-5.4 12-12v-64c0-13.3-10.7-24-24-24s-24 10.7-24 24v64c0 6.6-5.4 12-12 12s-12-5.4-12-12v-64c0-13.3-10.7-24-24-24S24 50.7 24 64v192h-.5c-3.4 0-6.7 1.9-8.7 5l-88 144c-4.9 8-2.5 19.1 5.5 24s16 2.5 24-5.5l88-144c6-9.6 16.3-15.3 27.7-15.3H496z"/>
  </svg>
);

const BarsIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" width={size} height={size}>
    <path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/>
  </svg>
);

const TimesIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" width={size} height={size}>
    <path d="M376 96c13.3-13.3 13.3-34.7 0-48s-34.7-13.3-48 0L192 144 56 0C42.7-13.3 21.3-13.3 8 0s-13.3 34.7 0 48L144 192 0 328c-13.3 13.3-13.3 34.7 0 48s34.7 13.3 48 0L192 240 328 376c13.3 13.3 34.7 13.3 48 0s13.3-34.7 0-48L240 192 376 56z"/>
  </svg>
);

const SpinnerIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width={size} height={size} className={className}>
    <path d="M478.4 461.2c-54.8 54.8-131.7 84.8-212.8 84.8-208.7 0-377.6-168.9-377.6-377.6S57 0 265.6 0c144.3 0 274.6 81.3 340.4 208L394.4 208c-54.3-73.4-142.3-120-240.8-120C117.8 88 47.9 157.9 47.9 245.2c0 87.3 69.9 157.2 156.9 157.2 56.4 0 109.1-30.8 135.5-80.4l-75.1-75.1c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l112 112c12.5 12.5 12.5 32.8 0 45.3z"/>
  </svg>
);

const ChevronRightIcon = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" fill="currentColor" width={size} height={size} className={className}>
    <path d="M118.6 105.4l128 127.9c4.7 4.7 4.7 12.3 0 17L118.6 406.6c-4.7 4.7-12.3 4.7-17 0s-4.7-12.3 0-17L223 256 101.6 117.4c-4.7-4.7-4.7-12.3 0-17s12.3-4.7 17 0z"/>
  </svg>
);

// Sidebar Component
const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [groupedServers, setGroupedServers] = useState({});
  const [isServersOpen, setIsServersOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleGroup = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  useEffect(() => {
    const fetchServers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/servers/sidebar');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.servers)) {
          // Group servers into a nested structure: DC -> Cab -> Pos -> [server1, server2, ...]
          const groups = data.servers.reduce((acc, server) => {
            const dc = server.DataCenterID || 'Unknown DC';
            const cab = server.Cabinet || 'Unknown Cabinet';
            const pos = server.Position || 'Unknown Position';

            if (!acc[dc]) {
              acc[dc] = {};
            }
            if (!acc[dc][cab]) {
              acc[dc][cab] = {};
            }
            if (!acc[dc][cab][pos]) {
              acc[dc][cab][pos] = []; // Initialize as an array to hold multiple servers
            }
            acc[dc][cab][pos].push(server);
            return acc;
          }, {});

          setGroupedServers(groups);

          // Open all groups by default on first load
          const initialOpenState = {};
          Object.keys(groups).forEach(dc => {
            initialOpenState[dc] = true;
            Object.keys(groups[dc]).forEach(cab => {
              initialOpenState[`${dc}-${cab}`] = true;
            });
          });
          setOpenGroups(initialOpenState);
        } else {
          console.error("API response did not contain a valid 'servers' array:", data);
          setGroupedServers({});
        }
      } catch (error) {
        console.error("Failed to fetch servers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServers();
  }, []);

  const navItems = [
    { name: 'Dashboard', icon: <ChartLineIcon size={18} />, path: '/' },
  ];

  return (
    <div
      className={`relative h-screen bg-white text-gray-800 transition-all duration-300 shadow-lg ${
        isOpen ? 'w-64' : 'w-20'
      } border-r border-blue-100`}
    >
      {/* Header and Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-blue-100">
        <h2
          className={`text-xl font-bold text-blue-600 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          iDRAC
        </h2>
        <button
          onClick={toggleSidebar}
          className="text-blue-500 hover:text-blue-700 focus:outline-none transition-transform duration-300"
        >
          {isOpen ? <TimesIcon size={20} /> : <BarsIcon size={20} />}
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-blue-100 hover:text-blue-800'
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {item.icon}
                </div>
                <span
                  className={`ml-4 text-sm font-semibold transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 w-0'
                  } whitespace-nowrap overflow-hidden`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
          {/* Servers dropdown */}
          <li key="Servers">
            <button
              onClick={() => setIsServersOpen(!isServersOpen)}
              className={`w-full flex items-center p-3 mx-4 rounded-lg transition-colors duration-200 focus:outline-none ${
                location.pathname.startsWith('/servers')
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:bg-blue-100 hover:text-blue-800'
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <ServerIcon size={18} />
              </div>
              <span
                className={`ml-4 text-sm font-semibold transition-opacity duration-300 ${
                  isOpen ? 'opacity-100' : 'opacity-0 w-0'
                } whitespace-nowrap overflow-hidden`}
              >
                Servers
              </span>
            </button>
            {isServersOpen && (
              <ul className="ml-8 mt-2 space-y-1">
                {isLoading ? (
                  <li className={`flex items-center p-3 text-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 w-0'
                  }`}>
                    <SpinnerIcon size={18} className="animate-spin mr-2 text-blue-500" />
                    <span className="text-gray-500">Loading...</span>
                  </li>
                ) : Object.keys(groupedServers).length > 0 ? (
                  Object.keys(groupedServers).map((dcId) => (
                    <li key={dcId}>
                      {/* DC Group */}
                      <button
                        onClick={() => toggleGroup(dcId)}
                        className="w-full text-left p-2 text-sm rounded-md transition-colors duration-200 hover:bg-sky-300 bg-sky-200"
                      >
                        <span className={`inline-flex items-center transition-opacity duration-300 ${
                          isOpen ? 'opacity-100' : 'opacity-0 w-0'
                        } whitespace-nowrap overflow-hidden`}>
                          <ChevronRightIcon size={14} className={`transform transition-transform duration-200 mr-2 ${openGroups[dcId] ? 'rotate-90 text-blue-600' : 'text-blue-400'}`} />
                          <span className="font-bold text-blue-900">DC: </span>
                          <span className="ml-1 text-blue-800">{dcId}</span>
                        </span>
                      </button>
                      {openGroups[dcId] && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {Object.keys(groupedServers[dcId]).map(cabId => (
                            <li key={`${dcId}-${cabId}`}>
                              {/* Cabinet Group */}
                              <button
                                onClick={() => toggleGroup(`${dcId}-${cabId}`)}
                                className="w-full text-left p-2 text-sm rounded-md transition-colors duration-200 hover:bg-emerald-300 bg-emerald-200"
                              >
                                <span className={`inline-flex items-center transition-opacity duration-300 ${
                                  isOpen ? 'opacity-100' : 'opacity-0 w-0'
                                } whitespace-nowrap overflow-hidden`}>
                                  <ChevronRightIcon size={14} className={`transform transition-transform duration-200 mr-2 ${openGroups[`${dcId}-${cabId}`] ? 'rotate-90 text-blue-600' : 'text-blue-400'}`} />
                                  <span className="font-bold text-green-800">Cab: </span>
                                  <span className="ml-1 text-green-700">{cabId}</span>
                                </span>
                              </button>
                              {openGroups[`${dcId}-${cabId}`] && (
                                <ul className="ml-4 mt-1 space-y-1">
                                  {Object.keys(groupedServers[dcId][cabId]).map(posId => (
                                    <li key={`${dcId}-${cabId}-${posId}`}>
                                      {/* Position Group */}
                                      <button
                                        onClick={() => toggleGroup(`${dcId}-${cabId}-${posId}`)}
                                        className="w-full text-left p-2 text-sm rounded-md transition-colors duration-200 hover:bg-amber-300 bg-amber-200"
                                      >
                                        <span className={`inline-flex items-center transition-opacity duration-300 ${
                                          isOpen ? 'opacity-100' : 'opacity-0 w-0'
                                        } whitespace-nowrap overflow-hidden`}>
                                          <ChevronRightIcon size={14} className={`transform transition-transform duration-200 mr-2 ${openGroups[`${dcId}-${cabId}-${posId}`] ? 'rotate-90 text-blue-600' : 'text-blue-400'}`} />
                                          <span className="font-bold text-yellow-800">Pos: </span>
                                          <span className="ml-1 text-yellow-700">{posId}</span>
                                        </span>
                                      </button>
                                      {openGroups[`${dcId}-${cabId}-${posId}`] && (
                                        <ul className="ml-4 mt-1 space-y-1">
                                          {groupedServers[dcId][cabId][posId].map(server => (
                                            <li key={server.iDRAC_IP}>
                                              {/* Final Hostname Link */}
                                              <Link
                                                to={`/servers/${server.iDRAC_IP}`}
                                                className={`block p-2 text-sm rounded-md transition-colors duration-200 ${
                                                  location.pathname === `/servers/${server.iDRAC_IP}`
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'hover:bg-blue-100'
                                                }`}
                                              >
                                                <span
                                                  className={`transition-opacity duration-300 ${
                                                    isOpen ? 'opacity-100' : 'opacity-0 w-0'
                                                  } whitespace-nowrap overflow-hidden`}
                                                >
                                                  <span className="font-bold text-gray-800">{server.Hostname || 'N/A'}</span>
                                                </span>
                                              </Link>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))
                ) : (
                  <li className={`p-2 text-sm text-gray-500 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 w-0'
                  }`}>
                    No servers found.
                  </li>
                )}
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
