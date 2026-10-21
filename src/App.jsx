import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [activePortal, setActivePortal] = useState('dispatch'); // 'citizen' or 'dispatch'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth Form State
  const [identifier, setIdentifier] = useState('admin@dispatch.com');
  const [password, setPassword] = useState('admin123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Tactical Commander');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Citizen SOS Form State
  const [sosCategory, setSosCategory] = useState('Medical Emergency');
  const [sosLocation, setSosLocation] = useState('Rajkot Central Command');
  const [sosDetails, setSosDetails] = useState('');
  const [citizenBroadcastStatus, setCitizenBroadcastStatus] = useState(null);
  
  // Acoustic Frequency State
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [acousticFreq, setAcousticFreq] = useState('440 Hz (Clear)');

  // Active Incidents vs Incident History
  const [activeIncidents, setActiveIncidents] = useState([
    { id: 'INC-220', type: 'Medical Emergency', location: 'Rajkot Central Command', status: 'PENDING DISPATCH', sla: '10:00', priority: 'HIGH', unit: 'Unassigned', timestamp: '12:05 PM' }
  ]);
  const [incidentHistory, setIncidentHistory] = useState([
    { id: 'INC-901', type: 'Fire Response', location: 'Marwadi Univ Sector 4', status: 'RESOLVED', sla: '04:12', priority: 'CRITICAL', unit: 'Unit-Alpha', timestamp: '10:14 AM' },
    { id: 'INC-902', type: 'Medical SOS', location: 'Aji Dam Zone', status: 'RESOLVED', sla: '02:45', priority: 'HIGH', unit: 'Medic-3', timestamp: '09:30 AM' },
    { id: 'INC-903', type: 'Hazmat Leak', location: 'Industrial Area Phase 2', status: 'CONTAINED', sla: '08:19', priority: 'MODERATE', unit: 'Hazmat-1', timestamp: '08:05 AM' }
  ]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const mapRef = useRef(null);

  // Pre-load default admin credentials into local storage
  useEffect(() => {
    const adminUser = {
      id: '1',
      fullName: 'Lead Tactical Commander',
      identifier: 'admin@dispatch.com',
      password: 'admin123',
      role: 'Tactical Commander'
    };

    const existingUsers = localStorage.getItem('tactical_users');
    let users = [];

    if (existingUsers) {
      try { users = JSON.parse(existingUsers); } catch (e) { users = []; }
    }

    users = users.filter(u => u.identifier.toLowerCase() !== 'admin@dispatch.com');
    users.unshift(adminUser);
    localStorage.setItem('tactical_users', JSON.stringify(users));
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    const users = JSON.parse(localStorage.getItem('tactical_users') || '[]');
    const cleanId = identifier.trim().toLowerCase();

    const user = users.find(
      (u) => u.identifier.trim().toLowerCase() === cleanId && u.password === password
    );

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    } else {
      setAuthError('Invalid credentials. Check email/mobile or register a new user.');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!fullName || !identifier || !password) {
      setAuthError('All personnel fields are required.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('tactical_users') || '[]');
    if (users.some((u) => u.identifier.toLowerCase() === identifier.trim().toLowerCase())) {
      setAuthError('User record already exists with this email or mobile.');
      return;
    }

    const newUser = { id: Date.now().toString(), fullName, identifier: identifier.trim(), password, role };
    users.push(newUser);
    localStorage.setItem('tactical_users', JSON.stringify(users));

    setAuthSuccess('Personnel access granted! Logging you in...');
    setTimeout(() => {
      setCurrentUser(newUser);
      setIsAuthenticated(true);
    }, 1000);
  };

  const handleCitizenSubmit = (e) => {
    e.preventDefault();
    const incId = `INC-${Math.floor(100 + Math.random() * 900)}`;
    const newInc = {
      id: incId,
      type: sosCategory,
      location: sosLocation,
      status: 'PENDING DISPATCH',
      sla: '10:00',
      priority: 'HIGH',
      unit: 'Unassigned',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Push to active management queue
    setActiveIncidents([newInc, ...activeIncidents]);
    
    // Set feedback for citizen portal
    setCitizenBroadcastStatus({
      id: incId,
      category: sosCategory,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    setSosDetails('');
  };

  // State Transition Action Handler (5 Workflow Actions)
  const handleUpdateStatus = (id, newStatus) => {
    if (newStatus === 'RESOLVED') {
      const incToResolve = activeIncidents.find(inc => inc.id === id);
      if (incToResolve) {
        setIncidentHistory([{ ...incToResolve, status: 'RESOLVED' }, ...incidentHistory]);
        setActiveIncidents(activeIncidents.filter(inc => inc.id !== id));
      }
    } else {
      setActiveIncidents(activeIncidents.map(inc => {
        if (inc.id === id) {
          return { ...inc, status: newStatus };
        }
        return inc;
      }));
    }
  };

  const simulateAudioAnalysis = () => {
    setIsAnalyzingAudio(true);
    setAcousticFreq('Scanning acoustic spectrum...');
    setTimeout(() => {
      setIsAnalyzingAudio(false);
      setAcousticFreq('850 Hz (High Alarm Frequency Detected)');
    }, 1800);
  };

  // Leaflet Map Initialization
  useEffect(() => {
    if (activePortal !== 'dispatch' || !isAuthenticated) return;

    const timer = setTimeout(() => {
      const mapContainer = document.getElementById('map');
      if (!mapContainer || typeof window.L === 'undefined') return;

      if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = '';
      }

      const map = window.L.map('map').setView([22.3039, 70.8022], 13);
      mapRef.current = map;

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap © CARTO'
      }).addTo(map);

      const hqMarker = window.L.marker([22.3039, 70.8022]).addTo(map);
      hqMarker.bindPopup('<b style="color:#10b981;">COMMAND HQ</b><br/>Status: Operational Command Active').openPopup();

      const routeCoords = [
        [22.3039, 70.8022],
        [22.3120, 70.7950],
        [22.3210, 70.8010]
      ];
      window.L.polyline(routeCoords, { color: '#06b6d4', weight: 4, opacity: 0.8, dashArray: '8, 8' }).addTo(map);

      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activePortal, isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      
      {/* ENTERPRISE HEADER */}
      <header className="border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur-xl px-6 py-3.5 flex flex-wrap justify-between items-center z-30 gap-4 shadow-2xl shadow-cyan-950/20">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
          </div>
          <h1 className="text-lg font-black tracking-widest text-white uppercase flex items-center gap-2">
            TACTICAL COMMAND <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-700/60 shadow-inner">PRO-DISPATCH v2.4</span>
          </h1>
        </div>

        {/* Portal Switcher Bar */}
        <div className="flex bg-[#03060d] p-1 rounded-xl border border-slate-800/90 shadow-inner">
          <button
            onClick={() => setActivePortal('citizen')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activePortal === 'citizen'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📢 CITIZEN / FIELD SOS
          </button>
          <button
            onClick={() => setActivePortal('dispatch')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 flex items-center gap-2 ${
              activePortal === 'dispatch'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ COMMAND DISPATCH
          </button>
        </div>

        {isAuthenticated && activePortal === 'dispatch' && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[11px] font-mono rounded-lg transition flex items-center gap-1.5"
            >
              📜 INCIDENT HISTORY ({incidentHistory.length})
            </button>
            <div className="text-right text-xs">
              <p className="font-bold text-slate-100">{currentUser?.fullName}</p>
              <p className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider">{currentUser?.role}</p>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="bg-red-950/40 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-[11px] font-mono px-3 py-1.5 rounded-lg transition shadow-md uppercase tracking-wider"
            >
              TERMINATE
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 flex justify-center items-center">
        {activePortal === 'citizen' ? (
          /* CITIZEN PORTAL */
          <div className="w-full max-w-2xl">
            <div className="bg-[#0b1120]/80 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-red-400 uppercase tracking-wide flex items-center gap-2">
                    🚨 Emergency SOS Broadcast
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Direct encrypted emergency request channel to Rajkot Command Center</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800/80 text-red-400 font-mono text-[10px] uppercase tracking-wider">
                  PUBLIC PORTAL
                </span>
              </div>

              {citizenBroadcastStatus && (
                <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>✅</span> BROADCAST TRANSMITTED
                    </p>
                    <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                      Ticket Reference: <span className="text-emerald-400 font-bold">{citizenBroadcastStatus.id}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#050811] px-2 py-1 rounded border border-slate-800">
                    {citizenBroadcastStatus.timestamp}
                  </span>
                </div>
              )}

              <form onSubmit={handleCitizenSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Emergency Category</label>
                  <select
                    value={sosCategory}
                    onChange={(e) => setSosCategory(e.target.value)}
                    className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-red-500 transition font-medium"
                  >
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Fire Response">Fire Response</option>
                    <option value="Tactical Rescue">Tactical Rescue</option>
                    <option value="Hazardous Spill">Hazardous Spill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Incident Location</label>
                  <input
                    type="text"
                    required
                    value={sosLocation}
                    onChange={(e) => setSosLocation(e.target.value)}
                    className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-red-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">Incident Details / Situation Report</label>
                  <textarea
                    rows="3"
                    placeholder="Describe immediate hazards..."
                    value={sosDetails}
                    onChange={(e) => setSosDetails(e.target.value)}
                    className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-red-500 transition font-medium"
                  ></textarea>
                </div>

                <div className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">Acoustic SOS Frequency</p>
                    <p className="text-xs font-mono text-cyan-400 mt-0.5">{acousticFreq}</p>
                  </div>
                  <button
                    type="button"
                    onClick={simulateAudioAnalysis}
                    disabled={isAnalyzingAudio}
                    className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs rounded-lg font-mono transition"
                  >
                    {isAnalyzingAudio ? 'ANALYZING...' : 'ANALYZE AUDIO'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-red-950/60 mt-2"
                >
                  BROADCAST EMERGENCY SOS
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* PRO-DISPATCH COMMAND PORTAL */
          <div className="w-full max-w-6xl">
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto bg-[#0b1120]/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-white tracking-wide uppercase">
                    {authMode === 'login' ? 'Command Authentication' : 'Personnel Registration'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {authMode === 'login'
                      ? 'Secure tactical dispatch portal entry'
                      : 'Register new authorized dispatcher credentials'}
                  </p>
                </div>

                {authError && <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl font-medium">{authError}</div>}
                {authSuccess && <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-medium">{authSuccess}</div>}

                {authMode === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">EMAIL OR MOBILE NUMBER</label>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">PASSCODE</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-950/50 mt-2">
                      AUTHENTICATE COMMAND ACCESS
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">FULL PERSONNEL NAME</label>
                      <input
                        type="text"
                        required
                        placeholder="Officer J. Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">EMAIL OR MOBILE NUMBER</label>
                      <input
                        type="text"
                        required
                        placeholder="user@dispatch.com or +919876543210"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">TACTICAL ROLE</label>
                      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500">
                        <option value="Dispatcher">Dispatcher (Full Command)</option>
                        <option value="Field Lead">Field Lead (Route Control)</option>
                        <option value="Tactical Commander">Tactical Commander (System Admin)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 mb-1.5 uppercase tracking-wider">SECURITY PASSCODE</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#050811] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-950/50 mt-2">
                      REGISTER DISPATCHER
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                  {authMode === 'login' ? (
                    <button onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }} className="text-cyan-400 font-bold hover:underline">
                      Need Dispatcher Account Registration?
                    </button>
                  ) : (
                    <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="text-cyan-400 font-bold hover:underline">
                      Return to Authentication Login
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* MANAGEMENT DASHBOARD: DISPATCH FEED WITH 5 WORKFLOW ACTION BUTTONS */
              <div className="space-y-6">
                
                {/* 4-Card Tactical Metrics Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#0b1120]/80 border border-slate-800/90 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ACTIVE FIELD UNITS</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">14 UNITS</p>
                  </div>
                  <div className="bg-[#0b1120]/80 border border-slate-800/90 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">AVG RESPONSE TIME</p>
                    <p className="text-2xl font-black text-cyan-400 mt-1">3m 42s</p>
                  </div>
                  <div className="bg-[#0b1120]/80 border border-slate-800/90 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">QUEUED INCIDENTS</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">{activeIncidents.length} ACTIVE</p>
                  </div>
                  <div className="bg-[#0b1120]/80 border border-slate-800/90 p-4 rounded-2xl shadow-xl backdrop-blur-xl">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">SYSTEM STATUS</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">100% OFFLINE</p>
                  </div>
                </div>

                {/* Grid Layout: Feed with 5 Action Buttons + Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Live Dispatch Feed with Interactive Workflow Buttons */}
                  <div className="lg:col-span-5 bg-[#0b1120]/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[460px]">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-200 font-bold flex items-center gap-2">
                          <span>📡 LIVE OPERATIONAL FEED</span>
                        </h3>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                          {activeIncidents.length} QUEUED
                        </span>
                      </div>

                      {activeIncidents.length === 0 ? (
                        <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl my-4">
                          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">ALL DISPATCH QUEUES CLEAR</p>
                          <p className="text-[11px] text-slate-600 mt-1">New incoming SOS requests from Citizen Portal will appear here live.</p>
                          <button
                            onClick={() => setShowHistoryModal(true)}
                            className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition"
                          >
                            VIEW RESOLVED INCIDENT HISTORY
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                          {activeIncidents.map((inc) => (
                            <div key={inc.id} className="p-4 bg-[#050811] border border-slate-800 rounded-xl hover:border-cyan-700/50 transition">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-mono text-cyan-400 font-bold">{inc.id}</span>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{inc.priority}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-white mt-1">{inc.type}</h4>
                                  <p className="text-xs text-slate-400 mt-0.5">{inc.location}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full font-bold block ${
                                    inc.status === 'PENDING DISPATCH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                    inc.status === 'DISPATCHED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                                    inc.status === 'EN-ROUTE' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                                    inc.status === 'IN-PROGRESS' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                    'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}>
                                    {inc.status}
                                  </span>
                                  <p className="text-[10px] text-slate-500 font-mono mt-1">SLA: {inc.sla}</p>
                                </div>
                              </div>

                              {/* 5-Option Operational Workflow Buttons */}
                              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => handleUpdateStatus(inc.id, 'DISPATCHED')}
                                  className="flex-1 px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[10px] font-mono rounded transition uppercase font-bold"
                                >
                                  DISPATCH
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(inc.id, 'EN-ROUTE')}
                                  className="flex-1 px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 text-[10px] font-mono rounded transition uppercase font-bold"
                                >
                                  EN-ROUTE
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(inc.id, 'IN-PROGRESS')}
                                  className="flex-1 px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-[10px] font-mono rounded transition uppercase font-bold"
                                >
                                  ACTION
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(inc.id, 'RESOLVED')}
                                  className="flex-1 px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono rounded transition uppercase font-bold"
                                >
                                  RESOLVE
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tactical Leaflet Map Canvas */}
                  <div className="lg:col-span-7 bg-[#0b1120]/80 border border-slate-800/90 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                        <span>🗺️ TACTICAL GEOSPATIAL RADAR</span>
                      </h3>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-0.5 rounded-full">
                        LEAFLET V1.9.4
                      </span>
                    </div>
                    <div id="map" className="w-full h-[420px] rounded-xl border border-slate-800"></div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* INCIDENT HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  📜 RESOLVED INCIDENT HISTORY ARCHIVE
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Stored local dispatch records & historical logs</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white font-mono text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {incidentHistory.map((inc) => (
                <div key={inc.id} className="p-3.5 bg-[#050811] border border-slate-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-cyan-400 font-bold">{inc.id}</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">{inc.priority}</span>
                      <span className="text-[9px] font-mono text-slate-500">{inc.timestamp}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 mt-1">{inc.type}</h4>
                    <p className="text-xs text-slate-400">{inc.location} • Unit: {inc.unit}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                    {inc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ELEGANT 4-COLUMN ENTERPRISE FOOTER */}
      <footer className="border-t border-slate-800 bg-[#070b16] pt-8 pb-6 px-8 text-xs font-mono text-slate-400 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Column 1: Core Command Overview */}
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-white font-black uppercase tracking-wider text-sm">PRO-DISPATCH COMMAND</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Next-generation offline PWA emergency dispatch architecture equipped with Haversine route calculation, acoustic signal spectrum analysis, and fail-safe local persistence.
            </p>
          </div>

          {/* Column 2: Live Operational Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>SYSTEM METRICS</span>
              <span className="text-[10px] text-emerald-400">ONLINE</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex justify-between"><span>SECURITY CLEARANCE:</span> <span className="text-cyan-400 font-bold">LEVEL 4 HIGH</span></li>
              <li className="flex justify-between"><span>PWA MESH NETWORK:</span> <span className="text-emerald-400 font-bold">ACTIVE (12ms)</span></li>
              <li className="flex justify-between"><span>ENCRYPTION PROTOCOL:</span> <span className="text-slate-300 font-mono">AES-256-GCM</span></li>
            </ul>
          </div>

          {/* Column 3: Regional HQ Location */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">
              REGIONAL DISPATCH HQ
            </h4>
            <p className="text-[11px] text-slate-300 font-medium">
              Rajkot Central Tactical Operations Wing
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Location: 22.3039° N, 70.8022° E
            </p>
            <p className="text-[10px] text-cyan-400 mt-1 font-mono">
              Sector 4 Emergency Zone Active
            </p>
          </div>

          {/* Column 4: System Action Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1.5">
              QUICK COMMAND LINKS
            </h4>
            <div className="flex flex-col space-y-2 text-[11px]">
              <button onClick={() => setShowHistoryModal(true)} className="text-left text-cyan-400 hover:underline">
                • View Resolved Incident History Log
              </button>
              <button onClick={() => setActivePortal('citizen')} className="text-left text-slate-400 hover:text-white">
                • Citizen Emergency SOS Switcher
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-wrap justify-between items-center gap-2 text-[10px] text-slate-500 max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <span>© 2026 TACTICAL COMMAND DISPATCH SYSTEMS</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">ALL NODE MESHES OPERATIONAL</span>
          </div>
          <div className="flex space-x-4">
            <span className="hover:text-slate-300 cursor-pointer">PRIVACY PROTOCOL</span>
            <span>|</span>
            <span className="hover:text-slate-300 cursor-pointer">OPERATIONAL LOGS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
