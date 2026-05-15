import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Building2, LogOut } from 'lucide-react';
import './layout.css';

export default function Sidebar() {
  const navigate = useNavigate();
  
  // Lấy thông tin user từ bộ nhớ trình duyệt
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // Hàm xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('user'); // Xóa thẻ
    navigate('/login'); // Đá ra ngoài
  };

  // Hàm tạo Avatar từ 2 chữ cái đầu của tên
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  // Định nghĩa toàn bộ Menu kèm theo Quyền (Roles)
  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['Admin', 'Manager'] },
    { name: 'Payroll & Attendance', path: '/payroll', icon: CreditCard, roles: ['Admin', 'Manager'] },
    { name: 'Departments', path: '/departments', icon: Building2, roles: ['Admin', 'Manager'] },
    
    // Menu riêng cho nhân viên
    { name: 'My Payroll', path: `/payroll/${user?.id}`, icon: CreditCard, roles: ['Employee'] },
  ];

  // Chỉ lấy ra những menu mà Role hiện tại được phép xem
  const navItems = allNavItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          PaySync
        </h1>
        <p className="sidebar-subtitle">Enterprise</p>
        <p className="sidebar-section-title">
          {user?.role === 'Employee' ? 'Self-Service Portal' : 'Admin Portal'}
        </p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer hiển thị thông tin người đăng nhập */}
      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="user-avatar">{getInitials(user?.name)}</div>
          <div className="user-info">
            <p>{user?.name || 'Unknown'}</p>
            <span>{user?.role || 'Guest'}</span>
          </div>
        </div>
        
        {/* Nút Đăng xuất */}
        <button 
          onClick={handleLogout} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-sidebar)', cursor: 'pointer', padding: '5px' }} 
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}