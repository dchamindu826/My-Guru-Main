import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans">
      {/* Sidebar (Fixed Width) */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen">
        <Outlet /> 
      </div>
    </div>
  );
}