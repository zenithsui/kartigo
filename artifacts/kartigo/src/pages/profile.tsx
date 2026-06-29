import { useAuth } from "@workspace/replit-auth-web";
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { User, Package, Heart, MapPin, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const menuItems = [
  { icon: Package, label: "My Orders", href: "/orders", desc: "Track, cancel, or return" },
  { icon: Heart, label: "Wishlist", href: "/wishlist", desc: "Saved for later" },
  { icon: MapPin, label: "Addresses", href: "/checkout", desc: "Manage delivery addresses" },
];

export default function ProfilePage() {
  const { isAuthenticated, login, logout } = useAuth();
  const { data: user } = useGetCurrentUser({ query: { enabled: isAuthenticated, queryKey: getGetCurrentUserQueryKey() } });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <User className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
          <Button onClick={login} className="kartigo-gradient border-0" data-testid="button-login-profile">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const u = user as any;
  const name = u?.name || u?.email?.split("@")[0] || "User";
  const initials = name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>My Account</h1>

        {/* Profile card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6" data-testid="profile-card">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={u?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold" data-testid="text-user-name">{name}</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-user-email">{u?.email}</p>
              {u?.phone && <p className="text-sm text-muted-foreground">{u.phone}</p>}
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{u?.role ?? "BUYER"}</span>
            </div>
          </div>
        </div>

        {/* Referral */}
        {u?.referralCode && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6" data-testid="referral-card">
            <h3 className="font-semibold mb-2">Your Referral Code</h3>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono font-bold text-primary text-lg tracking-wider" data-testid="text-referral-code">{u.referralCode}</code>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(u.referralCode)} data-testid="button-copy-code">Copy</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share your code and earn rewards when friends shop!</p>
          </div>
        )}

        {/* Menu items */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-6" data-testid="profile-menu">
          {menuItems.map((item, i) => (
            <div key={item.href}>
              <Link href={item.href} data-testid={`link-profile-menu-${i}`}>
                <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </Link>
              {i < menuItems.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-white" onClick={logout} data-testid="button-logout-profile">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </main>
      <Footer />
    </div>
  );
}
