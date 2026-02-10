import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './layouts/AdminLayout';

// Global Components
import SupportWidget from './components/SupportWidget';
import WhatsAppWidget from './components/WhatsAppWidget';

// User Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import Chat from './pages/Chat';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';
// Plans import eka ain kala 🔥
import CustomBotService from './pages/CustomBotService'; 

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminPlans from './pages/admin/AdminPlans';
import AdminPayments from './pages/admin/Payments';
import AdminUsers from './pages/admin/Users';
import StudentFeedbacks from './pages/admin/StudentFeedbacks';
import ManageFeedbacks from './pages/admin/ManageFeedbacks';
import IngestDocs from './pages/admin/IngestDocs';
import ManageAdmins from './pages/admin/ManageAdmins';
import KnowledgeBase from './pages/admin/KnowledgeBase';

const PublicLayout = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-[#050505]">
    <Navbar />
    <div className="flex-grow pt-20"> 
      {children}
    </div>
    <SupportWidget />
    <WhatsAppWidget />
    <Footer />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/profile" element={<PublicLayout><Profile /></PublicLayout>} />
          
          {/* 🔥 Removed /plans route */}
          
          <Route path="/services" element={<PublicLayout><CustomBotService /></PublicLayout>} />
          <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/privacy" element={<PublicLayout><Privacy /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />

          {/* --- CHAT ROUTE --- */}
          <Route path="/chat" element={<Chat />} />

          {/* --- ADMIN AUTH --- */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* --- ADMIN ROUTES --- */}
          <Route path="/admin" element={<AdminLayout />}>
             <Route path="dashboard" element={<AdminDashboard />} />
             <Route path="plans" element={<AdminPlans />} />
             <Route path="payments" element={<AdminPayments />} />
             <Route path="users" element={<AdminUsers />} />
             <Route path="student-feedback" element={<StudentFeedbacks />} />
             <Route path="testimonials" element={<ManageFeedbacks />} />
             <Route path="ingest" element={<IngestDocs />} />
             <Route path="admins" element={<ManageAdmins />} />
             <Route path="knowledge" element={<KnowledgeBase />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}