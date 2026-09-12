import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, Menu, X, ScanLine, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/Logo";
import SidebarIcon from "@/components/layout/SidebarIcon";
import ThemeToggle from "@/components/layout/ThemeToggle";

const BASE_NAV_ITEMS = [
  { label: "Dashboard", path: "/", iconKey: "dashboard" },
  { label: "New Estimate", path: "/estimate/new", iconKey: "new-estimate" },
  { label: "Customers", path: "/customers", iconKey: "customers" },
  { label: "Settings", path: "/settings", iconKey: "settings" },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role } = useAuth();

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(role === "admin" || role === "owner"
      ? [{ label: "Admin", path: "/admin", lucideIcon: Shield }]
      : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="px-4 pt-3 pb-1">
          <Logo />
        </div>
        <nav className="flex-1 px-3 pt-1 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path || 
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-gradient-to-r from-primary/25 to-primary/5 text-foreground border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {item.lucideIcon ? (
                  <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
                    <item.lucideIcon className="w-5 h-5" />
                  </div>
                ) : (
                  <SidebarIcon name={item.iconKey} className="w-[30px] h-[30px]" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/50 space-y-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 w-full transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4">
        <Logo size="sm" showTagline={false} />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-card border-b border-border p-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.lucideIcon ? (
                  <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
                    <item.lucideIcon className="w-5 h-5" />
                  </div>
                ) : (
                  <SidebarIcon name={item.iconKey} className="w-[30px] h-[30px]" />
                )}
                  {item.label}
                </Link>
              );
            })}
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <Outlet />
      </main>
    </div>
  );
}