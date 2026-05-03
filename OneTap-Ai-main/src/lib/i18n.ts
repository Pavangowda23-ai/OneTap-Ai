// All 22 official Indian languages + English
export type Lang = "en" | "hi" | "kn";

export const LANGUAGES: { code: Lang; native: string; en: string }[] = [
  { code: "en", native: "English", en: "English" },
  { code: "hi", native: "हिंदी", en: "Hindi" },
  { code: "kn", native: "ಕನ್ನಡ", en: "Kannada" },
];

// BCP-47 codes for SpeechSynthesis / Coqui XTTS
export const SPEECH_LANG: Record<Lang, string> = {
  en: "en-IN", hi: "hi-IN", kn: "kn-IN",
};

// Coqui XTTS v2 supported language codes (else fallback to hi/en)
export const COQUI_LANG: Record<Lang, string> = {
  en: "en", hi: "hi", kn: "hi",
};

type Tri = { en: string; hi: string; kn: string };
function withFallback(tri: Tri): Record<Lang, string> {
  const out: Partial<Record<Lang, string>> = { en: tri.en, hi: tri.hi, kn: tri.kn };
  for (const l of LANGUAGES) if (!(l.code in out)) out[l.code] = tri.en;
  return out as Record<Lang, string>;
}

const T = (en: string, hi: string, kn: string) => withFallback({ en, hi, kn });

export const t = {
  appName: T("OneTap AI", "OneTap AI", "OneTap AI"),
  tagline: T("Your AI guide to government schemes", "सरकारी योजनाओं के लिए आपका AI मार्गदर्शक", "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಗೆ ನಿಮ್ಮ AI ಮಾರ್ಗದರ್ಶಕ"),
  getStarted: T("Get Started", "शुरू करें", "ಪ್ರಾರಂಭಿಸಿ"),
  chooseLanguage: T("Choose your language", "अपनी भाषा चुनें", "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"),
  yourDetails: T("Tell us about you", "अपने बारे में बताएं", "ನಿಮ್ಮ ಬಗ್ಗೆ ಹೇಳಿ"),
  name: T("Name", "नाम", "ಹೆಸರು"),
  phone: T("Phone Number", "फ़ोन नंबर", "ಫೋನ್ ಸಂಖ್ಯೆ"),
  email: T("Email (optional)", "ईमेल (वैकल्पिक)", "ಇಮೇಲ್ (ಐಚ್ಛಿಕ)"),
  continue: T("Continue", "जारी रखें", "ಮುಂದುವರಿಸಿ"),
  whoAreYou: T("Who are you?", "आप कौन हैं?", "ನೀವು ಯಾರು?"),
  whatNeed: T("What do you need?", "आपको क्या चाहिए?", "ನಿಮಗೆ ಏನು ಬೇಕು?"),
  findSchemes: T("Find Schemes", "योजनाएँ खोजें", "ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ"),
  popularHelp: T("✨ Popular Help", "✨ लोकप्रिय सहायता", "✨ ಜನಪ್ರಿಯ ಸಹಾಯ"),
  bestForYou: T("🎯 Best for You", "🎯 आपके लिए सर्वोत्तम", "🎯 ನಿಮಗೆ ಉತ್ತಮ"),
  otherRelevant: T("🔍 Other Relevant", "🔍 अन्य प्रासंगिक", "🔍 ಇತರ ಸಂಬಂಧಿತ"),
  helpful: T("💡 Helpful", "💡 सहायक", "💡 ಸಹಾಯಕ"),
  applyNow: T("Apply Now", "अभी आवेदन करें", "ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ"),
  listen: T("🔊 Listen", "🔊 सुनें", "🔊 ಕೇಳಿ"),
  viewSteps: T("View Steps", "चरण देखें", "ಹಂತಗಳನ್ನು ನೋಡಿ"),
  eligibility: T("Eligibility", "पात्रता", "ಅರ್ಹತೆ"),
  documents: T("Documents Required", "आवश्यक दस्तावेज", "ಅಗತ್ಯ ದಾಖಲೆಗಳು"),
  howToApply: T("How to Apply", "आवेदन कैसे करें", "ಹೇಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು"),
  nextActions: T("Next Actions", "अगले कदम", "ಮುಂದಿನ ಕ್ರಮಗಳು"),
  officialLink: T("🔗 Official Link", "🔗 आधिकारिक लिंक", "🔗 ಅಧಿಕೃತ ಲಿಂಕ್"),
  back: T("← Back", "← वापस", "← ಹಿಂದೆ"),
  askAi: T("Ask AI", "AI से पूछें", "AI ಕೇಳಿ"),
  tryAsking: T("✨ Try asking:", "✨ पूछकर देखें:", "✨ ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ:"),
  send: T("Send", "भेजें", "ಕಳುಹಿಸಿ"),
  typeMessage: T("Type a message...", "संदेश लिखें...", "ಸಂದೇಶ ಬರೆಯಿರಿ..."),
  thinking: T("Thinking...", "सोच रहा हूँ...", "ಯೋಚಿಸುತ್ತಿದೆ..."),
  loading: T("Finding best schemes for you...", "आपके लिए सर्वोत्तम योजनाएँ खोज रहे हैं...", "ನಿಮಗಾಗಿ ಉತ್ತಮ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತಿದ್ದೇವೆ..."),
  profile: T("Profile", "प्रोफ़ाइल", "ಪ್ರೊಫೈಲ್"),
  saveDetails: T("Save Details", "विवरण सहेजें", "ವಿವರಗಳನ್ನು ಉಳಿಸಿ"),
  close: T("Close", "बंद करें", "ಮುಚ್ಚಿ"),
  clearChat: T("Clear Chat", "चैट साफ़ करें", "ಚಾಟ್ ಅಳಿಸಿ"),
  chatHistory: T("Chat History", "चैट इतिहास", "ಚಾಟ್ ಇತಿಹಾಸ"),
  newChat: T("New Chat", "नई चैट", "ಹೊಸ ಚಾಟ್"),
  active: T("Active", "सक्रिय", "ಸಕ್ರಿಯ"),
  archived: T("Archived", "संग्रहित", "ಆರ್ಕೈವ್ ಮಾಡಲಾಗಿದೆ"),
  chats: T("Chats", "चैट", "ಚಾಟ್‌ಗಳು"),
};

export const USER_TYPES = [
  { id: "farmer", icon: "👨‍🌾", label: T("Farmer", "किसान", "ರೈತ") },
  { id: "woman", icon: "👩", label: T("Woman", "महिला", "ಮಹಿಳೆ") },
  { id: "student", icon: "🎓", label: T("Student", "छात्र", "ವಿದ್ಯಾರ್ಥಿ") },
  { id: "senior", icon: "👴", label: T("Senior", "वरिष्ठ", "ಹಿರಿಯ") },
  { id: "general", icon: "👥", label: T("General", "सामान्य", "ಸಾಮಾನ್ಯ") },
] as const;

export const NEEDS = [
  { id: "money", icon: "💰", label: T("Money Help", "धन सहायता", "ಹಣಕಾಸು ಸಹಾಯ") },
  { id: "farming", icon: "🌾", label: T("Farming", "खेती", "ಕೃಷಿ") },
  { id: "housing", icon: "🏠", label: T("Housing", "आवास", "ವಸತಿ") },
  { id: "education", icon: "🎓", label: T("Education", "शिक्षा", "ಶಿಕ್ಷಣ") },
  { id: "health", icon: "🏥", label: T("Health", "स्वास्थ्य", "ಆರೋಗ್ಯ") },
  { id: "documents", icon: "📄", label: T("Documents", "दस्तावेज", "ದಾಖಲೆಗಳು") },
] as const;

export const POPULAR = [
  T("Farmer subsidy", "किसान सब्सिडी", "ರೈತ ಸಬ್ಸಿಡಿ"),
  T("Scholarship", "छात्रवृत्ति", "ವಿದ್ಯಾರ್ಥಿವೇತನ"),
  T("Pension", "पेंशन", "ಪಿಂಚಣಿ"),
  T("Housing help", "आवास सहायता", "ವಸತಿ ಸಹಾಯ"),
];
