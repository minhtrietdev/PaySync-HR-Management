import { useState, useEffect } from 'react';
import { Users, Banknote, CalendarX, BarChart3, Download, Play, AlertTriangle, Clock, FileWarning, Briefcase } from 'lucide-react';
// IMPORT THÊM PIECHART TỪ RECHARTS
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import './Dashboard.css';

// Thêm icon Briefcase cho thẻ Active Roles
const ICON_MAP = {
  'Total Headcount': Users,
  'Active Roles': Briefcase,
  'Payroll Processing': Banknote,
  'Leave Balance': CalendarX,
};

const ALERT_ICON_MAP = {
  'warning': AlertTriangle,
  'info': Clock,
  'error': FileWarning
};

// Bảng màu xịn xò cho Biểu đồ tròn
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [trends, setTrends] = useState([]);
  const [actions, setActions] = useState([]);
  const [deptOverview, setDeptOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [st, tr, ac, dOverview] = await Promise.all([
          api.getDashboardStats(),
          api.getPayrollTrends(),
          api.getDashboardActions(),
          api.getDepartmentOverview()
        ]);
        
        setStats(st);
        setTrends(tr);
        setActions(ac);
        setDeptOverview(dOverview);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <div className="flex-between dashboard-header">
        <div>
          <h1 className="h1">Dashboard Overview</h1>
          <p className="text-muted">Trung tâm kiểm soát toàn diện: Nhân sự, Lương thưởng & Hiệu suất.</p>
        </div>
        <div className="flex-start">
          <button className="btn btn-outline">
            <Download size={16} /> Xuất Báo Cáo
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: 'black' }}>
            <Play size={16} /> Chốt Lương Kỳ Này
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu hệ thống...</div>
      ) : (
        <>
          {/* 1. DÀN THẺ KPI (ĐÃ NÂNG CẤP LÊN 4 THẺ) */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {stats.map((stat, idx) => {
              const Icon = ICON_MAP[stat.title] || BarChart3;
              let badgeColor = 'badge-info';
              let iconColor = 'var(--info)';
              if (stat.trend === 'up') { badgeColor = 'badge-success'; iconColor = 'var(--success)'; }
              else if (stat.trend === 'down') { badgeColor = 'badge-danger'; iconColor = 'var(--danger)'; }
              
              return (
                <div key={idx} className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-title">{stat.title}</span>
                    <Icon size={18} color={iconColor} />
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{stat.value}</span>
                    <span className={`badge ${badgeColor}`}>{stat.change}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dashboard-grid">
            {/* 2. BIỂU ĐỒ ĐƯỜNG: XU HƯỚNG QUỸ LƯƠNG */}
            <div className="card chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Payroll Trends (Xu hướng Quỹ lương)</h3>
                <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  YTD
                </button>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Payroll" stroke="var(--info)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} name="Tổng Lương (Net)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. WIDGET CẢNH BÁO TỰ ĐỘNG */}
            <div className="card">
              <div className="chart-header">
                <h3 className="chart-title flex-start">
                  Action Required
                  <span className="badge badge-danger">{actions.length} New</span>
                </h3>
              </div>
              <div className="alerts-list">
                {actions.map((action, idx) => {
                  const AlertIcon = ALERT_ICON_MAP[action.type] || Clock;
                  return (
                    <div key={idx} className={`alert-item alert-${action.type}`}>
                      <div className="alert-title"><AlertIcon size={14} /> {action.title}</div>
                      <p className="alert-desc">{action.detail}</p>
                      {action.link && <a href="#" className="alert-link">{action.link}</a>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            {/* 4. BẢNG TÓM TẮT PHÒNG BAN */}
            <div className="card">
              <div className="chart-header">
                <h3 className="chart-title">Department Overview</h3>
                <a href="/departments" style={{ fontSize: '0.75rem', color: 'var(--info)', textDecoration: 'none' }}>View All</a>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Phòng Ban</th>
                    <th>Số Nhân Sự (Headcount)</th>
                    <th>Lương Trung Bình</th>
                    <th style={{ textAlign: 'right' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {deptOverview.map((dept, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{dept.name}</td>
                      <td>{dept.headcount} người</td>
                      <td style={{ color: 'var(--success)', fontWeight: 500 }}>{dept.avgSalary}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`status-badge ${dept.status === 'ON BUDGET' ? 'status-on-budget' : 'status-review'}`}>
                          {dept.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. TÍNH NĂNG MỚI: BIỂU ĐỒ TRÒN (DONUT CHART) PHÂN BỔ NHÂN SỰ */}
            <div className="card">
              <h3 className="chart-title" style={{ marginBottom: '1rem', textAlign: 'center' }}>Headcount Distribution</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={deptOverview} 
                      dataKey="headcount" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={70} 
                      outerRadius={100} 
                      paddingAngle={5}
                    >
                      {deptOverview.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} người`, 'Số lượng']} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}