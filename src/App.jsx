
import { useState } from "react";
import "./App.css";
import HindiDictation from "./tools/hindi-dictation/HindiDictation";

function App() {
  const [language, setLanguage] = useState("en");
  const [showDictation, setShowDictation] = useState(false);

  const content = {
    en: {
      home: "Home",
      about: "About",
      welcome: "Welcome to SmartSahayak",
      heading: "Simple tools for smarter learning",
      description:
        "Useful digital tools designed for students, parents and teachers.",
      featured: "Our First Utility",
      toolName: "Hindi Words Dictation",
      toolDescription:
        "Listen to Hindi words and practise writing their correct spellings. Improve your Hindi vocabulary and spelling skills.",
      start: "Start Dictation Practice first",
      comingSoon: "More useful tools coming soon!",
      comingDescription:
        "We will keep adding simple and useful utilities to SmartSahayak.",
      footer: "Simple tools. Smarter everyday life.",
      aboutText: "About SmartSahayak",
      feedback: "Feedback",
      privacy: "Privacy Policy",
    },
    hi: {
      home: "होम",
      about: "हमारे बारे में",
      welcome: "SmartSahayak में आपका स्वागत है",
      heading: "सीखने के लिए सरल और उपयोगी टूल्स",
      description:
        "विद्यार्थियों, अभिभावकों और शिक्षकों के लिए उपयोगी डिजिटल टूल्स।",
      featured: "हमारा पहला टूल",
      toolName: "हिंदी शब्द श्रुतलेख",
      toolDescription:
        "हिंदी शब्दों को सुनें और उनकी सही वर्तनी लिखने का अभ्यास करें। अपनी हिंदी शब्दावली और वर्तनी में सुधार करें।",
      start: "श्रुतलेख अभ्यास शुरू करें",
      comingSoon: "और उपयोगी टूल्स जल्द ही!",
      comingDescription:
        "हम SmartSahayak में लगातार नए और उपयोगी टूल्स जोड़ते रहेंगे।",
      footer: "सरल टूल्स। बेहतर दैनिक जीवन।",
      aboutText: "SmartSahayak के बारे में",
      feedback: "सुझाव दें",
      privacy: "गोपनीयता नीति",
    },
  };

  const t = content[language];

  if (showDictation) {
  return (
    <HindiDictation
      onBack={() => setShowDictation(false)}
    />
  );
}

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <a href="/" className="brand">
            <span className="brand-icon">S</span>
            <span>SmartSahayak</span>
          </a>

          <nav className="navigation">
            <a href="#home">{t.home}</a>
            <a href="#about">{t.aboutText}</a>
          </nav>

          <div className="language-switch">
            <button
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
            <button
              className={language === "hi" ? "active" : ""}
              onClick={() => setLanguage("hi")}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero container" id="home">
          <div className="hero-content">
            <span className="welcome-label">{t.welcome}</span>
            <h1>{t.heading}</h1>
            <p>{t.description}</p>
          </div>
        </section>

        <section className="tools-section container" id="dictation">
          <div className="section-heading">
            <span>{t.featured}</span>
            <h2>{t.toolName}</h2>
          </div>

          <div className="tool-card">
            <div className="tool-icon">🎧</div>

            <div className="tool-information">
              <h3>{t.toolName}</h3>
              <p>{t.toolDescription}</p>

              <button className="primary-button" onClick={() => setShowDictation(true)}
                >
                {t.start}
              </button>
            </div>

            <div className="tool-decoration">अ आ इ ई</div>
          </div>
        </section>

        <section className="coming-section container">
          <div className="coming-icon">✨</div>
          <h2>{t.comingSoon}</h2>
          <p>{t.comingDescription}</p>
        </section>

        <section className="about-section" id="about">
          <div className="container">
            <h2>{t.aboutText}</h2>
            <p>{t.footer}</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <span>© {new Date().getFullYear()} SmartSahayak</span>

          <div>
            <a href="#about">{t.aboutText}</a>
            <a href="mailto:feedback@smartsahayak.in">{t.feedback}</a>
            <a href="#about">{t.privacy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
