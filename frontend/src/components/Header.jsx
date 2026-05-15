import { Search, Bell, Settings, HelpCircle, User } from 'lucide-react';
import './layout.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-title">PaySync HR</div>
      <div className="header-search">
        <Search size={16} color="var(--text-secondary)" />
        <input type="text" placeholder="Search employees, payroll, reports..." />
      </div>
      <div className="header-actions">
        <Bell size={20} />
        <Settings size={20} />
        <HelpCircle size={20} />
        <User size={20} />
      </div>
    </header>
  );
}