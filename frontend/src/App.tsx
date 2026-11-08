
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Search from "./pages/Search";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Favourites from "./pages/Favourites";
import ProductInfo from "./pages/ProductInfo";
import Checkout from "./pages/Checkout";
import AccountLayout from "./pages/account/AccountLayout";
import Profile from "./pages/account/Profile";
import Orders from "./pages/account/Orders";
import Addresses from "./pages/account/Addresses";
import Settings from "./pages/account/Settings";

import DashboardPage from "./components/admin/Dashboard/Dashboardpage";
import ProductsPage from "./components/admin/Products/Productspage";
import DiscountsPage from "./components/admin/Dashboard/Discountspage";
import SettingsPage from "./components/admin/Dashboard/Settingspage";

import LoginPage from "./pages/Authentication/Loginpage";
import SignupPage from "./pages/Authentication/Signuppage";
import VerifyPage from "./pages/Authentication/VerifyPage";

import ProtectedRoute from "./components/routes/ProtectedRoute";
import AdminRoute from "./components/routes/AdminRoute";

import { useEffect } from "react";
import { restoreSession } from "./lib/api";
import { useAuthStore } from "./stores/authStore";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      // Public — anyone can browse
      { path: "/", element: <Home /> },
      { path: "/shop", element: <Shop /> },
      { path: "/product/:id", element: <ProductInfo /> },
      { path: "/search", element: <Search /> },
      { path: "/categories", element: <Categories /> },
      { path: "/cart", element: <Cart /> },
      { path: "/favourites", element: <Favourites /> },

      // Protected — signed-in users only
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/checkout", element: <Checkout /> },
          {
            element: <AccountLayout />,
            children: [
              { path: "/profile", element: <Profile /> },
              { path: "/orders", element: <Orders /> },
              { path: "/addresses", element: <Addresses /> },
              { path: "/settings", element: <Settings /> },
            ],
          },
        ],
      },

      // Admin lives outside this Layout on purpose: it must not render the
      // customer header/cart/favourites. See the top-level AdminRoute below.

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // Admin shell — ADMIN role only (AdminRoute keeps its role check). Separate
  // root so the console renders Sidebar + admin topbar instead of the store
  // chrome. Each admin page wraps itself in its own AdminLayout.
  {
    element: <AdminRoute />,
    children: [
      { path: "/admin", element: <DashboardPage /> },
      { path: "/admin/products", element: <ProductsPage /> },
      { path: "/admin/discounts", element: <DiscountsPage /> },
      { path: "/admin/settings", element: <SettingsPage /> },
    ],
  },

  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/verify", element: <VerifyPage /> },
]);
function App() {
  // Session restore: the HTTP-only refresh cookie is exchanged for a user +
  // access token on load (this lived in the removed context provider).
  useEffect(() => {
    let active = true;

    void restoreSession().then((session) => {
      if (!active) return;
      const store = useAuthStore.getState();
      if (session) store.setAuth(session);
      // Only settle the initial loading state — never downgrade a login or
      // logout that finished while the restore response was still in flight.
      else if (store.status === "loading") store.setStatus("unauthenticated");
    });

    return () => {
      active = false;
    };
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
