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
    <>
      <style>{`
        .sidebar-container {
          position: fixed;
          left: 0;
          top: 3.5rem;
          bottom: 0;
          width: 16rem;
          border-right: 1px solid hsl(var(--sidebar-border));
          background-color: hsl(var(--sidebar-background));
          z-index: 30;
        }

        .sidebar-nav {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-parent-button {
          width: 100%;
          justify-content: flex-start;
          gap: 0.75rem;
          height: 2.5rem;
        }

        .sidebar-parent-button-active {
          background-color: hsl(var(--sidebar-item-active));
          color: hsl(var(--primary));
        }

        .sidebar-parent-icon {
          height: 1rem;
          width: 1rem;
        }

        .sidebar-parent-text {
          flex: 1;
          text-align: left;
        }

        .sidebar-chevron {
          transition: transform 200ms;
        }

        .sidebar-chevron-expanded {
          transform: rotate(90deg);
        }

        .sidebar-children-container {
          margin-left: 1.5rem;
          margin-top: 0.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow: hidden;
          transition: all 300ms ease-in-out;
        }

        .sidebar-children-expanded {
          max-height: 24rem;
          opacity: 1;
        }

        .sidebar-children-collapsed {
          max-height: 0;
          opacity: 0;
        }

        .sidebar-child-link {
          display: block;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: all 200ms;
        }

        .sidebar-child-link:hover {
          background-color: hsl(var(--sidebar-item-hover));
          transform: translateX(0.25rem);
        }

        .sidebar-child-link-active {
          background-color: hsl(var(--sidebar-item-active));
          color: hsl(var(--primary));
          font-weight: 500;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          transition: colors 200ms;
        }

        .sidebar-link:hover {
          background-color: hsl(var(--sidebar-item-hover));
        }

        .sidebar-link-active {
          background-color: hsl(var(--sidebar-item-active));
          color: hsl(var(--primary));
          font-weight: 500;
        }

        .sidebar-link-icon {
          height: 1rem;
          width: 1rem;
        }
      `}</style>

      <aside className="sidebar-container">
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "sidebar-parent-button",
                      isActive(item.href) && "sidebar-parent-button-active"
                    )}
                    onClick={() => toggleExpanded(item.title)}
                  >
                    <item.icon className="sidebar-parent-icon" />
                    <span className="sidebar-parent-text">{item.title}</span>
                    <div className={cn(
                      "sidebar-chevron",
                      expandedItems.includes(item.title) && "sidebar-chevron-expanded"
                    )}>
                      <ChevronRight className="sidebar-parent-icon" />
                    </div>
                  </Button>
                  
                  <div className={cn(
                    "sidebar-children-container",
                    expandedItems.includes(item.title) 
                      ? "sidebar-children-expanded" 
                      : "sidebar-children-collapsed"
                  )}>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.href}
                        to={child.href}
                        className={({ isActive }) =>
                          cn(
                            "sidebar-child-link",
                            isActive && "sidebar-child-link-active"
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
                      "sidebar-link",
                      isActive && "sidebar-link-active"
                    )
                  }
                >
                  <item.icon className="sidebar-link-icon" />
                  {item.title}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};