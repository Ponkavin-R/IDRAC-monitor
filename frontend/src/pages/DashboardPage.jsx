import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaArrowUp, FaArrowDown, FaExclamationTriangle, FaServer, FaSpinner } from 'react-icons/fa';

const API_URL = 'http://127.0.0.1:8000/servers';

const DashboardPage = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchInitialServerList = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTotalServerCount(data.servers.length);
        
        // After getting the list, start fetching details for each server
        fetchServerDetails(data.servers);
      } catch (e) {
        setLoading(false);
        setIsLoadingDetails(false);
        setError(e.message);
      }
    };

    const fetchServerDetails = async (serverList) => {
      setIsLoadingDetails(true);
      // Corrected the mapping to use the 'ip' property from each server object
      const serverDetailsPromises = serverList.map(async (server) => {
        try {
          const detailsResponse = await fetch(`${API_URL}/${server.ip}`);
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for ${server.ip}:`, detailsResponse.statusText);
            return { ip: server.ip, data: null, status: 'down' };
          }
          const details = await detailsResponse.json();
          const powerState = details.data?.system?.power_state?.toLowerCase() || 'off';
          return { ip: server.ip, data: details, status: powerState === 'on' ? 'up' : 'down' };
        } catch (e) {
          console.error(`Network error for ${server.ip}:`, e);
          return { ip: server.ip, data: null, status: 'down' };
        }
      });

      const allServerDetails = await Promise.all(serverDetailsPromises);
      setServers(allServerDetails);
      setLoading(false);
      setIsLoadingDetails(false);
    };

    fetchInitialServerList();
  }, []);

  // Show a loading state for the whole page
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <div className="text-xl text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Show error if the initial server list fetch failed
  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-white shadow-md rounded-lg mx-auto max-w-lg mt-10">
        <p className="font-bold text-xl mb-2">Error</p>
        <p>{error}</p>
        <p className="mt-4 text-sm text-gray-500">Could not fetch initial server list. Please check your backend connection.</p>
      </div>
    );
  }
  
  // Data processing for charts and cards
  const upServers = servers.filter(s => s.status === 'up').length;
  const downServers = servers.filter(s => s.status === 'down').length;
  const unavailableServers = servers.filter(s => s.data === null);

  const pieChartData = [
    { name: 'Online', value: upServers },
    { name: 'Offline', value: downServers },
  ];

  const barChartData = [
    { name: 'Servers', Up: upServers, Down: downServers },
  ];

  const COLORS = ['#16A34A', '#DC2626']; // green and red colors from Tailwind

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
          <p className="text-gray-500 text-sm">Total Servers</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-bold text-gray-800">{totalServerCount}</p>
            <FaServer className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
          <p className="text-gray-500 text-sm">Servers Up</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-bold text-green-600">{upServers}</p>
            <FaArrowUp className="text-green-600 text-3xl" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300">
          <p className="text-gray-500 text-sm">Servers Down</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-3xl font-bold text-red-600">{downServers}</p>
            <FaArrowDown className="text-red-600 text-3xl" />
          </div>
        </div>
      </div>

      {/* Conditional Rendering for Loading Details */}
      {isLoadingDetails && (
        <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center">
            <FaSpinner className="animate-spin text-2xl text-blue-500 mr-4" />
            <p className="text-gray-600 text-sm">Fetching server details. This might take a moment...</p>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Server Status Comparison</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData}>
              <Tooltip />
              <Legend />
              <Bar dataKey="Up" fill="#16A34A" />
              <Bar dataKey="Down" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Server Uptime Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Unavailable Servers Table */}
      {unavailableServers.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <FaExclamationTriangle className="text-yellow-500 mr-2 text-xl" />
            Unavailable Servers ({unavailableServers.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unavailableServers.map((server, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{server.ip}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">N/A</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">N/A</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-500 font-semibold">Unavailable</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
