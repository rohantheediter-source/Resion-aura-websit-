import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// Customer Layout & Pages
import { CustomerLayout } from './layouts/CustomerLayout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { CustomDesignPage } from './pages/CustomDesignPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Layout & Pages (Strictly isolated at /admin)
import { AdminLayout } from './admin/AdminLayout';
import { AdminProtectedRoute } from './admin/AdminProtectedRoute';
import { AdminLoginPage } from './admin/pages/AdminLoginPage';
import { AdminDashboardOverview } from './admin/pages/AdminDashboardOverview';
import { AdminProductsList } from './admin/pages/AdminProductsList';
import { AdminProductForm } from './admin/pages/AdminProductForm';
import { AdminCategoriesList } from './admin/pages/AdminCategoriesList';
import { AdminOrdersList } from './admin/pages/AdminOrdersList';
import { AdminOrderDetails } from './admin/pages/AdminOrderDetails';
import { AdminCustomRequestsList } from './admin/pages/AdminCustomRequestsList';
import { AdminCustomersList } from './admin/pages/AdminCustomersList';


export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Routes>
                {/* Customer-Facing Routes */}
                <Route element={<CustomerLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:slug" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/track-order" element={<OrderTrackingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/custom-design" element={<CustomDesignPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="/policies/:policyType" element={<PoliciesPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Dedicated Admin Portal Routes (Separated URL, Protected) */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboardOverview />} />
                    <Route path="products" element={<AdminProductsList />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id/edit" element={<AdminProductForm />} />
                    <Route path="categories" element={<AdminCategoriesList />} />
                    <Route path="orders" element={<AdminOrdersList />} />
                    <Route path="orders/:id" element={<AdminOrderDetails />} />
                    <Route path="custom-requests" element={<AdminCustomRequestsList />} />
                    <Route path="customers" element={<AdminCustomersList />} />
                  </Route>
                </Route>

              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

