
const fs = require("fs");

const appCode = `import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import ComplaintForm from "./components/ComplaintForm";

export default function App() {
  const [currentPortal, setCurrentPortal] = useState("patient");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isOfficerAuthenticated, setIsOfficerAuthenticated] = useState(false);
  const DEFAULT_OFFICER_PIN = "1234";

  const [activeTab, setActiveTab] = useState("triage");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [triageData, setTriageData] = useState(null);
  const [error, setError] = useState(null);
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [translation, setTranslation] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState(""); 
  const [autoTriageOnRecord, setAutoTriageOnRecord] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [complaintQueue, setComplaintQueue] = useState([]);
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const recognitionRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const audioCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const WORKFLOW_STAGES = ["Received", "Detected", "Translated", "Triaged", "Dispatched", "En Route", "Resolved"];
  const getStageIndex = (stage) => WORKFLOW_STAGES.indexOf(stage) || 0;

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
  const DISPATCH_WEBHOOK_URL = import.meta.env.VITE_DISPATCH_WEBHOOK_URL;
  const defaultModel = "gemini-flash-lite-latest";

  const systemPrompt = "You are a high-speed emergency dispatch assistant. IMPORTANT: The user input may contain multiple distinct emergency incidents at once. Analyze the text and extract EACH distinct situation. Respond ONLY with a valid JSON ARRAY of objects. Do not include markdown.";

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

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

  const updateComplaintStage = (complaintId, stage) => {
    setComplaintQueue((prev) =>
      prev.map((complaint) => {
        if (complaint.complaintId === complaintId) {
          return { ...complaint, currentStage: stage };
        }
        return complaint;
      })
    );
  };

  const getNextStage = (currentStage) => {
    const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
    return WORKFLOW_STAGES[currentIndex + 1] || null;
  };

  const criticalCount = incidentHistory.filter((item) => item.priority === "CRITICAL").length;
  const highCount = incidentHistory.filter((item) => item.priority === "HIGH").length;
  const mediumCount = incidentHistory.filter((item) => item.priority === "MEDIUM").length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">AI Emergency SOS Triager</h1>
            <p className="text-xs text-slate-500 mt-1">Multilingual SOS, voice capture, webhook dispatch.</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setCurrentPortal("patient")}
            className={\`px-4 py-1.5 text-xs font-semibold rounded-md transition-all \${
              currentPortal === "patient" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
            }\`}
          >
            📢 Citizen / Patient Portal
          </button>
          <button
            onClick={handleSwitchToManagement}
            className={\`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 \${
              currentPortal === "management" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
            }\`}
          >
            🛡️ Officer / Management Portal
            {!isOfficerAuthenticated && <span className="text-[10px] opacity-70">🔒</span>}
          </button>
        </div>
      </header>

      {isPinModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="text-lg font-bold text-white">Management Authorization</h3>
              <p className="text-xs text-slate-400 mt-1">Enter PIN (Default: 1234)</p>
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
                  Unlock Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PORTAL 1: CITIZEN / PATIENT OPENING ONLY */}
      {currentPortal === "patient" && (
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center">
          <div className="bg-slate-950 border border-red-900/40 rounded-xl shadow-2xl p-6 space-y-6">
            <div className="text-center border-b border-slate-800 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                <span>🚨</span> Public Emergency Reporting
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Submit an urgent complaint or SOS directly to management responders.
              </p>
            </div>
            {/* PUBLIC COMPLAINT FORM ONLY RENDERS HERE */}
            <ComplaintForm/>
          </div>
        </main>
      )}

      {/* PORTAL 2: MANAGEMENT / OFFICER TEAM OPENING ONLY */}
      {currentPortal === "management" && (
        <div className="flex-1 flex flex-col">
          <div className="flex border-b border-slate-800 px-6 bg-slate-950/30">
            <button 
              onClick={() => setActiveTab("triage")}
              className={\`py-3 px-6 text-sm font-semibold border-b-2 \${
                activeTab === "triage" ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400"
              }\`}
            >
              🚨 Live Triage Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={\`py-3 px-6 text-sm font-semibold border-b-2 \${
                activeTab === "analytics" ? "border-purple-500 text-purple-400" : "border-transparent text-slate-400"
              }\`}
            >
              📊 Analytics & Reports
            </button>
          </div>

          <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col">
            {activeTab === "triage" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <section className="lg:col-span-12">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <h2 className="text-sm font-semibold uppercase text-slate-400">📋 Complaint Workflow Queue</h2>
                      <div className="text-2xl font-bold text-amber-400">{complaintQueue.length}</div>
                    </div>

                    {complaintQueue.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No active complaints in queue.</p>
                    ) : (
                      <div className="space-y-3">
                        {complaintQueue.map((complaint) => (
                          <div key={complaint.complaintId} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-mono text-slate-200">{complaint.location}</span>
                              <span className="text-xs text-slate-500">{complaint.currentStage}</span>
                            </div>
                            <p className="text-slate-300 text-sm">"{complaint.summary}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync("./src/App.jsx", appCode);
console.log("Successfully generated src/App.jsx!");

