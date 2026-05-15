import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

export default function MainLayout() {
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="main-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}