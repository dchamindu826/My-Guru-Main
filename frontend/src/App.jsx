import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- Public User Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// --- Public User Pages ---
import Home from './pages/Home';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Chat from './pages/Chat';
import Checkout from './pages/Checkout';

// --- Admin Components & Pages ---
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import Dashboard from './admin/pages/Dashboard';
import Orders from './admin/pages/Orders';
import Packages from './admin/pages/Packages';

// Public Layout (Navbar + Footer for users)
const Layout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* =========================================
              PUBLIC USER ROUTES
          ========================================= */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />
          
          {/* Chat Route (No Navbar/Footer - Full Screen) */}
          <Route path="/chat" element={<Chat />} />

          {/* =========================================
              ADMIN PANEL ROUTES
          ========================================= */}
          
          {/* 1. Admin Login (No Sidebar) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* 2. Admin Protected Area (With Sidebar Layout) */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* /admin ගිය ගමන් Dashboard එකට යනවා */}
            <Route index element={<Dashboard />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="packages" element={<Packages />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}