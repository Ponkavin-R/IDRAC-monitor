import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ServersPage from './pages/ServersPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar component */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <header className="bg-white shadow-md p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Dell iDRAC Monitoring
            </h1>
            {/* You can add user profile or other items here */}
          </header>
          
          {/* Main Content with Routes */}
          <main className="flex-1 p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/servers" element={<ServersPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;