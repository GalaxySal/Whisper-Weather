"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { useEffect, useState } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const ResponsiveToaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const getToastStyles = () => {
    const baseStyles = {
      position: "fixed" as const,
      bottom: isMobile ? "10px" : "20px",
      right: isMobile ? "10px" : "20px",
      zIndex: 9999,
      fontSize: isMobile ? "14px" : "16px",
      maxWidth: isMobile ? "calc(100vw - 40px)" : "400px",
      width: isMobile ? "auto" : "auto",
    };

    return baseStyles;
  };

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={getToastStyles()}
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "group-[.toaster]:bg-background",
            "group-[.toaster]:text-foreground",
            "group-[.toaster]:border-border",
            "group-[.toaster]:shadow-lg",
            isMobile ? "max-w-[calc(100vw-40px)]" : "max-w-[400px]",
            "transition-all duration-300 ease-in-out",
          ].join(" "),
          description: [
            "group-[.toast]:text-muted-foreground",
            isMobile ? "text-sm" : "text-base",
          ].join(" "),
          actionButton: [
            "group-[.toast]:bg-primary",
            "group-[.toast]:text-primary-foreground",
            isMobile ? "text-xs px-2 py-1" : "text-sm px-3 py-2",
          ].join(" "),
          cancelButton: [
            "group-[.toast]:bg-muted",
            "group-[.toast]:text-muted-foreground",
            isMobile ? "text-xs px-2 py-1" : "text-sm px-3 py-2",
          ].join(" "),
        },
      }}
      position="bottom-right"
      {...props}
    />
  );
};

export { ResponsiveToaster as Toaster };
