import { useState, useEffect } from "react";

export type WallpaperTheme = "cosmic" | "obsidian";

let globalTheme: WallpaperTheme = (localStorage.getItem("void_wallpaper_theme") as WallpaperTheme) || "cosmic";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const [theme, setThemeState] = useState<WallpaperTheme>(globalTheme);

  useEffect(() => {
    const handleChange = () => {
      setThemeState(globalTheme);
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const applyThemeToDOM = (t: WallpaperTheme) => {
    document.documentElement.setAttribute("data-wallpaper-theme", t);
    document.body.setAttribute("data-wallpaper-theme", t);
  };

  useEffect(() => {
    applyThemeToDOM(globalTheme);
  }, []);

  const setTheme = (t: WallpaperTheme) => {
    globalTheme = t;
    localStorage.setItem("void_wallpaper_theme", t);
    applyThemeToDOM(t);
    notify();
  };

  const toggleTheme = () => {
    const nextTheme: WallpaperTheme = globalTheme === "cosmic" ? "obsidian" : "cosmic";
    setTheme(nextTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isObsidian: theme === "obsidian",
    isCosmic: theme === "cosmic",
  };
}
