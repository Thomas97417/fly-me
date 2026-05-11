import { Moon, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const cycle = ["light", "dark", "system"] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const idx = cycle.indexOf(theme as (typeof cycle)[number]);
    setTheme(cycle[(idx + 1) % cycle.length]);
  };

  return (
    <Button variant="ghost" size="icon-lg" onClick={next}>
      {theme === "light" && <Sun />}
      {theme === "dark" && <Moon />}
      {theme === "system" && <Monitor />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
