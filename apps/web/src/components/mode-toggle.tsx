import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

const cycle = ["light", "dark", "system"] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const next = () => {
    const idx = cycle.indexOf(theme as (typeof cycle)[number]);
    setTheme(cycle[(idx + 1) % cycle.length]);
  };

  return (
    <Button variant="ghost" size="icon-lg" onClick={next}>
      {mounted ? (
        <>
          {theme === "light" && <Sun />}
          {theme === "dark" && <Moon />}
          {theme === "system" && <Monitor />}
        </>
      ) : (
        <Monitor className="opacity-0" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
