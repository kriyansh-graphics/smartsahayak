
import { useEffect, useMemo, useRef, useState } from "react";
import "./dictation.css";

import {
  getAvailableVoices,
  getHindiVoices,
  speakText,
  stopSpeech,
} from "./speech";

function parseCsv(text) {
  const rows = text.split(/\r?\n/);
  const words = [];

  for (const row of rows) {
    if (!row.trim()) continue;

    const cells = row.match(/("(?:[^"]|"")*"|[^,]*)(,|$)/g) || [];

    let value = cells
      .map((cell) => cell.replace(/,$/, "").trim())
      .map((cell) => {
        if (cell.startsWith('"') && cell.endsWith('"')) {
          return cell.slice(1, -1).replace(/""/g, '"');
        }
        return cell;
      })
      .find((cell) => cell.length > 0);

    if (!value) continue;

    if (
      ["word", "words", "hindi word", "शब्द"].includes(
        value.toLowerCase()
      )
    ) {
      continue;
    }

    words.push(value);
  }

  return words;
}

function HindiDictation({ onBack }) {
  const [inputMode, setInputMode] = useState("manual");
  const [manualText, setManualText] = useState("");
  const [csvWords, setCsvWords] = useState([]);
  const [fileName, setFileName] = useState("");

  const [repeatCount, setRepeatCount] = useState(2);
  const [delay, setDelay] = useState(5);
  const [repeatDelay, setRepeatDelay] = useState(3);
  const [autoNext, setAutoNext] = useState(true);
  const [prepared, setPrepared] = useState(false);

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [playbackStatus, setPlaybackStatus] = useState("idle");

  const sessionRef = useRef(0);
  const pausedRef = useRef(false);

  const manualWords = useMemo(
    () =>
      manualText
        .split(/\r?\n/)
        .map((word) => word.trim())
        .filter(Boolean),
    [manualText]
  );

  const currentWords =
    inputMode === "manual" ? manualWords : csvWords;

  const isActive =
    playbackStatus === "playing" ||
    playbackStatus === "paused";

  // Load Hindi voices from the browser.
  useEffect(() => {
    function loadVoices() {
      const available = getAvailableVoices();
      const hindi = getHindiVoices();

      setVoices(hindi);

      if (hindi.length > 0) {
        setSelectedVoice((current) => {
          if (
            current &&
            hindi.some((voice) => voice.voiceURI === current)
          ) {
            return current;
          }

          return hindi[0].voiceURI;
        });
      } else if (available.length > 0) {
        setSelectedVoice("");
      }
    }

    loadVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        loadVoices
      );
    }

    return () => {
      window.speechSynthesis?.removeEventListener(
        "voiceschanged",
        loadVoices
      );

      sessionRef.current += 1;
      stopSpeech();
    };
  }, []);

  async function waitForDelay(milliseconds, session) {
    let elapsed = 0;

    while (elapsed < milliseconds) {
      if (session !== sessionRef.current) {
        return false;
      }

      if (pausedRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
      elapsed += 100;
    }

    return session === sessionRef.current;
  }

  async function startPlayback(startIndex) {
    if (currentWords.length === 0) return;

    if (startIndex >= currentWords.length) {
      setPlaybackStatus("completed");
      return;
    }

    // Cancel any previous playback session.
    sessionRef.current += 1;
    const session = sessionRef.current;

    stopSpeech();
    pausedRef.current = false;

    setCurrentIndex(startIndex);
    setCurrentRepeat(0);
    setPlaybackStatus("playing");

    for (
      let wordIndex = startIndex;
      wordIndex < currentWords.length;
      wordIndex++
    ) {
      if (session !== sessionRef.current) return;

      setCurrentIndex(wordIndex);

      const word = currentWords[wordIndex];

      for (
        let repetition = 1;
        repetition <= repeatCount;
        repetition++
      ) {
        if (session !== sessionRef.current) return;

        // Wait if the user has paused the dictation.
        while (pausedRef.current) {
          if (session !== sessionRef.current) return;

          await new Promise((resolve) =>
            setTimeout(resolve, 100)
          );
        }

        setCurrentRepeat(repetition);

        
        // try {
        //   await speakText(word, selectedVoice);
        // } catch (error) {
        //   if (session !== sessionRef.current) return;

        //   console.error("Speech error:", error);
        //   setPlaybackStatus("error");
        //   return;
        // }

        // if (session !== sessionRef.current) return;



          try {
              await speakText(word, selectedVoice);
          } catch (error) {
              if (session !== sessionRef.current) return;

              console.error("Speech error:", error);
              setPlaybackStatus("error");
              return;
          }

          if (session !== sessionRef.current) return;

          // Wait between repetitions of the same word.
          if (repetition < repeatCount && repeatDelay > 0) {
              const completed = await waitForDelay(
                  repeatDelay * 1000,
                  session
              );

              if (!completed) return;
          }
      }

      // Manual mode: wait for the user to request the next word.
      if (!autoNext) {
        setPlaybackStatus("waiting");
        return;
      }

      // Wait before moving to the next word.
      if (wordIndex < currentWords.length - 1 && delay > 0) {
        const completed = await waitForDelay(
          delay * 1000,
          session
        );

        if (!completed) return;
      }
    }

    if (session === sessionRef.current) {
      setPlaybackStatus("completed");
    }
  }

  function handleStart() {
    if (playbackStatus === "paused") {
      pausedRef.current = false;
      window.speechSynthesis.resume();
      setPlaybackStatus("playing");
      return;
    }

    if (playbackStatus === "playing") return;

    startPlayback(currentIndex);
  }

  function handlePause() {
    if (playbackStatus !== "playing") return;

    pausedRef.current = true;
    window.speechSynthesis.pause();
    setPlaybackStatus("paused");
  }

  function handleNextWord() {
    if (currentIndex >= currentWords.length - 1) {
      sessionRef.current += 1;
      stopSpeech();
      pausedRef.current = false;
      setPlaybackStatus("completed");
      return;
    }

    startPlayback(currentIndex + 1);
  }

  function handleRestart() {
    startPlayback(0);
  }

  function handleStop() {
    sessionRef.current += 1;
    pausedRef.current = false;

    stopSpeech();

    setCurrentIndex(0);
    setCurrentRepeat(0);
    setPlaybackStatus("idle");
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsedWords = parseCsv(text);

      if (parsedWords.length === 0) {
        alert("No words were found in this CSV file.");
        event.target.value = "";
        return;
      }

      setCsvWords(parsedWords);
      setFileName(file.name);
      setInputMode("csv");
      setPrepared(false);
      handleStop();
    } catch {
      alert("Unable to read this file. Please try another CSV file.");
    }
  }

  function prepareWordList() {
    if (currentWords.length === 0) {
      alert("Please enter or upload some Hindi words first.");
      return;
    }

    handleStop();
    setPrepared(true);
  }

  function changeMode(mode) {
    handleStop();
    setInputMode(mode);
    setPrepared(false);
  }

  const progress =
    currentWords.length > 0
      ? ((currentIndex + 1) / currentWords.length) * 100
      : 0;

  return (
    <div className="dictation-page">
      <div className="dictation-container">
        <button
          className="back-button"
          onClick={() => {
            handleStop();
            onBack();
          }}
        >
          ← Back to SmartSahayak
        </button>

        <div className="dictation-heading">
          <span className="dictation-label">
            SMARTSAHAYAK LEARNING TOOL
          </span>

          <h1>हिंदी शब्द श्रुतलेख</h1>

          <p>
            Prepare your word list and practise Hindi spelling through
            dictation.
          </p>
        </div>

        <section className="dictation-panel">
          <h2>1. Prepare your word list</h2>

          <p className="panel-description">
            Upload a CSV file or type/paste your Hindi words below.
          </p>

          <div className="input-tabs">
            <button
              className={inputMode === "manual" ? "selected" : ""}
              onClick={() => changeMode("manual")}
              disabled={isActive}
            >
              Type / Paste Words
            </button>

            <button
              className={inputMode === "csv" ? "selected" : ""}
              onClick={() => changeMode("csv")}
              disabled={isActive}
            >
              Upload CSV
            </button>
          </div>

          {inputMode === "manual" && (
            <div className="input-area">
              <label htmlFor="manual-words">
                Enter Hindi words
              </label>

              <textarea
                id="manual-words"
                value={manualText}
                disabled={isActive}
                onChange={(event) => {
                  setManualText(event.target.value);
                  setPrepared(false);
                  setCurrentIndex(0);
                  setPlaybackStatus("idle");
                }}
                placeholder={"कमल\nमछली\nविद्यालय\nकिताब\nआकाश"}
                rows={9}
              />

              <small>
                Enter one word per line. Empty lines are ignored.
              </small>
            </div>
          )}

          {inputMode === "csv" && (
            <div className="upload-area">
              <label htmlFor="csv-file" className="upload-label">
                <span className="upload-icon">📄</span>
                <strong>Select a CSV file</strong>
                <span>Choose a file from your device</span>

                <input
                  id="csv-file"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isActive}
                  onChange={handleFileUpload}
                />
              </label>

              {fileName && (
                <p className="file-name">
                  Selected file: {fileName}
                </p>
              )}

              <small>
                Use a CSV file with one Hindi word in each row.
              </small>
            </div>
          )}

          <div className="word-count">
            <span>Words detected</span>
            <strong>{currentWords.length}</strong>
          </div>
        </section>

        <section className="dictation-panel">
          <h2>2. Dictation settings</h2>

          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="repeat-count">
                Repeat each word
              </label>

              <input
                id="repeat-count"
                type="number"
                min="1"
                max="10"
                disabled={isActive}
                value={repeatCount}
                onChange={(event) =>
                  setRepeatCount(
                    Math.min(
                      10,
                      Math.max(1, Number(event.target.value) || 1)
                    )
                  )
                }
              />
            </div>

            <div className="setting-item">
              <label htmlFor="word-delay">
                Delay between words (seconds)
              </label>

              <input
                id="word-delay"
                type="number"
                min="0"
                max="60"
                disabled={isActive}
                value={delay}
                onChange={(event) =>
                  setDelay(
                    Math.min(
                      60,
                      Math.max(0, Number(event.target.value) || 0)
                    )
                  )
                }
              />
            </div>

            <div className="setting-item">
                          <label htmlFor="repeat-delay">
                              Delay between repetitions (seconds)
                          </label>

                          <input
                              id="repeat-delay"
                              type="number"
                              min="0"
                              max="60"
                              disabled={isActive}
                              value={repeatDelay}
                              onChange={(event) =>
                                  setRepeatDelay(
                                      Math.min(60, Math.max(0, Number(event.target.value) || 0))
                                  )
                              }
                          />
            </div>

          </div>

          <label className="auto-next-setting">
            <input
              type="checkbox"
              checked={autoNext}
              disabled={isActive}
              onChange={(event) =>
                setAutoNext(event.target.checked)
              }
            />

            <span>
              <strong>Automatic next word</strong>
              <small>
                Move to the next word automatically after repetitions.
              </small>
            </span>
          </label>

          <div className="setting-item voice-setting">
            <label htmlFor="hindi-voice">
              Hindi speech voice
            </label>

            {voices.length > 0 ? (
              <select
                id="hindi-voice"
                value={selectedVoice}
                disabled={isActive}
                onChange={(event) =>
                  setSelectedVoice(event.target.value)
                }
              >
                {voices.map((voice) => (
                  <option
                    key={voice.voiceURI}
                    value={voice.voiceURI}
                  >
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            ) : (
              <small>
                No Hindi voice is currently listed. The browser's
                default Hindi speech setting will be used.
              </small>
            )}
          </div>
        </section>

        <section className="dictation-panel">
          <div className="preview-heading">
            <div>
              <h2>3. Word list preview</h2>

              <p className="panel-description">
                Check your words before preparing the dictation.
              </p>
            </div>

            <span className="preview-count">
              {currentWords.length} words
            </span>
          </div>

          {currentWords.length > 0 ? (
            <ol className="word-preview">
              {currentWords.slice(0, 20).map((word, index) => (
                <li key={`${index}-${word}`}>
                  <span>{word}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-preview">
              Your Hindi words will appear here.
            </div>
          )}

          {currentWords.length > 20 && (
            <p className="remaining-words">
              And {currentWords.length - 20} more words...
            </p>
          )}

          <button
            className="prepare-button"
            onClick={prepareWordList}
            disabled={currentWords.length === 0 || isActive}
          >
            Prepare Word List
          </button>

          {prepared && (
            <div className="success-message">
              Your word list is ready! {currentWords.length} words
              have been prepared successfully.
            </div>
          )}
        </section>

        {prepared && (
          <section className="dictation-panel playback-panel">
            <h2>4. Hindi Dictation</h2>

            <div className="playback-progress">
              <div className="progress-information">
                <span>
                  Word {Math.min(currentIndex + 1, currentWords.length)}
                  {" "}of {currentWords.length}
                </span>

                <strong>{Math.round(progress)}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="current-word-display">
              <span>Current word</span>

              <strong>
                {currentWords[currentIndex] || "—"}
              </strong>

              <small>
                Repetition: {currentRepeat} / {repeatCount}
              </small>
            </div>

            <p className="playback-status" role="status" aria-live="polite">
              {playbackStatus === "idle" &&
                "Ready to start dictation."}

              {playbackStatus === "playing" &&
                "Speaking... Listen carefully."}

              {playbackStatus === "paused" &&
                "Dictation paused."}

              {playbackStatus === "waiting" &&
                "Word completed. Select Next Word to continue."}

              {playbackStatus === "completed" &&
                "Congratulations! Dictation completed."}

              {playbackStatus === "stopped" &&
                "Dictation stopped."}

              {playbackStatus === "error" &&
                "Speech could not be completed. Please check your browser's speech settings."}
            </p>

            <div className="playback-controls">
              <button
                className="prepare-button"
                onClick={handleStart}
                disabled={
                  playbackStatus === "playing" ||
                  playbackStatus === "completed" ||
                  playbackStatus === "error"
                }
              >
                {playbackStatus === "paused" ? "Resume" : "Start"}
              </button>

              <button
                className="secondary-button"
                onClick={handlePause}
                disabled={playbackStatus !== "playing"}
              >
                Pause
              </button>

              <button
                className="secondary-button"
                onClick={handleNextWord}
                disabled={
                  playbackStatus === "completed" ||
                  playbackStatus === "error"
                }
              >
                Next Word →
              </button>

              <button
                className="secondary-button"
                onClick={handleRestart}
              >
                Restart
              </button>

              <button
                className="secondary-button"
                onClick={handleStop}
                disabled={playbackStatus === "idle"}
              >
                Stop
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default HindiDictation;
