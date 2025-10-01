import { Settings, User, Palette } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const colorSchemes = [
  { name: 'Default', value: 'default' },
  { name: 'Ocean', value: 'ocean' },
  { name: 'Sunset', value: 'sunset' },
  { name: 'Forest', value: 'forest' },
  { name: 'Purple', value: 'purple' },
];

export const Header = () => {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme preference or default to light mode with default colors
    const savedTheme = localStorage.getItem('theme') || 'light-default';
    applyTheme(savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const [mode, scheme] = themeName.split('-');
    
    // Remove all theme classes
    document.documentElement.classList.remove(
      'dark', 
      'theme-ocean-light', 'theme-ocean-dark',
      'theme-sunset-light', 'theme-sunset-dark',
      'theme-forest-light', 'theme-forest-dark',
      'theme-purple-light', 'theme-purple-dark'
    );
    
    // Apply mode
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
    // Apply color scheme
    if (scheme && scheme !== 'default') {
      document.documentElement.classList.add(`theme-${scheme}-${mode}`);
    }
  };

  const handleThemeChange = (mode: string, scheme: string) => {
    const themeName = `${mode}-${scheme}`;
    applyTheme(themeName);
    localStorage.setItem('theme', themeName);
    setCurrentTheme(themeName);
  };

  const getCurrentMode = () => currentTheme.split('-')[0];
  const getCurrentScheme = () => currentTheme.split('-')[1] || 'default';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Logo and Company Name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded flex items-center justify-center" style={{ marginRight: '10px' }}>
            <img 
              src="/images/Metaware Logo White.png" 
              alt="MetaWare Logo" 
              className="h-8 w-8 object-contain drop-shadow-md hidden dark:block" 
            />
            <img 
              src="/images/Metaware Logo White.png" 
              alt="MetaWare Logo" 
              className="h-8 w-8 object-contain drop-shadow-md dark:hidden brightness-0 invert" 
            />
          </div>
          <img 
            src="/images/Metaware Name Dark.png" 
            alt="MetaWare" 
            className="h-6 object-contain dark:hidden"
          />
          <img 
            src="/images/Metaware Name White.png" 
            alt="MetaWare" 
            className="h-6 object-contain hidden dark:block"
          />
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
            <DropdownMenuContent align="end" className="w-48">
              {/* Light Mode with Color Schemes */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Light Mode</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {colorSchemes.map((scheme) => (
                    <DropdownMenuItem
                      key={`light-${scheme.value}`}
                      onClick={() => handleThemeChange('light', scheme.value)}
                      className={currentTheme === `light-${scheme.value}` ? "bg-accent" : ""}
                    >
                      {scheme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Dark Mode with Color Schemes */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Dark Mode</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {colorSchemes.map((scheme) => (
                    <DropdownMenuItem
                      key={`dark-${scheme.value}`}
                      onClick={() => handleThemeChange('dark', scheme.value)}
                      className={currentTheme === `dark-${scheme.value}` ? "bg-accent" : ""}
                    >
                      {scheme.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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