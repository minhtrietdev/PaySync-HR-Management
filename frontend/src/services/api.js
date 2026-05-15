// Cấu hình đường dẫn gốc của Backend Flask
const BASE_URL = 'http://127.0.0.1:5000';

// Hàm helper dùng chung để xử lý gọi API và bắt lỗi
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Nếu backend trả về lỗi (mã 4xx hoặc 5xx), ném ra lỗi để Frontend dùng try...catch bắt được
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.msg || 'Có lỗi xảy ra khi kết nối máy chủ!');
  }

  return response.json();
}

// ============================================================================
// ĐÂY LÀ ĐỐI TƯỢNG 'api' CHỨA TOÀN BỘ CÁC HÀM MÀ CÁC TRANG (PAGES) ĐANG GỌI
// ============================================================================
export const api = {
  // -------------------------
  // 1. DASHBOARD API
  // -------------------------
  getDashboardStats: () => fetchAPI('/api/dashboard/stats'),
  getPayrollTrends: () => fetchAPI('/api/dashboard/payroll-trends'),
  getDashboardActions: () => fetchAPI('/api/dashboard/actions'),
  getDepartmentOverview: () => fetchAPI('/api/dashboard/department-overview'),

  // -------------------------
  // 2. DEPARTMENTS & POSITIONS API
  // -------------------------
  getDepartments: () => fetchAPI('/api/departments'),
  getPositions: () => fetchAPI('/api/positions'),
  addDepartment: (data) => fetchAPI('/api/departments', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  addPositionToDepartment: (deptId, posId) => fetchAPI(`/api/departments/${deptId}/positions`, { 
    method: 'POST', 
    body: JSON.stringify({ positionId: posId }) 
  }),

  // THÊM 2 HÀM NÀY VÀO:
  updateDepartment: (id, data) => fetchAPI(`/api/departments/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  deleteDepartment: (id) => fetchAPI(`/api/departments/${id}`, { 
    method: 'DELETE' 
  }),

  // -------------------------
  // 3. EMPLOYEES API
  // -------------------------
  // Truyền thêm query search nếu có (ví dụ: ?q=Nguyễn)
  getEmployees: (query = '') => fetchAPI(`/api/employees${query ? `?q=${query}` : ''}`),
  
  addEmployee: (data) => fetchAPI('/api/employees', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  
  updateEmployee: (id, data) => fetchAPI(`/api/employees/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  
  deleteEmployee: (id) => fetchAPI(`/api/employees/${id}`, { 
    method: 'DELETE' 
  }),

  // -------------------------
  // 4. PAYROLL API
  // -------------------------
  getPayroll: (id) => fetchAPI(`/api/payroll/${id}`),
  
  // Đã xóa dòng getEmployees bị trùng lặp ở đây
  
  adjustPayroll: (id, data) => fetchAPI(`/api/payroll/${id}/adjust`, { 
    method: 'POST', 
    body: JSON.stringify(data)
  }), // <--- LỖI LÀ DO THIẾU DÒNG NÀY ĐÂY (Đóng ngoặc và phẩy)

  // Thêm hàm login mới
  login: (credentials) => fetchAPI('/api/login', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  }),
};