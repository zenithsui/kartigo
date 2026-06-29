import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import AllProductsPage from "@/pages/all-products";
import ElectronicsPage from "@/pages/electronics";
import JerseysPage from "@/pages/jerseys";
import FashionPage from "@/pages/fashion";
import HomeKitchenPage from "@/pages/home-kitchen";
import BeautyPage from "@/pages/beauty";
import SportsPage from "@/pages/sports";
import BooksPage from "@/pages/books";
import FlashSalePage from "@/pages/flash-sale";
import ProductDetailPage from "@/pages/product-detail";
import CartPage from "@/pages/cart";
import CheckoutPage from "@/pages/checkout";
import OrdersPage from "@/pages/orders";
import OrderDetailPage from "@/pages/order-detail";
import WishlistPage from "@/pages/wishlist";
import ProfilePage from "@/pages/profile";
import SearchPage from "@/pages/search";
import SellerStorefrontPage from "@/pages/seller-storefront";
import SellerDashboardPage from "@/pages/seller-dashboard";
import AdminDashboardPage from "@/pages/admin-dashboard";
import OwnerPanel from "@/pages/owner/index";
import AdminPanel from "@/pages/admin/index";
import SellerPanel from "@/pages/seller/index";
import CategoriesPage from "@/pages/categories";
import BrandPage from "@/pages/brand";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import FAQPage from "@/pages/faq";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsPage from "@/pages/terms";
import ReturnPolicyPage from "@/pages/return-policy";
import SellOnKartigoPage from "@/pages/sell-on-kartigo";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import ForgotPasswordPage from "@/pages/auth/forgot-password";
import ResetPasswordPage from "@/pages/auth/reset-password";
import VerifyEmailPage from "@/pages/auth/verify-email";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />

      {/* Auth pages */}
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/auth/verify-email" component={VerifyEmailPage} />

      {/* Category pages — each has its own file */}
      <Route path="/products" component={AllProductsPage} />
      <Route path="/electronics" component={ElectronicsPage} />
      <Route path="/jerseys" component={JerseysPage} />
      <Route path="/fashion" component={FashionPage} />
      <Route path="/home-kitchen" component={HomeKitchenPage} />
      <Route path="/beauty" component={BeautyPage} />
      <Route path="/sports" component={SportsPage} />
      <Route path="/books" component={BooksPage} />
      <Route path="/flash-sale" component={FlashSalePage} />

      {/* Product detail */}
      <Route path="/products/:slug" component={ProductDetailPage} />

      {/* Shopping flow */}
      <Route path="/search" component={SearchPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/brands/:slug" component={BrandPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:id" component={OrderDetailPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/profile" component={ProfilePage} />

      {/* Seller & Admin */}
      <Route path="/sellers/:slug" component={SellerStorefrontPage} />
      <Route path="/seller/dashboard" component={SellerDashboardPage} />
      <Route path="/seller" component={SellerPanel} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/old" component={AdminDashboardPage} />
      <Route path="/owner" component={OwnerPanel} />

      {/* Static pages */}
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/return-policy" component={ReturnPolicyPage} />
      <Route path="/sell-on-kartigo" component={SellOnKartigoPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
