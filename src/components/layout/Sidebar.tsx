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
    title: "Model",
    href: "/model",
    icon: Layers,
  },
  {
    title: "Glossary",
    href: "/glossary",
    icon: BookOpen,
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
    <aside className="fixed left-0 top-14 bottom-0 w-64 border-r border-sidebar-border bg-sidebar-background">
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
                  {expandedItems.includes(item.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                
                {expandedItems.includes(item.title) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-2 rounded-md text-sm transition-colors hover:bg-sidebar-item-hover",
                            isActive && "bg-sidebar-item-active text-primary font-medium"
                          )
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
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