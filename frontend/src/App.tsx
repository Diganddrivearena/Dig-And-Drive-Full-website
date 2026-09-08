import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminLoginPage } from "@/pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminCouponsPage } from "@/pages/admin/AdminCouponsPage";
import { AdminBannersPage } from "@/pages/admin/AdminBannersPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";
import { AdminUsersPage } from "@/pages/admin/AdminUsersPage";
import { LoginPage } from "@/pages/LoginPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ProductsPage = lazy(() =>
  import("@/pages/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const CategoriesPage = lazy(() =>
  import("@/pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })),
);
const ProductDetailsPage = lazy(() =>
  import("@/pages/ProductDetailsPage").then((m) => ({
    default: m.ProductDetailsPage,
  })),
);

export function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <Toaster />
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
            </div>
          }
        >
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="banners" element={<AdminBannersPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>

            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetailsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
            </Route>
          </Routes>
        </Suspense>
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
