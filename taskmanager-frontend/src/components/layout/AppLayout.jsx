import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useTask } from '../../context/TaskContext';

export default function AppLayout() {
  const { setFilters } = useTask();

  const handleSearch = (term) => {
    setFilters((f) => ({ ...f, search: term }));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onSearch={handleSearch} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
