import { useState, useEffect, useCallback } from "react";
import { useTauri } from "./use-tauri";

type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const { saveSettings, loadSettings } = useTauri();

  // Check system theme
  const checkSystemTheme = useCallback(async () => {
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI__;

    if (isTauri) {
      try {
        // Use Tauri command to get system theme
        const { invoke } = (window as any).__TAURI__.core;
        const systemTheme = (await invoke("get_system_theme")) as
          | "light"
          | "dark";
        setSystemTheme(systemTheme);
        return systemTheme;
      } catch (error) {
        console.error("Failed to get system theme:", error);
        // Fallback to default light theme
        setSystemTheme("light");
        return "light";
      }
    }

    // Web environment - use matchMedia
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      setSystemTheme(systemTheme);
      return systemTheme;
    }

    // Fallback
    setSystemTheme("light");
    return "light";
  }, []);

  // Load theme from settings
  const loadTheme = useCallback(async () => {
    try {
      // Check if we're in Tauri environment
      const isTauri =
        typeof window !== "undefined" && (window as any).__TAURI__;

      if (isTauri) {
        const settings = await loadSettings();
        const savedTheme = settings?.theme || "system";
        setTheme(savedTheme as Theme);
      } else {
        // Web environment - use localStorage
        const savedTheme = localStorage.getItem("theme") || "system";
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
      setTheme("system");
    }
  }, [loadSettings]);

  // Save theme
  const saveTheme = useCallback(
    async (newTheme: Theme) => {
      try {
        const isTauri =
          typeof window !== "undefined" && (window as any).__TAURI__;

        if (isTauri) {
          const settings = await loadSettings();
          await saveSettings(settings.language || "tr", newTheme);
        } else {
          // Web environment - use localStorage
          localStorage.setItem("theme", newTheme);
        }

        setTheme(newTheme);
      } catch (error) {
        console.error("Failed to save theme:", error);
        // Still update local state even if save fails
        setTheme(newTheme);
      }
    },
    [loadSettings, saveSettings],
  );

  // Get current active theme
  const getCurrentTheme = useCallback(() => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply theme to document
  const applyTheme = useCallback(() => {
    const currentTheme = getCurrentTheme();
    const root = document.documentElement;

    if (currentTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    // Force Tailwind to update in Tauri environment
    if (typeof window !== "undefined") {
      // Add a data attribute for additional theme tracking
      root.setAttribute("data-theme", currentTheme);

      // Trigger a reflow to ensure Tailwind updates
      void root.offsetWidth;
    }
  }, [getCurrentTheme]);

  // Listen for Rust-triggered theme changes
  const listenToRustThemeChanges = useCallback(() => {
    const isTauri = typeof window !== "undefined" && (window as any).__TAURI__;

    if (isTauri) {
      const { listen } = (window as any).__TAURI__.event;

      // Listen for system theme changes from Rust
      listen("system-theme-changed", (event: any) => {
        const rustSystemTheme = event.payload as "light" | "dark";
        setSystemTheme(rustSystemTheme);
      })
        .then((unlisten: () => void) => {
          // Store unlisten function for cleanup
          return unlisten;
        })
        .catch((error: Error) => {
          console.error("Failed to listen to system theme changes:", error);
          return () => {}; // Return no-op function on error
        });
    }

    return Promise.resolve(() => {}); // No-op for web environment
  }, []);

  // Get weather-based gradient
  const getWeatherGradient = useCallback(
    (weatherMain?: string) => {
      const currentTheme = getCurrentTheme();

      if (weatherMain) {
        switch (weatherMain.toLowerCase()) {
          case "clear":
            return currentTheme === "dark"
              ? "from-slate-900 via-slate-800 to-slate-900"
              : "from-blue-400 via-blue-500 to-blue-600";
          case "clouds":
            return currentTheme === "dark"
              ? "from-gray-900 via-gray-800 to-gray-900"
              : "from-gray-400 via-gray-500 to-gray-600";
          case "rain":
          case "drizzle":
            return currentTheme === "dark"
              ? "from-slate-800 via-slate-700 to-slate-800"
              : "from-gray-500 via-gray-600 to-gray-700";
          case "snow":
            return currentTheme === "dark"
              ? "from-slate-700 via-slate-600 to-slate-700"
              : "from-gray-200 via-gray-300 to-gray-400";
          case "thunderstorm":
            return currentTheme === "dark"
              ? "from-purple-900 via-purple-800 to-purple-900"
              : "from-purple-600 via-purple-700 to-purple-800";
          case "mist":
          case "fog":
            return currentTheme === "dark"
              ? "from-gray-800 via-gray-700 to-gray-800"
              : "from-gray-300 via-gray-400 to-gray-500";
          default:
            return currentTheme === "dark"
              ? "from-slate-900 via-slate-800 to-slate-900"
              : "from-blue-400 via-blue-500 to-blue-600";
        }
      }

      // Default gradients
      return currentTheme === "dark"
        ? "from-slate-900 via-slate-800 to-slate-900"
        : "from-blue-400 via-blue-500 to-blue-600";
    },
    [getCurrentTheme],
  );

  useEffect(() => {
    const initializeTheme = async () => {
      await checkSystemTheme();
      await loadTheme();
    };

    initializeTheme();

    // Set up Rust theme change listener
    listenToRustThemeChanges()
      .then((unlisten: () => void) => {
        return unlisten;
      })
      .catch((error: Error) => {
        console.error("Failed to set up theme listener:", error);
      });

    // Cleanup function
    return () => {
      // Unlisten will be called when the component unmounts
    };
  }, [checkSystemTheme, listenToRustThemeChanges, loadTheme]);

  useEffect(() => {
    applyTheme();
  }, [theme, systemTheme, applyTheme]);

  return {
    theme,
    systemTheme,
    setTheme: saveTheme,
    getCurrentTheme,
    getWeatherGradient,
  };
}
