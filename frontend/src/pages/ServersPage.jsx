import React, { useState, useEffect } from 'react';
import ServerCard from '../components/ServerCard';

const API_URL = 'http://127.0.0.1:8000/servers';

const ServersPage = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const serverDetailsPromises = data.servers.map(async (ip) => {
          const detailsResponse = await fetch(`${API_URL}/${ip}`);
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for ${ip}:`, detailsResponse.statusText);
            return { ip, data: null, error: detailsResponse.statusText };
          }
          const details = await detailsResponse.json();
          return { ip, data: details, error: null };
        });

        const allServerDetails = await Promise.all(serverDetailsPromises);
        setServers(allServerDetails);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleCardClick = (server) => {
    setSelectedServer(server);
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading server data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Server List</h1>
      {selectedServer ? (
        <FullServerView server={selectedServer} onBack={() => setSelectedServer(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard key={server.ip} server={server} onClick={() => handleCardClick(server)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServersPage;