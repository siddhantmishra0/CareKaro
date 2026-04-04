import { Menu, User, LogOut, Shield, Stethoscope, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { adminService } from "@/services/adminService";
import { doctorService } from "@/services/doctorService";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch user profile for avatar
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("user_id", user.id)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user role
  const { data: userRole } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user?.id) return "patient";
      const [isAdmin, isDoctor] = await Promise.all([
        adminService.isAdmin(),
        doctorService.isVerifiedDoctor(user.id),
      ]);
      if (isAdmin) return "admin";
      if (isDoctor) return "doctor";
      return "patient";
    },
    enabled: !!user?.id,
  });

  const getRoleBadge = () => {
    if (!userRole) return null;
    
    switch (userRole) {
      case "admin":
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case "doctor":
        return (
          <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
            <Stethoscope className="h-3 w-3" />
            Doctor
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Heart className="h-3 w-3" />
            Patient
          </Badge>
        );
    }
  };
  
  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  // const authNavItems = [
  //   { label: "Dashboard", href: "/dashboard" },
  //   { label: "Upload Report", href: "/upload" },
  //   { label: "My Reports", href: "/history" },
  //   { label: "Health Trends", href: "/trends" },
  //   { label: "Recommendations", href: "/recommendations" },
  // ];

  const publicNavItems = [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-heading font-bold text-xl text-foreground">
              CareKaro
            </span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <></>
          ) : (
            publicNavItems.map((item) => (
              <NavLink key={item.href} to={item.href}>
                {item.label}
              </NavLink>
            ))
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || "User"} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{profile?.display_name || "User"}</p>
                        {getRoleBadge()}
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link to="/auth/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link to="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <Button asChild className="justify-start">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <Button onClick={handleSignOut} variant="outline" className="justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="justify-start">
                      <Link to="/auth/signup">Get Started</Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/auth/login">Sign In</Link>
                    </Button>
                    <div className="border-t my-4" />
                    {publicNavItems.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
                {user && (
                  <>
                      
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
