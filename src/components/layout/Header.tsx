import { Settings, User, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { name: 'Light', value: 'light', className: '' },
  { name: 'Dark', value: 'dark', className: 'dark' },
  { name: 'Ocean', value: 'ocean', className: 'theme-ocean' },
  { name: 'Sunset', value: 'sunset', className: 'theme-sunset' },
  { name: 'Forest', value: 'forest', className: 'theme-forest' },
  { name: 'Purple', value: 'purple', className: 'theme-purple' },
];

export const Header = () => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const theme = themes.find(t => t.value === themeName);
    if (!theme) return;

    // Remove all theme classes
    document.documentElement.classList.remove('dark', 'theme-ocean', 'theme-sunset', 'theme-forest', 'theme-purple');
    
    // Apply new theme class
    if (theme.className) {
      document.documentElement.classList.add(theme.className);
    }
  };

  const handleThemeChange = (themeName: string) => {
    applyTheme(themeName);
    localStorage.setItem('theme', themeName);
    setCurrentTheme(themeName);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Logo and Company Name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded flex items-center justify-center">
            <img 
              src="/images/Metaware Logo White.png" 
              alt="MetaWare Logo" 
              className="h-8 w-8 object-contain drop-shadow-md dark:brightness-100 brightness-0 dark:invert-0 invert" 
            />
          </div>
          <span className="text-lg font-bold text-foreground">MetaWare</span>
        </div>

        {/* Right side - Theme, Settings and Profile */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Change Theme">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {themes.map((theme) => (
                <DropdownMenuItem
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={currentTheme === theme.value ? "bg-accent" : ""}
                >
                  {theme.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                General Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Data Preferences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Account Management
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};