import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  UserCheck,
  Settings,
  HelpCircle,
  Shield,
  HeartPulse,
  Users,
  Stethoscope,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { doctorService } from "@/services/doctorService";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface DashboardSidebarProps {
  className?: string;
}

const DashboardSidebar = ({ className }: DashboardSidebarProps) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [unreadDoctorReports, setUnreadDoctorReports] = useState(0);
  const [familyCount, setFamilyCount] = useState(0);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) return;
      const adminStatus = await adminService.isAdmin();
      setIsAdmin(adminStatus);
      
      const doctorStatus = await doctorService.isVerifiedDoctor(user.id);
      setIsDoctor(doctorStatus);
      
      // Get unread doctor reports count
      const unreadCount = await doctorService.getUnreadReportCount(user.id);
      setUnreadDoctorReports(unreadCount);
    };
    checkRoles();
  }, [user]);

  useEffect(() => {
    const fetchFamilyCount = async () => {
      if (!user) return;

      const { count } = await supabase
        .from("family_connections")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .or(`inviter_id.eq.${user.id},member_id.eq.${user.id}`);

      setFamilyCount(count || 0);
    };
    fetchFamilyCount();
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      setDisplayName(data?.display_name || null);
      setAvatarUrl(data?.avatar_url || null);
    };
    fetchProfile();
  }, [user]);

  const userInitial = displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";
  const userName = displayName || user?.user_metadata?.full_name || "User";
  const userEmail = user?.email || "user@email.com";

  // Patient-only sidebar items
  const patientItems: SidebarItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Health Tools",
      href: "/health-tools",
      icon: HeartPulse,
    },
    {
      label: "Upload Report",
      href: "/upload",
      icon: Upload,
    },
    {
      label: "My Reports",
      href: "/history",
      icon: FileText,
    },
    {
      label: "Doctor Reports",
      href: "/doctor-reports",
      icon: Inbox,
      badge: unreadDoctorReports > 0 ? unreadDoctorReports : undefined,
    },
    {
      label: "Health Trends",
      href: "/trends",
      icon: TrendingUp,
    },
    {
      label: "Specialists",
      href: "/recommendations",
      icon: UserCheck,
    },
    {
      label: "Family",
      href: "/family",
      icon: Users,
      badge: familyCount > 0 ? familyCount : undefined,
    },
  ];

  // Doctor-only sidebar items
  const doctorItems: SidebarItem[] = [
    {
      label: "Doctor Dashboard",
      href: "/doctor",
      icon: Stethoscope,
    },
  ];

  // Admin-only sidebar items
  const adminItems: SidebarItem[] = [
    {
      label: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
    },
  ];

  // Common items for all roles
  const commonItems: SidebarItem[] = [
    {
      label: "Settings",
      href: "/profile",
      icon: Settings,
    },
    {
      label: "Help & Support",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  // Build sidebar based on role - doctors and admins don't see patient features
  const isPatient = !isDoctor && !isAdmin;
  
  const sidebarItems = [
    ...(isPatient ? patientItems : []),
    ...(isDoctor ? doctorItems : []),
    ...(isAdmin ? adminItems : []),
    ...commonItems,
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col w-64 border-r bg-sidebar min-h-[calc(100vh-4rem)]",
        className
      )}
    >
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info section at bottom */}
      <div className="p-4 border-t">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-sidebar-accent"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-semibold">
                {userInitial}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
