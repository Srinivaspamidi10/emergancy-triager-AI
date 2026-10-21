const fs = require("fs");

// 1. ComplaintForm.jsx with Automatic Categorization
const complaintFormCode = `import React, { useState, useEffect, useRef } from "react";

export default function ComplaintForm({ onSubmitComplaints }) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState("text-sm");
  const [location, setLocation] = useState("Detecting GPS location...");
  const [isLocating, setIsLocating] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);

  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchLocation();
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const fetchLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation("Lat: " + pos.coords.latitude.toFixed(4) + ", Lng: " + pos.coords.longitude.toFixed(4));
          setIsLocating(false);
        },
        () => {
          setLocation("Location Access Denied (Manual Fallback)");
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLocation("Geolocation Not Supported");
      setIsLocating(false);
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText(currentTranscript);
      };

      recognition.onerror = (e) => {
        console.error("Speech error", e);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic start failed", err);
      setIsRecording(false);
    }
  };

  // AUTO-DETECT COMPLAINT TYPE & TARGET SERVICE
  const categorizeEmergency = (inputStr) => {
    const lower = inputStr.toLowerCase();
    
    if (lower.includes("fire") || lower.includes("smoke") || lower.includes("explosion") || lower.includes("burn") || lower.includes("chemical")) {
      return {
        type: "🔥 Fire Hazard & HAZMAT",
        serviceNeeded: "Fire Department / HAZMAT Unit",
        priority: "CRITICAL",
        extracted: "Thermal / Toxic Inhalation hazard detected."
      };
    } else if (lower.includes("blood") || lower.includes("unconscious") || lower.includes("heart") || lower.includes("injury") || lower.includes("breathing") || lower.includes("ambulance")) {
      return {
        type: "🚑 Medical Emergency",
        serviceNeeded: "Emergency Medical Services (EMS)",
        priority: "CRITICAL",
        extracted: "Life-threatening medical condition parsed."
      };
    } else if (lower.includes("robbery") || lower.includes("theft") || lower.includes("gun") || lower.includes("weapon") || lower.includes("fight") || lower.includes("break-in") || lower.includes("thief")) {
      return {
        type: "👮 Crime & Security",
        serviceNeeded: "Police / Law Enforcement",
        priority: "HIGH",
        extracted: "Security threat or active law enforcement violation."
      };
    } else if (lower.includes("crash") || lower.includes("accident") || lower.includes("vehicle") || lower.includes("traffic") || lower.includes("car")) {
      return {
        type: "🚗 Traffic & Vehicle Incident",
        serviceNeeded: "Traffic Control & Highway Patrol",
        priority: "HIGH",
        extracted: "Vehicular accident requiring road clearance."
      };
    } else {
      return {
        type: "🚨 General SOS Incident",
        serviceNeeded: "General First Responders",
        priority: "MEDIUM",
        extracted: "Standard emergency triage requirement."
      };
    }
  };

  const processMultiIncidents = (rawInput) => {
    const sentences = rawInput
      .split(/(?:\\n|\\.|;|(?:\\s+and\\s+)|(?:\\s+also\\s+))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    if (sentences.length === 0) return [rawInput];
    return sentences;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const incidentList = processMultiIncidents(text);
    const newItems = incidentList.map((incidentSummary, idx) => {
      const categoryMeta = categorizeEmergency(incidentSummary);
      return {
        complaintId: "CMP-" + (Date.now() + idx).toString().slice(-5),
        summary: incidentSummary,
        location: location,
        language: selectedLanguage,
        timestamp: new Date().toLocaleTimeString(),
        currentStage: "Received",
        priority: categoryMeta.priority,
        complaintType: categoryMeta.type,
        serviceNeeded: categoryMeta.serviceNeeded,
        extractedDetails: categoryMeta.extracted
      };
    });

    if (onSubmitComplaints) {
      onSubmitComplaints(newItems);
    }

    setExtractedCount(newItems.length);
    setIsSubmitted(true);
    setTimeout(() => {
      setText("");
      setIsSubmitted(false);
      setExtractedCount(0);
    }, 4000);
  };

  return (
    <div className={"space-y-4 rounded-xl p-4 transition-all " + (highContrast ? "bg-black text-yellow-300 border-2 border-yellow-400" : "bg-slate-950 text-slate-100")}>
      
      {/* ACCESSIBILITY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">♿ Accessibility:</span>
          <button
            type="button"
            onClick={() => setHighContrast(!highContrast)}
            className={"px-2.5 py-1 rounded font-bold transition-all " + (highContrast ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}
          >
            {highContrast ? "☀️ Standard Contrast" : "👁️ High Contrast Mode"}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-400 mr-1">Text Size:</span>
          <button
            type="button"
            onClick={() => setFontSize("text-xs")}
            className={"px-2 py-0.5 rounded border " + (fontSize === "text-xs" ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 text-slate-400")}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setFontSize("text-sm")}
            className={"px-2 py-0.5 rounded border " + (fontSize === "text-sm" ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 text-slate-400")}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize("text-lg")}
            className={"px-2 py-0.5 rounded border " + (fontSize === "text-lg" ? "bg-purple-600 border-purple-500 text-white" : "border-slate-700 text-slate-400")}
          >
            A+
          </button>
        </div>
      </div>

      {/* AUTO GPS TRACKER */}
      <div className={"flex items-center justify-between p-3 rounded-lg border text-xs " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-900 border-slate-800")}>
        <div className="flex items-center gap-2">
          <span className={"h-2.5 w-2.5 rounded-full " + (isLocating ? "bg-amber-400 animate-ping" : "bg-emerald-400")}></span>
          <span className="font-semibold">📍 Auto-Tracked Location:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-400">{location}</span>
          <button
            type="button"
            onClick={fetchLocation}
            className="text-slate-400 hover:text-white underline text-[11px]"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            🌐 Voice / Input Language:
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={"px-3 py-1.5 rounded-lg border text-xs font-medium focus:outline-none " + (highContrast ? "bg-black text-yellow-300 border-yellow-400" : "bg-slate-900 text-slate-200 border-slate-700")}
          >
            <option value="en-US">English (US)</option>
            <option value="hi-IN">Hindi (हिन्दी)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
            <option value="es-ES">Spanish (Español)</option>
          </select>
        </div>

        <div className={"relative border rounded-xl p-3 transition-colors " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-900 border-slate-700 focus-within:border-red-500")}>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type emergency report... System auto-classifies complaint types (Fire, EMS, Crime, Traffic)."
            className={"w-full bg-transparent focus:outline-none resize-none placeholder-slate-500 " + fontSize}
          />

          <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-1">
            <button
              type="button"
              onClick={toggleRecording}
              className={"px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow " + (isRecording ? "bg-red-600 text-white animate-pulse" : highContrast ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-200 hover:bg-slate-700")}
            >
              <span>{isRecording ? "🔴 Stop Listening..." : "🎙️ Speak Emergency (Mic)"}</span>
            </button>

            <span className="text-xs text-slate-500 font-mono">
              {text.length} characters
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className={"w-full py-3.5 text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 " + (highContrast ? "bg-yellow-400 text-black hover:bg-yellow-300" : "bg-red-600 hover:bg-red-700 text-white disabled:opacity-40")}
        >
          <span>🚨 Submit Auto-Categorized SOS Complaint</span>
        </button>

        {isSubmitted && (
          <div className="p-3 bg-emerald-900/50 border border-emerald-500 text-emerald-300 text-xs rounded-lg text-center font-bold space-y-1">
            <div>✅ SOS Dispatched! Categorized {extractedCount} Emergency Complaint(s).</div>
            <div className="text-[11px] text-emerald-200 font-mono">
              Older complaints automatically archived in the Management Portal Vault.
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
`;

// 2. App.jsx with Historical Vault Drawer and Staff Command Action Bar
const appCode = `import React, { useState, useEffect } from "react";
import ComplaintForm from "./components/ComplaintForm";

export default function App() {
  const [currentPortal, setCurrentPortal] = useState("patient");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isOfficerAuthenticated, setIsOfficerAuthenticated] = useState(false);
  const DEFAULT_OFFICER_PIN = "1234";

  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [highContrast, setHighContrast] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Active Queue State
  const [activeQueue, setActiveQueue] = useState(() => {
    const saved = localStorage.getItem("emergency_active_queue");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  // Archive / Historical Vault State
  const [archiveQueue, setArchiveQueue] = useState(() => {
    const saved = localStorage.getItem("emergency_archive_queue");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      {
        complaintId: "CMP-90812",
        summary: "Chemical leak reported near industrial complex.",
        location: "Lat: 22.3039, Lng: 70.8022",
        language: "en-US",
        timestamp: "10:14:02 AM",
        currentStage: "Resolved",
        priority: "CRITICAL",
        complaintType: "🔥 Fire Hazard & HAZMAT",
        serviceNeeded: "Fire Department / HAZMAT Unit",
        extractedDetails: "Resolved by Hazmat Division."
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem("emergency_active_queue", JSON.stringify(activeQueue));
  }, [activeQueue]);

  useEffect(() => {
    localStorage.setItem("emergency_archive_queue", JSON.stringify(archiveQueue));
  }, [archiveQueue]);

  const WORKFLOW_STAGES = ["Received", "Detected", "Translated", "Triaged", "Dispatched", "En Route", "Resolved"];

  // When a new complaint is submitted, existing active complaints move to History
  const handleNewComplaintsSubmit = (newItems) => {
    setActiveQueue((prevActive) => {
      if (prevActive.length > 0) {
        setArchiveQueue((prevArchive) => [...prevActive, ...prevArchive]);
      }
      return newItems;
    });
  };

  const handleSwitchToManagement = () => {
    if (isOfficerAuthenticated) {
      setCurrentPortal("management");
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (enteredPin === DEFAULT_OFFICER_PIN) {
      setIsOfficerAuthenticated(true);
      setCurrentPortal("management");
      setIsPinModalOpen(false);
      setEnteredPin("");
      setPinError("");
    } else {
      setPinError("Invalid PIN code. Access denied.");
    }
  };

  const updateComplaintStage = (complaintId, nextStage) => {
    setActiveQueue((prev) =>
      prev.map((c) => (c.complaintId === complaintId ? { ...c, currentStage: nextStage } : c))
    );
  };

  const exportQueueToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ activeQueue, archiveQueue }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "emergency_dispatch_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear ALL live and archived emergency records?")) {
      setActiveQueue([]);
      setArchiveQueue([]);
      localStorage.removeItem("emergency_active_queue");
      localStorage.removeItem("emergency_archive_queue");
    }
  };

  const filteredActiveQueue = activeQueue.filter((c) => {
    const matchesPriority = filterPriority === "ALL" || c.priority === filterPriority;
    const matchesType = filterType === "ALL" || c.complaintType.includes(filterType);
    return matchesPriority && matchesType;
  });

  return (
    <div className={"min-h-screen flex flex-col font-sans transition-colors " + (highContrast ? "bg-black text-yellow-300" : "bg-slate-900 text-slate-100")}>
      
      {/* HEADER */}
      <header className={"border-b px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-950/80 border-slate-800 backdrop-blur")}>
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">AI Emergency Command Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">Auto-Categorization • Incident Archival Vault • Full Portal Control Matrix</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className={"px-3 py-1.5 rounded-lg text-xs font-bold border transition-all " + (highContrast ? "bg-yellow-400 text-black border-yellow-400" : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white")}
          >
            {highContrast ? "☀️ Normal Mode" : "👁️ High Contrast"}
          </button>

          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setCurrentPortal("patient")}
              className={"px-4 py-1.5 text-xs font-semibold rounded-md transition-all " + (currentPortal === "patient" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              📢 Public Citizen Portal
            </button>
            <button
              onClick={handleSwitchToManagement}
              className={"px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 " + (currentPortal === "management" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white")}
            >
              🛡️ Management Command Center
              {!isOfficerAuthenticated && <span className="text-[10px] opacity-70">🔒</span>}
            </button>
          </div>
        </div>
      </header>

      {/* PIN VERIFICATION MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="text-lg font-bold text-white">Management Authorization</h3>
              <p className="text-xs text-slate-400 mt-1">Enter Staff Officer PIN (Default: 1234)</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Enter PIN"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError("");
                }}
                className="w-full text-center tracking-widest text-lg p-3 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                autoFocus
              />
              {pinError && <p className="text-red-400 text-xs text-center">{pinError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold"
                >
                  Unlock Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORTAL 1: PUBLIC CITIZEN FORM */}
      {currentPortal === "patient" && (
        <main className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
          <div className={"border rounded-xl shadow-2xl p-6 space-y-6 " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-950 border-red-900/40")}>
            <div className="text-center border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                <span>🚨</span> Public Emergency SOS Reporting
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Auto-classifies incidents into Fire, Medical, Crime, and Traffic departments.
              </p>
            </div>
            
            <ComplaintForm onSubmitComplaints={handleNewComplaintsSubmit} />
          </div>
        </main>
      )}

      {/* PORTAL 2: STAFF & MANAGEMENT PORTAL */}
      {currentPortal === "management" && (
        <div className="flex-1 flex flex-col">
          
          {/* COMPREHENSIVE STAFF ACTION & BUTTON MATRIX */}
          <div className={"border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs " + (highContrast ? "bg-black border-yellow-400 text-yellow-300" : "bg-slate-950/60 border-slate-800 text-slate-300")}>
            
            <div className="flex items-center space-x-4">
              <span className="font-mono text-slate-400 font-bold">🎯 Staff Controls:</span>
              
              {/* BUTTON 1: ARCHIVE VAULT BUTTON */}
              <button
                onClick={() => setIsHistoryDrawerOpen(!isHistoryDrawerOpen)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow flex items-center gap-1.5 transition-all"
              >
                <span>📦 Archive / History Vault ({archiveQueue.length})</span>
              </button>

              {/* BUTTON 2: EXPORT JSON DATA */}
              <button
                onClick={exportQueueToJSON}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-mono text-[11px] font-bold"
              >
                📥 Export Log (JSON)
              </button>

              {/* BUTTON 3: SIMULATE DISPATCH BROADCAST */}
              <button
                onClick={() => alert("📡 Broadcast emergency units dispatched to coordinates.")}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow"
              >
                📡 Field Broadcast
              </button>

              {/* BUTTON 4: CLEAR ALL DATA */}
              <button
                onClick={clearAllData}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg font-mono text-[11px] font-bold"
              >
                🗑️ Reset System Data
              </button>
            </div>

            {/* BUTTON 5 & 6: PRIORITY & DEPT FILTERS */}
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">Filter Dept:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-200 rounded text-xs"
              >
                <option value="ALL">All Departments</option>
                <option value="Fire">🔥 Fire / HAZMAT</option>
                <option value="Medical">🚑 EMS / Medical</option>
                <option value="Crime">👮 Crime / Police</option>
                <option value="Traffic">🚗 Traffic Control</option>
              </select>

              <span className="text-slate-400 ml-2">Priority:</span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={"px-2.5 py-1 rounded text-[11px] font-bold border transition-all " + (filterPriority === p ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white")}
                >
                  {p}
                </button>
              ))}
            </div>

          </div>

          <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
            
            {/* HISTORICAL COMPLAINTS DRAWER (HIDDEN BY DEFAULT, OPENS ON BUTTON CLICK) */}
            {isHistoryDrawerOpen && (
              <div className="border border-amber-500/50 bg-amber-950/20 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-800/60 pb-3">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <span>📦 Historical / Archived Complaints Vault</span>
                    <span className="text-xs font-mono font-normal text-amber-300">({archiveQueue.length} items archived)</span>
                  </h3>
                  <button
                    onClick={() => setIsHistoryDrawerOpen(false)}
                    className="text-xs text-amber-400 hover:underline font-bold"
                  >
                    ✕ Close Archive
                  </button>
                </div>

                {archiveQueue.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No historical complaints archived yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
                    {archiveQueue.map((arch) => (
                      <div key={arch.complaintId} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-purple-400 font-bold">{arch.complaintId}</span>
                          <span className="text-slate-500">{arch.timestamp}</span>
                        </div>
                        <p className="text-slate-300 font-semibold">{arch.summary}</p>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-amber-400">{arch.complaintType}</span>
                          <span className="text-emerald-400 font-mono">{arch.currentStage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LIVE ACTIVE INCIDENTS */}
            <div className={"border rounded-xl p-6 shadow-2xl space-y-6 " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-950 border-slate-800")}>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold">🔥 Live Active Emergency Queue ({filteredActiveQueue.length})</h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">Real-Time Auto-Classified Incoming Reports</p>
                </div>
              </div>

              {filteredActiveQueue.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                  No active incoming complaints. Older complaints are stored in the <strong>Archive Vault Button</strong> above.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActiveQueue.map((item) => (
                    <div
                      key={item.complaintId}
                      className={"border rounded-xl p-5 space-y-4 transition-all " + (highContrast ? "bg-black border-yellow-400" : "bg-slate-900/90 border-slate-800 hover:border-slate-700")}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={"px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase " + (item.priority === "CRITICAL" ? "bg-red-950 text-red-400 border border-red-800" : item.priority === "HIGH" ? "bg-orange-950 text-orange-400 border border-orange-800" : "bg-yellow-950 text-yellow-400 border border-yellow-800")}>
                            {item.priority}
                          </span>
                          <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-bold">
                            {item.complaintType}
                          </span>
                          <span className="font-mono text-xs text-purple-400 font-bold">{item.complaintId}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">Stage:</span>
                          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-emerald-400">
                            {item.currentStage}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8 space-y-2">
                          <p className="text-sm font-semibold text-slate-100">"{item.summary}"</p>
                          {item.extractedDetails && (
                            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-300 font-mono space-y-1">
                              <span className="text-purple-400 font-bold">🤖 Auto-Extracted Intelligence:</span>
                              <p>{item.extractedDetails}</p>
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs space-y-2 font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400">📍 Location:</span>
                            <span className="text-emerald-400 font-bold">{item.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">🚑 Assigned Service:</span>
                            <span className="text-amber-400 font-bold">{item.serviceNeeded}</span>
                          </div>
                        </div>
                      </div>

                      {/* WORKFLOW PIPELINE BUTTON MATRIX */}
                      <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-400">Advance Incident Stage:</span>
                        <div className="flex flex-wrap gap-1">
                          {WORKFLOW_STAGES.map((stage) => {
                            const isCurrent = item.currentStage === stage;
                            return (
                              <button
                                key={stage}
                                onClick={() => updateComplaintStage(item.complaintId, stage)}
                                className={"px-2.5 py-1 rounded text-[11px] font-mono transition-all " + (isCurrent ? "bg-purple-600 text-white font-bold shadow" : "bg-slate-800 text-slate-400 hover:text-white")}
                              >
                                {stage}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          </main>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync("./src/components/ComplaintForm.jsx", complaintFormCode);
fs.writeFileSync("./src/App.jsx", appCode);
console.log("Successfully integrated complaint auto-detection, archive drawer, and full staff action matrix!");

