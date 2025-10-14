import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  BarChart3,
  Database,
  Archive,
  Layers,
  BookOpen,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  children?: { title: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    title: "Start Here",
    href: "/start-here",
    icon: Home,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Metadata",
    href: "/metadata",
    icon: Database,
    children: [
      { title: "NameSpace", href: "/metadata/namespace" },
      { title: "Subject Area", href: "/metadata/subject-area" },
      { title: "Entity", href: "/metadata/entity" },
      { title: "Meta", href: "/metadata/meta" },
    ],
  },
  {
    title: "Staging",
    href: "/staging",
    icon: Archive,
  },
  {
    title: "Glossary",
    href: "/glossary",
    icon: BookOpen,
  },
  {
    title: "Model",
    href: "/model",
    icon: Layers,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Shield,
  },
];

export const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['Metadata']);
  const location = useLocation();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 border-r border-sidebar-border bg-sidebar-background z-30">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive(item.href) && "bg-sidebar-item-active text-primary"
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  <div className={cn(
                    "transition-transform duration-200",
                    expandedItems.includes(item.title) ? "rotate-90" : "rotate-0"
                  )}>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Button>
                
                <div className={cn(
                  "ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                  expandedItems.includes(item.title) 
                    ? "max-h-96 opacity-100" 
                    : "max-h-0 opacity-0"
                )}>
                  {item.children.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={({ isActive }) =>
                        cn(
                          "block px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-sidebar-item-hover transform hover:translate-x-1",
                          isActive && "bg-sidebar-item-active text-primary font-medium"
                        )
                      }
                    >
                      {child.title}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : (
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-item-hover",
                    isActive && "bg-sidebar-item-active text-primary font-medium"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};