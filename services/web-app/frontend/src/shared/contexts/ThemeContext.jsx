/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("normal");
  const [enableVoice, setEnableVoice] = useState(false);

  // 載入使用者偏好設定
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedFontSize = localStorage.getItem("fontSize") || "normal";
    const savedVoice = localStorage.getItem("enableVoice") === "true";

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setEnableVoice(savedVoice);

    // 應用主題
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font-size", savedFontSize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size);
    document.documentElement.setAttribute("data-font-size", size);
  };

  const toggleVoice = () => {
    const newValue = !enableVoice;
    setEnableVoice(newValue);
    localStorage.setItem("enableVoice", String(newValue));
  };

  // 語音合成功能
  const speak = (text) => {
    if (!enableVoice || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-TW";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const value = {
    theme,
    fontSize,
    enableVoice,
    toggleTheme,
    changeFontSize,
    toggleVoice,
    speak,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
