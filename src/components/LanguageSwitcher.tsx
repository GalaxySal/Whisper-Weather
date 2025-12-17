import { Languages } from "lucide-react";
import { useLanguage } from "../hooks/use-language";
import { useTranslation } from "../hooks/use-translation";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Languages className="w-4 h-4 text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
          <button
            onClick={() => {
              setLanguage("tr");
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900 rounded-t-xl"
          >
            {t("turkish")}
          </button>
          <button
            onClick={() => {
              setLanguage("en");
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors text-gray-900 rounded-b-xl"
          >
            {t("english")}
          </button>
        </div>
      )}
    </div>
  );
}
