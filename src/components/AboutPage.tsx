import { Info, Github } from "lucide-react";
import { useTranslation } from "../hooks/use-translation";
import { useTauri } from "../hooks/use-tauri";

export default function AboutPage() {
  const { t } = useTranslation();
  const { isTauri } = useTauri();

  const platformText = isTauri() ? "Tauri" : "Web";
  const madeWithText = t("madeWith").replace("ile", `${platformText} ile`);
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Info className="w-8 h-8" />
        {t("about")}
      </h1>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="space-y-6">
          {/* App Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t("appTitle")}</h2>
            <p className="text-white/80 text-lg">{t("version")} 1.0.4</p>
            <p className="text-white/60 mt-2">{t("appDescription")}</p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("features")}</h3>
            <ul className="space-y-2 text-white/80">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t("realTimeData")}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t("beautifulUI")}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t("multiLanguage")}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t("themeCustomization")}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                {t("crossPlatform")}
              </li>
            </ul>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("technologies")}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                React
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                TypeScript
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Tailwind CSS
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                Tauri
              </span>
            </div>
          </div>

          {/* Credits */}
          <div>
            <h3 className="text-xl font-semibold mb-3">{t("credits")}</h3>
            <p className="text-white/80">
              {madeWithText} ❤️ {t("by")}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Github className="w-5 h-5" />
              <a
                href="https://github.com/GalaxySal/Whisper-Weather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors"
              >
                {t("viewOnGitHub")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
