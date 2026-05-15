import { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  
  // Tạo state để lưu dữ liệu người dùng nhập
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn form tải lại trang
    setError('');
    setIsLoading(true);

    try {
      // Gọi API gửi Email và Password xuống Backend
      const res = await api.login({ username, password });

      // 1. Lưu thông tin user (bao gồm Role) vào bộ nhớ trình duyệt
      localStorage.setItem('user', JSON.stringify(res.user));

      // 2. Điều hướng trang dựa vào quyền (Role)
      if (res.user.role === 'Employee') {
        navigate(`/payroll/${res.user.id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome back</h2>
        <p className="login-subtitle">
          Enter your credentials to access the PaySync portal.
        </p>

        {/* Khung hiển thị thông báo lỗi */}
        {error && (
          <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Thêm autoComplete="off" để chặn autofill của trình duyệt */}
        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <div className="input-wrapper">
              {/* Chỉ hiển thị icon thư khi ô username trống */}
              {!username && <Mail className="input-icon" size={16} />}
              <input
                type="email"
                // Tự động thêm class 'no-icon' nếu người dùng đã gõ chữ
                className={`form-input ${username ? 'no-icon' : ''}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                name="email-clear"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label>Password</label>
              <a href="#">Forgot password?</a>
            </div>
            <div className="input-wrapper">
              {/* Chỉ hiển thị icon ổ khóa khi ô password trống */}
              {!password && <Lock className="input-icon" size={16} />}
              <input
                type="password"
                // Tự động thêm class 'no-icon' nếu người dùng đã gõ chữ
                className={`form-input ${password ? 'no-icon' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Secure Sign In →'}
          </button>
        </form>

        <div className="login-footer">
          <Shield size={12} /> Protected by 256-bit enterprise encryption
        </div>
      </div>
    </div>
  );
}