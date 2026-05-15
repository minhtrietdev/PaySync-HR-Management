import { useState, useEffect } from 'react';
import { Plus, Filter, Edit2, MoreVertical, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import './Employees.css';
import './Modal.css';


export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  // Sửa 'ACTIVE' thành 'Đang làm việc'
  const [currentEmp, setCurrentEmp] = useState({ name: '', departmentId: '', positionId: '', status: 'Đang làm việc' });
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('default');

  

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees(query);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [depts, pos] = await Promise.all([
        api.getDepartments(),
        api.getPositions()
      ]);
      setDepartments(depts);
      setPositions(pos);
    } catch (err) {
      console.error(err);
    }
  };

 const openAddModal = () => {
    setModalMode('add');
    // Sửa 'ACTIVE' thành 'Đang làm việc'
    setCurrentEmp({ name: '', departmentId: '', positionId: '', status: 'Đang làm việc' });
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalMode('edit');
    // We need to map string dept/pos back to IDs or just edit name/status for simplicity.
    // The API `getEmployee` might be better, or we can find IDs from our options list.
    const deptId = departments.find(d => d.name === emp.department)?.rawId || '';
    // Positions in our mock fetch are simple list.
    const posId = positions.find(p => p.title === emp.position)?.id || '';
    
    setCurrentEmp({ ...emp, departmentId: deptId, positionId: posId });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalMode === 'add') {
        await api.addEmployee(currentEmp);
      } else {
        await api.updateEmployee(currentEmp.rawId, currentEmp);
      }
      setIsModalOpen(false);
      fetchData(); // Refresh table
    } catch (err) {
      alert(err.message);
    }
  };

  

  const handleDelete = async (rawId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.deleteEmployee(rawId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // =========================================
  // LOGIC LỌC VÀ SẮP XẾP NHÂN VIÊN
  // =========================================
  const processedEmployees = employees
    .filter(emp => {
      // 1. Lọc theo phòng ban
      if (filterDept && emp.department !== filterDept) return false;
      // 2. Lọc theo chức vụ
      if (filterPos && emp.position !== filterPos) return false;
      // 3. Lọc theo trạng thái
      if (filterStatus && emp.status !== filterStatus) return false;
      return true; // Giữ lại những người thỏa mãn mọi điều kiện
    })
    .sort((a, b) => {
      // Sắp xếp A-Z
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      // Sắp xếp Z-A
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      
      // Sắp xếp Ngày vào làm (Mới nhất)
      if (sortBy === 'date-desc') return new Date(b.joinDate) - new Date(a.joinDate);
      // Sắp xếp Ngày vào làm (Cũ nhất)
      if (sortBy === 'date-asc') return new Date(a.joinDate) - new Date(b.joinDate);
      
      return 0; // Mặc định không sắp xếp
    });

  // Nút xóa bộ lọc
  const clearFilters = () => {
    setFilterDept('');
    setFilterPos('');
    setFilterStatus('');
    setSortBy('default');
    setQuery('');
  };
  
  return (
    <div className="page-container">
      <div className="flex-between dashboard-header">
        <div>
          <h1 className="h1">Employee Directory</h1>
          <p className="text-muted">Manage and view all active and inactive personnel records.</p>
        </div>
        <div className="flex-start">
          <input 
            type="text" 
            placeholder="Search employees..." 
            className="form-input" 
            style={{ width: '250px' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" style={{ backgroundColor: 'black' }} onClick={openAddModal}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* THANH CÔNG CỤ LỌC VÀ SẮP XẾP */}
      <div className="filter-toolbar" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Lọc Phòng ban */}
        <select className="form-select" style={{ width: '180px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">Tất cả phòng ban</option>
          {departments.map(d => <option key={d.rawId} value={d.name}>{d.name}</option>)}
        </select>

        {/* Lọc Chức vụ */}
        <select className="form-select" style={{ width: '180px' }} value={filterPos} onChange={e => setFilterPos(e.target.value)}>
          <option value="">Tất cả chức vụ</option>
          {positions.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
        </select>

        {/* Lọc Trạng thái */}
        <select className="form-select" style={{ width: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="ĐANG LÀM VIỆC">Đang làm việc</option>
          <option value="NGHỈ PHÉP">Nghỉ phép</option>
          <option value="ĐÃ NGHỈ VIỆC">Đã nghỉ việc</option>
        </select>

        {/* Sắp xếp */}
        <select className="form-select" style={{ width: '180px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="default">Sắp xếp: Mặc định</option>
          <option value="name-asc">Tên: A - Z</option>
          <option value="name-desc">Tên: Z - A</option>
          <option value="date-desc">Vào làm: Gần đây nhất</option>
          <option value="date-asc">Vào làm: Cũ nhất</option>
        </select>

        {/* Nút Xóa lọc */}
        {(filterDept || filterPos || filterStatus || sortBy !== 'default' || query) && (
          <button className="btn btn-outline" onClick={clearFilters}>
            Xóa lọc
          </button>
        )}
      </div>

      <div className="employee-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>ID</th>
              <th>Department</th>
              <th>Position</th>
              <th>Status</th>
              <th>Join Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No employees found.</td></tr>
            ) : processedEmployees.map((emp, idx) => (
              <tr key={idx}>
                <td>
                  <div className="employee-info-cell">
                    <div className="employee-avatar">
                      {emp.initials}
                    </div>
                    <span className="employee-name">{emp.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.id}</td>
                <td>{emp.department}</td>
                <td>{emp.position}</td>
                <td>
                  <span className={`status-badge ${emp.status === 'ACTIVE' ? 'status-on-budget' : 'status-review'}`}>
                    {emp.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.joinDate}</td>
                <td>
                  <div className="flex-start" style={{ justifyContent: 'flex-end' }}>
                    <button className="action-btn" onClick={() => openEditModal(emp)} title="Edit"><Edit2 size={14} /></button>
                    <button className="action-btn" onClick={() => handleDelete(emp.rawId)} title="Delete"><Trash2 size={14} color="var(--danger)" /></button>
                    <a href={`/payroll/${emp.rawId}`} className="action-btn" title="View Payroll"><MoreVertical size={14} /></a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="pagination-footer">
          <div className="pagination-info">Showing {processedEmployees.length} entries</div>
          <div className="pagination-controls">
            <button className="page-btn">&lt;</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">&gt;</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'add' ? 'Add Employee' : 'Edit Employee'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={currentEmp.name}
                  onChange={e => setCurrentEmp({...currentEmp, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={currentEmp.departmentId}
                  onChange={e => setCurrentEmp({...currentEmp, departmentId: e.target.value})}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.rawId} value={d.rawId}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Position</label>
                <select 
                  className="form-select"
                  value={currentEmp.positionId}
                  onChange={e => setCurrentEmp({...currentEmp, positionId: e.target.value})}
                >
                  <option value="">Select Position</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={currentEmp.status}
                  onChange={e => setCurrentEmp({...currentEmp, status: e.target.value})}
                >
                  <option value="Đang làm việc">Đang làm việc</option>
                  <option value="Nghỉ phép">Nghỉ phép</option>
                  <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}