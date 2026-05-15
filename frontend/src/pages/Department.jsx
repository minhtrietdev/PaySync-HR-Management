import { useState, useEffect } from 'react';
// THÊM CÁC ICON Edit2, Trash2
import { Plus, Users, Code, Landmark, Settings, PieChart, X, Edit2, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import './Department.css';
import './Modal.css';

const ICON_MAP = {
  'code': Code,
  'people': Users,
  'finance': Landmark,
  'settings': Settings,
  'chart': PieChart
};

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state (Đã nâng cấp để dùng chung cho cả Add và Edit)
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState(null); // Lưu ID nếu đang ở chế độ Sửa

  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [newPosId, setNewPosId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depts, pos] = await Promise.all([
        api.getDepartments(),
        api.getPositions()
      ]);
      setDepartments(depts);
      setPositions(pos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC PHÒNG BAN ---
  const openAddDeptModal = () => {
    setEditingDeptId(null); // Reset ID
    setNewDeptName('');     // Xóa trắng tên
    setIsDeptModalOpen(true);
  };

  const openEditDeptModal = (dept) => {
    setEditingDeptId(dept.rawId); // Ghi nhớ ID đang sửa
    setNewDeptName(dept.name);    // Hiện sẵn tên cũ lên input
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = async () => {
    if (!newDeptName.trim()) return alert("Tên phòng ban không được để trống!");
    try {
      if (editingDeptId) {
        // Gọi API Sửa
        await api.updateDepartment(editingDeptId, { name: newDeptName });
      } else {
        // Gọi API Thêm mới
        await api.addDepartment({ name: newDeptName });
      }
      setIsDeptModalOpen(false);
      setNewDeptName('');
      setEditingDeptId(null);
      fetchData(); // Tải lại dữ liệu
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng ban này không?")) return;
    try {
      await api.deleteDepartment(deptId);
      fetchData(); // Tải lại bảng sau khi xóa thành công
    } catch (err) {
      alert(err.message); // Backend sẽ ném lỗi ra đây nếu phòng có nhân viên
    }
  };

  // --- LOGIC CHỨC VỤ ---
  const handleAddPosition = async () => {
    try {
      await api.addPositionToDepartment(selectedDeptId, newPosId);
      setIsPosModalOpen(false);
      setNewPosId('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openPosModal = (deptId) => {
    setSelectedDeptId(deptId);
    setNewPosId('');
    setIsPosModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="flex-between dashboard-header">
        <div>
          <h1 className="h1">Organization Structure</h1>
          <p className="text-muted">Manage departments, roles, and reporting hierarchies.</p>
        </div>
        {/* Nút thêm chuyển sang dùng hàm openAddDeptModal */}
        <button className="btn btn-primary" style={{ backgroundColor: 'black' }} onClick={openAddDeptModal}>
          <Plus size={16} /> New Department
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="dept-grid">
          {departments.map((dept, idx) => {
            const IconComponent = ICON_MAP[dept.icon] || Users;
            return (
              <div key={idx} className="dept-card">
                <div className="dept-header">
                  <div className="flex-between" style={{ width: '100%' }}>
                    <div className="dept-title-area">
                      <div className="dept-icon">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="dept-title">
                          {dept.name} <span className="dept-id">{dept.id}</span>
                        </h3>
                        <div className="dept-stats">
                          <span className="dept-stat-item"><Users size={12} /> {dept.employees} Employees</span>
                        </div>
                      </div>
                    </div>
                    {/* KHU VỰC NÚT SỬA / XÓA */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" onClick={() => openEditDeptModal(dept)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="action-btn" onClick={() => handleDeleteDepartment(dept.rawId)} title="Delete">
                        <Trash2 size={16} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="roles-list">
                  {dept.positions.map((role, rIdx) => (
                    <div key={rIdx} className="role-item">
                      <span className="role-name">{role.title}</span>
                      <div className="role-count">
                        {role.open && <span className="role-open">OPEN</span>}
                        {role.hc}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="add-position-btn" onClick={() => openPosModal(dept.rawId)}>
                  <Plus size={14} /> Add Position
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PHÒNG BAN (Dùng chung cho cả Thêm và Sửa) */}
      {isDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingDeptId ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}</h3>
              <button className="modal-close" onClick={() => setIsDeptModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên phòng ban</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsDeptModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveDepartment}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Position Modal (Giữ nguyên) */}
      {isPosModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Position to Department</h3>
              <button className="modal-close" onClick={() => setIsPosModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Position</label>
                <select 
                  className="form-select"
                  value={newPosId}
                  onChange={e => setNewPosId(e.target.value)}
                >
                  <option value="">-- Choose Position --</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsPosModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddPosition}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}