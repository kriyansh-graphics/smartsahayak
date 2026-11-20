import { useEffect, useState } from "react";

import {
  getAvailableVoices,
  getHindiVoices,
  speakText,
  stopSpeech,
} from "./speech";

function SpeechTest() {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [status, setStatus] = useState("Loading available voices...");
  const [isSpeaking, setIsSpeaking] = useState(false);

  function loadVoices() {
    const available = getAvailableVoices();
    const hindi = getHindiVoices();

    setVoices(hindi);

    if (hindi.length > 0) {
      setSelectedVoice((current) => {
        if (current && hindi.some((voice) => voice.voiceURI === current)) {
          return current;
        }

        return hindi[0].voiceURI;
      });

      setStatus(`${hindi.length} Hindi voice(s) detected.`);
    } else if (available.length > 0) {
      setStatus("No Hindi voice detected. You can still try the browser's default voice.");
    } else {
      setStatus("Waiting for the browser to load its voices...");
    }
  }

  useEffect(() => {
    loadVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    } else {
      setStatus("This browser does not support speech synthesis.");
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          loadVoices
        );

        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function handleTestVoice() {
    try {
      setIsSpeaking(true);
      setStatus("Speaking the Hindi test sentence...");

      await speakText(
        "नमस्ते। यह हिंदी श्रुतलेख का परीक्षण है।",
        selectedVoice
      );

      setStatus("Speech test completed successfully.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSpeaking(false);
    }
  }

  function handleStop() {
    stopSpeech();
    setIsSpeaking(false);
    setStatus("Speech stopped.");
  }

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "20px",
        border: "1px solid #dce3eb",
        borderRadius: "12px",
        background: "#f8fafc",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Hindi Speech Test</h3>

      <p>
        First, let's check whether your browser has Hindi voices available.
      </p>

      <p>
        <strong>Detected Hindi voices:</strong> {voices.length}
      </p>

      {voices.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <label
            htmlFor="hindi-voice"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Select Hindi voice
          </label>

          <select
            id="hindi-voice"
            value={selectedVoice}
            onChange={(event) => setSelectedVoice(event.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
            }}
          >
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleTestVoice}
          disabled={isSpeaking}
          className="primary-button"
        >
          Test Hindi Voice
        </button>

        <button
          type="button"
          onClick={handleStop}
          className="secondary-button"
        >
          Stop
        </button>

        <button
          type="button"
          onClick={loadVoices}
          className="secondary-button"
        >
          Refresh Voices
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        style={{ marginBottom: 0, marginTop: "16px" }}
      >
        <strong>Status:</strong> {status}
      </p>
    </div>
  );
}

export default SpeechTest;