import { useAuth } from "@workspace/replit-auth-web";
import { useGetRewardsBalance, useGetRewardsHistory, getGetRewardsBalanceQueryKey, getGetRewardsHistoryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Coins, TrendingUp, Gift, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function RewardsPage() {
  const { isAuthenticated, login } = useAuth();
  const { data: balance, isLoading: balanceLoading } = useGetRewardsBalance({ query: { enabled: isAuthenticated, queryKey: getGetRewardsBalanceQueryKey() } });
  const { data: history = [], isLoading: historyLoading } = useGetRewardsHistory({ query: { enabled: isAuthenticated, queryKey: getGetRewardsHistoryQueryKey() } });

  const b = balance as any;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Coins className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Rewards</h2>
          <p className="text-muted-foreground mb-6">Sign in to check your rewards balance</p>
          <Button onClick={login} className="kartigo-gradient border-0" data-testid="button-login-rewards">Sign In</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>Rewards</h1>

        {/* Balance card */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 text-white mb-6" data-testid="balance-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-80">Your Balance</p>
            <Coins className="w-8 h-8 opacity-80" />
          </div>
          {balanceLoading ? (
            <Skeleton className="h-10 w-32 bg-white/30" />
          ) : (
            <p className="text-4xl font-bold" data-testid="text-balance">{b?.balance?.toLocaleString() ?? 0}</p>
          )}
          <p className="text-sm opacity-80 mt-1">= ₹{((b?.balance ?? 0) * 0.1).toFixed(0)} cashback value</p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
              <p className="text-xs opacity-70">Lifetime Earned</p>
              <p className="font-bold" data-testid="text-lifetime-earned">{b?.lifetimeEarned?.toLocaleString() ?? 0}</p>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center">
              <p className="text-xs opacity-70">Lifetime Redeemed</p>
              <p className="font-bold" data-testid="text-lifetime-redeemed">{b?.lifetimeRedeemed?.toLocaleString() ?? 0}</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6" data-testid="how-it-works">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> How Rewards Work</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-muted/50 rounded-xl">
              <div className="text-2xl mb-1">🛍️</div>
              <p className="text-xs font-medium">Shop & Earn</p>
              <p className="text-xs text-muted-foreground">2 coins per ₹100</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <div className="text-2xl mb-1">🔄</div>
              <p className="text-xs font-medium">Refer & Earn</p>
              <p className="text-xs text-muted-foreground">100 coins per referral</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <div className="text-2xl mb-1">💸</div>
              <p className="text-xs font-medium">Redeem</p>
              <p className="text-xs text-muted-foreground">10 coins = ₹1</p>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="bg-card border border-border rounded-xl p-4" data-testid="transactions-list">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Transaction History</h3>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : (history as any[]).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No transactions yet. Start shopping to earn Rewards!</p>
              <Link href="/products"><Button size="sm" className="mt-3 kartigo-gradient border-0" data-testid="button-shop-rewards">Shop Now</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(history as any[]).map((txn: any) => (
                <div key={txn.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`txn-${txn.id}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${txn.type === "EARNED" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {txn.type === "EARNED" ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className={`font-bold text-sm ${txn.type === "EARNED" ? "text-green-600" : "text-red-600"}`}>
                    {txn.type === "EARNED" ? "+" : "-"}{Math.abs(txn.coins)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
