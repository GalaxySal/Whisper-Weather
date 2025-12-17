import { useEffect } from "react";
import { Moon, Sun, Monitor, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "../hooks/use-translation";
import { toast } from "sonner";
import { useLanguage } from "../hooks/use-language";
import { useTauri } from "../hooks/use-tauri";
import { useTheme } from "../hooks/use-theme";

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { loadSettings, isTauri } = useTauri();
  const { theme, setTheme, systemTheme } = useTheme();
  const { t } = useTranslation();

  // Load settings on mount
  useEffect(() => {
    loadSettings()
      .then((settings) => {
        toast.success(
          language === "tr" ? "Ayarlar yüklendi" : "Settings loaded",
          {
            description: JSON.stringify(settings),
            duration: 2000,
            position: "bottom-right",
          },
        );
      })
      .catch(() => {
        toast.error(
          language === "tr" ? "Ayarlar yüklenemedi" : "Failed to load settings",
          {
            duration: 3000,
            position: "bottom-right",
          },
        );
      });
  }, [loadSettings, language]);

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <SettingsIcon className="w-8 h-8" />
        {t("settings")}
      </h1>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("theme")}</h2>
            <div className="space-y-3">
              <button
                onClick={() => setTheme("light")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  theme === "light"
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5" />
                  <span>{t("light")}</span>
                </div>
                {theme === "light" && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5" />
                  <span>{t("dark")}</span>
                </div>
                {theme === "dark" && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setTheme("system")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  theme === "system"
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5" />
                  <span>
                    {t("system")} ({systemTheme})
                  </span>
                </div>
                {theme === "system" && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* Language Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("language")}</h2>
            <div className="space-y-3">
              <button
                onClick={() => setLanguage("en")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  language === "en"
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <span>English</span>
                {language === "en" && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </button>

              <button
                onClick={() => setLanguage("tr")}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  language === "tr"
                    ? "bg-white/20 border border-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <span>Türkçe</span>
                {language === "tr" && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </button>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{t("aboutApp")}</h2>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-white/80">Whisper Weather v1.0.4</p>
              <p className="text-white/60 text-sm mt-2">
                {t("appDescription")}
              </p>
              <div className="mt-3 text-sm text-white/50">
                <p>
                  {t("platform")}: {isTauri() ? "Tauri Desktop" : "Web Browser"}
                </p>
                <p>
                  {t("language")}: {language === "tr" ? "Türkçe" : "English"}
                </p>
                <p className="mt-2">
                  <a
                    href="https://github.com/GalaxySal/Whisper-Weather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {t("viewOnGitHub")}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
