import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/main";
import { useAuth } from "./hooks/useAuth";
import { BankPayPage } from "./pages/BankPayPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PostPage } from "./pages/PostPage";
import { AddressFormPage } from "./pages/AddressFormPage";
import { AddressesPage } from "./pages/AddressesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { QpayPayPage } from "./pages/QpayPayPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  const { loadUser, loading } = useAuth();

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <p className="text-sm text-gray-500">Ачааллаж байна...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="post/:id" element={<PostPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="cart/:cartId/checkout" element={<CheckoutPage />} />
          <Route path="cart/:cartId/pay/qpay" element={<QpayPayPage />} />
          <Route path="cart/:cartId/pay/bank" element={<BankPayPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/addresses" element={<AddressesPage />} />
          <Route path="profile/addresses/new" element={<AddressFormPage />} />
          <Route path="profile/addresses/:id" element={<AddressFormPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
