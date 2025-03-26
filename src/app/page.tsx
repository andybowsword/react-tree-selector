"use client";

import React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Github, Moon, Sun } from "lucide-react";

import { TreeSelectorDemo } from "./_components/tree-selector-demo";

const GITHUB_REPO_URL = "https://github.com/riad-azz/react-tree-selector";

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container mx-auto p-4 min-h-screen">
      {/* --- Header --- */}
      <header className="flex items-center justify-between pb-4 mb-8 border-b">
        <h1 className="text-2xl font-bold">TreeSelector Showcase</h1>
        <div className="flex items-center space-x-2">
          {/* GitHub Link Button */}
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" aria-label="GitHub Repository">
              <Github className="h-5 w-5" />
            </Button>
          </a>

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main>
        <TreeSelectorDemo />
      </main>
    </div>
  );
}
