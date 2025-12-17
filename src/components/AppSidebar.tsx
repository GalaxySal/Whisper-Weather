import {
  Home,
  Settings,
  Info,
  BarChart3,
  Download,
  Gamepad2,
} from "lucide-react";
import { useTranslation } from "../hooks/use-translation";
import { toast } from "sonner";

interface AppSidebarProps {
  currentPage:
    | "home"
    | "settings"
    | "about"
    | "updates"
    | "explorer"
    | "zentaira";
  onPageChange: (
    page: "home" | "settings" | "about" | "updates" | "explorer" | "zentaira",
  ) => void;
}

export default function AppSidebar({
  currentPage,
  onPageChange,
}: AppSidebarProps) {
  const { t, language } = useTranslation();

  const handleNavigation = (
    page: "home" | "settings" | "about" | "updates" | "explorer" | "zentaira",
  ) => {
    onPageChange(page);

    // Toast bildirimleri
    const messages = {
      home: language === "tr" ? "Ana sayfa" : "Home",
      settings: language === "tr" ? "Ayarlar" : "Settings",
      about: language === "tr" ? "Hakkında" : "About",
      updates: language === "tr" ? "Güncellemeler" : "Updates",
      explorer: language === "tr" ? "Keşif Merkezi" : "Weather Explorer",
      zentaira: language === "tr" ? "Zentaira" : "Zentaira",
    };

    toast.info(messages[page], {
      description:
        language === "tr"
          ? `${messages[page]} sayfasına gidiliyor`
          : `Navigating to ${messages[page]}`,
      duration: 2000,
      position: "bottom-right",
    });
  };
  return (
    <div className="flex flex-col items-center py-4 space-y-4">
      {/* Logo */}
      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
        <Home className="w-5 h-5 text-white" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-2">
        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "home"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("home")}
          title={t("home")}
        >
          <Home className="w-4 h-4" />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "explorer"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("explorer")}
          title={t("weatherExplorer")}
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "updates"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("updates")}
          title={t("updates")}
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "zentaira"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("zentaira")}
          title="Zentaira"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "settings"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("settings")}
          title={t("settings")}
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentPage === "about"
              ? "bg-white/20 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
          onClick={() => handleNavigation("about")}
          title={t("about")}
        >
          <Info className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
