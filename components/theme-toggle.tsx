"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {

  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="border border-neutral-700 px-3 py-2 rounded-md"
    >
      {theme === "dark"
        ? <Sun size={16} />
        : <Moon size={16} />
      }
    </button>
  )
}