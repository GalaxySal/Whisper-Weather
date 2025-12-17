import { invoke } from "@tauri-apps/api/core";

const isTauri = () => {
  return (
    typeof window !== "undefined" && (window as any).__TAURI__ !== undefined
  );
};

export function useTauri() {
  const loadSettings = async () => {
    if (isTauri()) {
      return await invoke("load_settings");
    } else {
      const stored = localStorage.getItem("whisper-weather-settings");
      if (stored) {
        return JSON.parse(stored);
      }
      return { language: "tr", theme: "system" };
    }
  };

  const saveSettings = async (language: string, theme: string) => {
    if (isTauri()) {
      return await invoke("save_settings", { language, theme });
    } else {
      const settings = { language, theme };
      localStorage.setItem(
        "whisper-weather-settings",
        JSON.stringify(settings),
      );
    }
  };

  const searchCities = async (query: string) => {
    if (isTauri()) {
      return await invoke("search_cities", { query });
    } else {
      const turkishCities = [
        "İstanbul",
        "Ankara",
        "İzmir",
        "Bursa",
        "Adana",
        "Gaziantep",
        "Konya",
        "Antalya",
        "Diyarbakır",
        "Mersin",
        "Kayseri",
        "Eskişehir",
      ];
      return turkishCities.filter((city) =>
        city.toLowerCase().includes(query.toLowerCase()),
      );
    }
  };

  const saveFavoriteCities = async (cities: string[]) => {
    if (isTauri()) {
      return await invoke("save_favorite_cities", { cities });
    } else {
      localStorage.setItem("whisper-weather-favorites", JSON.stringify(cities));
    }
  };

  const loadFavoriteCities = async (): Promise<string[]> => {
    if (isTauri()) {
      return await invoke("load_favorite_cities");
    } else {
      const stored = localStorage.getItem("whisper-weather-favorites");
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    }
  };

  return {
    loadSettings,
    saveSettings,
    searchCities,
    saveFavoriteCities,
    loadFavoriteCities,
    isTauri,
  };
}
