import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Umbrella, UserX, CheckCircle2, Download, Building, Edit2, Play, MoreVertical, X } from 'lucide-react';
import { api } from '../services/api';
import './Payroll.css';
import './Modal.css'; // Mượn style modal của trang Employees

export default function Payroll() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State cho Dropdown danh sách nhân viên
  const [employeesList, setEmployeesList] = useState([]);
  
  // State cho Modal chỉnh lương
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ base: 0, bonus: 0, deductions: 0 });

  useEffect(() => {
    // Tải danh sách tất cả nhân viên để làm Dropdown
    api.getEmployees().then(res => setEmployeesList(res)).catch(console.error);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const empId = id || 1;
        const result = await api.getPayroll(empId);
        setData(result);
        
        // Điền số tiền hiện tại vào form chỉnh sửa (Bỏ ký tự $ và dấu phẩy để gõ được)
        setEditForm({
          base: Number(result.currentPeriod.baseSalary.replace(/[^0-9.-]+/g,"")),
          bonus: Number(result.currentPeriod.bonusAllowances.replace(/[^0-9.-]+/g,"")),
          deductions: Number(result.currentPeriod.taxesDeductions.replace(/[^0-9.-]+/g,""))
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Hàm xử lý lưu lương thủ công
  const handleSaveAdjustments = async () => {
    try {
      const empId = id || 1;
      await api.adjustPayroll(empId, editForm);
      alert("Cập nhật lương thành công! Dữ liệu đã lưu vào SQL.");
      setIsEditModalOpen(false);
      
      // Tải lại trang để thấy số mới
      const refreshedData = await api.getPayroll(empId);
      setData(refreshedData);
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message);
    }
  };

  if (loading) return <div className="page-container">Đang tải dữ liệu lương...</div>;
  if (!data) return <div className="page-container">Không tìm thấy dữ liệu lương.</div>;

  return (
    <div className="page-container">
      <div className="flex-between dashboard-header">
        <div>
          <h1 className="h1">{data.employee.name}</h1>
          <div className="payroll-header-info">
            <span className="emp-badge">{data.employee.id}</span>
            <span className="emp-details">{data.employee.title} • {data.employee.dept}</span>
          </div>
        </div>
        
        <div className="flex-start" style={{ gap: '15px' }}>
          {/* MÁY LỌC CHỌN NHÂN VIÊN */}
          <select 
            className="form-select" 
            value={id || 1}
            onChange={(e) => navigate(`/payroll/${e.target.value}`)}
            style={{ fontWeight: 'bold' }}
          >
            <option value="" disabled>-- Xem lương nhân viên khác --</option>
            {employeesList.map(emp => (
              <option key={emp.rawId} value={emp.rawId}>
                {emp.name} ({emp.id})
              </option>
            ))}
          </select>

          {/* NÚT MỞ MODAL CHỈNH LƯƠNG */}
          <button className="btn btn-outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit2 size={16} /> Chỉnh sửa thủ công
          </button>
          
          <button className="btn btn-primary" style={{ backgroundColor: 'black' }}>
            <Play size={16} /> Chốt lương
          </button>
        </div>
      </div>

      <div className="payroll-summary-grid">
        {/* ... (Phần hiển thị Thống kê Ngày công & Bảng lương giữ nguyên như cũ) ... */}
        <div className="stats-column">
          <div className="payroll-stat-card">
            <div className="stat-left">
              <div className="stat-icon blue"><Calendar size={18} /></div>
              <div>
                <div className="stat-label">Ngày đi làm</div>
                <div className="stat-value">{data.attendance.workDays}</div>
              </div>
            </div>
            <div className="stat-right">
              <span className="stat-badge gray">{data.attendance.period}</span>
            </div>
          </div>
          
          <div className="payroll-stat-card">
            <div className="stat-left">
              <div className="stat-icon green"><Umbrella size={18} /></div>
              <div>
                <div className="stat-label">Nghỉ phép</div>
                <div className="stat-value">{data.attendance.leaveDays}</div>
              </div>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="stat-left">
              <div className="stat-icon red"><UserX size={18} /></div>
              <div>
                <div className="stat-label">Nghỉ không phép</div>
                <div className="stat-value">{data.attendance.absentDays}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="salary-card">
          <div className="deposit-info">
            <Building size={14} /> Chuyển khoản: {data.currentPeriod.directDeposit}
          </div>
          
          <div>
            <h3 className="salary-title">Thực nhận kỳ này</h3>
            <div>
              <span className="salary-amount">{data.currentPeriod.netSalary}</span>
              <span className="salary-currency">USD</span>
            </div>
            <div className="salary-info">
              <CheckCircle2 size={12} color="var(--success)" /> Tính toán cho tháng {data.currentPeriod.month}
            </div>
          </div>

          <div className="salary-breakdown">
            <div className="breakdown-item">
              <h4><span className="dot gray"></span> Lương cơ bản</h4>
              <p>{data.currentPeriod.baseSalary}</p>
            </div>
            <div className="breakdown-item">
              <h4><span className="dot blue"></span> Thưởng & Phụ cấp</h4>
              <p>{data.currentPeriod.bonusAllowances}</p>
            </div>
            <div className="breakdown-item">
              <h4><span className="dot red"></span> Thuế & Khấu trừ</h4>
              <p className="red">{data.currentPeriod.taxesDeductions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LỊCH SỬ LƯƠNG */}
      {/* ... (Đoạn table history bạn giữ nguyên code cũ nhé, mình rút gọn để khỏi dài) ... */}

      {/* MODAL CHỈNH SỬA LƯƠNG */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Điều chỉnh lương tháng {data.currentPeriod.month}</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Lương cơ bản ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editForm.base}
                  onChange={e => setEditForm({...editForm, base: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thưởng & Phụ cấp ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editForm.bonus}
                  onChange={e => setEditForm({...editForm, bonus: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Khấu trừ / Phạt ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={editForm.deductions}
                  onChange={e => setEditForm({...editForm, deductions: Number(e.target.value)})}
                />
              </div>
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px', fontWeight: 'bold' }}>
                Thực nhận dự kiến: ${(editForm.base + editForm.bonus - editForm.deductions).toLocaleString()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveAdjustments}>Lưu vào Database</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}