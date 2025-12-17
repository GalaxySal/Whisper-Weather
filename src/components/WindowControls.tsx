import { Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function WindowControls() {
  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (error) {
      console.error("Minimize error:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      await getCurrentWindow().toggleMaximize();
    } catch (error) {
      console.error("Maximize error:", error);
    }
  };

  const handleClose = async () => {
    try {
      await getCurrentWindow().close();
    } catch (error) {
      console.error("Close error:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3">
      <button
        onClick={handleMinimize}
        className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-all duration-200 flex items-center justify-center no-drag hover:scale-110 shadow-sm"
        aria-label="Minimize"
      >
        <Minus className="w-1.5 h-1.5 text-yellow-900" strokeWidth={3} />
      </button>
      <button
        onClick={handleMaximize}
        className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-all duration-200 flex items-center justify-center no-drag hover:scale-110 shadow-sm"
        aria-label="Maximize"
      >
        <Square className="w-1.5 h-1.5 text-green-900" strokeWidth={3} />
      </button>
      <button
        onClick={handleClose}
        className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-all duration-200 flex items-center justify-center no-drag hover:scale-110 shadow-sm"
        aria-label="Close"
      >
        <X className="w-1.5 h-1.5 text-red-900" strokeWidth={3} />
      </button>
    </div>
  );
}
