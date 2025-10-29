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
    const savedTheme = localStorage.getItem('theme') || 'light-default';
    applyTheme(savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const [mode, scheme] = themeName.split('-');
    
    document.documentElement.classList.remove(
      'dark', 
      'theme-ocean-light', 'theme-ocean-dark',
      'theme-sunset-light', 'theme-sunset-dark',
      'theme-forest-light', 'theme-forest-dark',
      'theme-purple-light', 'theme-purple-dark'
    );
    
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    }
    
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
    <>
      <style>{`
        .header-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          height: 3.5rem;
          border-bottom: 1px solid hsl(var(--border));
          background-color: hsl(var(--card));
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        .header-inner {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: space-between;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }

        .header-logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-logo-wrapper {
          height: 2rem;
          width: 2rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: hsl(var(--primary) / 0.1);
          margin-right: 10px;
        }

        .dark .header-logo-wrapper {
          background-color: transparent;
        }

        .header-logo-light {
          height: 2rem;
          width: 2rem;
          object-fit: contain;
          filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));
          display: none;
        }

        .dark .header-logo-light {
          display: block;
        }

        .header-logo-dark {
          height: 1.75rem;
          width: 1.75rem;
          object-fit: contain;
          filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.07));
        }

        .dark .header-logo-dark {
          display: none;
        }

        .header-name-dark {
          height: 1.5rem;
          object-fit: contain;
        }

        .dark .header-name-dark {
          display: none;
        }

        .header-name-light {
          height: 1.5rem;
          object-fit: contain;
          display: none;
        }

        .dark .header-name-light {
          display: block;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-button {
          height: 2rem;
          width: 2rem;
          padding: 0;
        }

        .header-button-icon {
          height: 1rem;
          width: 1rem;
        }

        .header-dropdown {
          width: 12rem;
        }

        .header-dropdown-wide {
          width: 14rem;
        }

        .header-menu-item-active {
          background-color: hsl(var(--accent));
        }
      `}</style>

      <header className="header-container">
        <div className="header-inner">
          <div className="header-logo-section">
            <div className="header-logo-wrapper">
              <img 
                src="/images/Metaware Logo White.png" 
                alt="MetaWare Logo" 
                className="header-logo-light" 
              />
              <img 
                src="/images/Metaware Logo White.png" 
                alt="MetaWare Logo" 
                className="header-logo-dark" 
              />
            </div>
            <img 
              src="/images/Metaware Name Dark.png" 
              alt="MetaWare" 
              className="header-name-dark"
            />
            <img 
              src="/images/Metaware Name White.png" 
              alt="MetaWare" 
              className="header-name-light"
            />
          </div>

          <div className="header-actions">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="header-button" title="Change Theme">
                  <Palette className="header-button-icon" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="header-dropdown-wide">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Light Mode</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {colorSchemes.map((scheme) => (
                      <DropdownMenuItem
                        key={`light-${scheme.value}`}
                        onClick={() => handleThemeChange('light', scheme.value)}
                        className={currentTheme === `light-${scheme.value}` ? "header-menu-item-active" : ""}
                      >
                        {scheme.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Dark Mode</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {colorSchemes.map((scheme) => (
                      <DropdownMenuItem
                        key={`dark-${scheme.value}`}
                        onClick={() => handleThemeChange('dark', scheme.value)}
                        className={currentTheme === `dark-${scheme.value}` ? "header-menu-item-active" : ""}
                      >
                        {scheme.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="header-button">
                  <Settings className="header-button-icon" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="header-dropdown">
                <DropdownMenuItem>
                  General Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Data Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="header-button">
                  <User className="header-button-icon" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="header-dropdown">
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
    </>
  );
};