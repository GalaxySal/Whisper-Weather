import { useState } from "react";
import "./App.css";
import AppSidebar from "./components/AppSidebar";
import HomePage from "./components/HomePage";
import SettingsPage from "./components/SettingsPage";
import AboutPage from "./components/AboutPage";
import Updates from "./components/Updates";
import WeatherExplorer from "./components/WeatherExplorer";
import Zentaira from "./components/Zentaira";
import { useLanguage } from "./hooks/use-language";
import { useTauri } from "./hooks/use-tauri";
import { useTheme } from "./hooks/use-theme";

type Page = "home" | "settings" | "about" | "updates" | "explorer" | "zentaira";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const { language } = useLanguage();
  const { isTauri } = useTauri();
  const { getWeatherGradient } = useTheme();

  // Debug - platform and language info
  console.log(
    `App running on: ${isTauri() ? "Tauri Desktop" : "Web Browser"}, Language: ${language}`,
  );

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage />;
      case "settings":
        return <SettingsPage />;
      case "about":
        return <AboutPage />;
      case "updates":
        return <Updates />;
      case "explorer":
        return <WeatherExplorer />;
      case "zentaira":
        return <Zentaira />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div
      className={`flex min-h-screen bg-gradient-to-br ${getWeatherGradient()}`}
    >
      {/* Sidebar */}
      <div className="w-16 bg-white/10 backdrop-blur-md border-r border-white/20">
        <AppSidebar
          currentPage={currentPage}
          onPageChange={(page: Page) => setCurrentPage(page)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">{renderPage()}</div>
      </div>
    </div>
  );
}
