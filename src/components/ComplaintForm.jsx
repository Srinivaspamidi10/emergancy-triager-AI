import React, { useState, useEffect, useRef } from "react";

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
      .split(/(?:\n|\.|;|(?:\s+and\s+)|(?:\s+also\s+))/i)
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
