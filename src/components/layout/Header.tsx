import { Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-card shadow-sm">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Logo and Company Name */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="text-lg font-bold text-foreground">MetaWare</span>
        </div>

        {/* Right side - Settings and Profile */}
        <div className="flex items-center gap-2">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={toggleTheme}>
                Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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