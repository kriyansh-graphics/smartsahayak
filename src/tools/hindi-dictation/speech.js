// src/tools/hindi-dictation/speech.js

export function getAvailableVoices() {
  if (!("speechSynthesis" in window)) {
    return [];
  }

  return window.speechSynthesis.getVoices();
}

export function getHindiVoices() {
  return getAvailableVoices().filter((voice) =>
    voice.lang.toLowerCase().startsWith("hi")
  );
}

export function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(text, voiceURI = "") {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Your browser does not support speech synthesis."));
      return;
    }

    if (!text || !text.trim()) {
      reject(new Error("There is no text to speak."));
      return;
    }

    // Stop any speech that may already be playing.
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "hi-IN";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (voiceURI) {
      const selectedVoice = getAvailableVoices().find(
        (voice) => voice.voiceURI === voiceURI
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }
    }

    utterance.onend = () => resolve();

    utterance.onerror = (event) => {
      reject(new Error(`Speech error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}