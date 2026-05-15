from flask import Blueprint, jsonify
from sqlalchemy import func
from datetime import datetime
from extensions import db
from models import Employee, Department, Position, Attendance, Salary, Dividend, DepartmentPayroll, EmployeePayroll

dashboard_bp = Blueprint("dashboard", __name__)
dividends_bp = Blueprint("dividends", __name__)

def fmt_currency(val):
    return f"${val:,.2f}" if val is not None else "$0.00"

def emp_id(raw_id):
    return f"EMP-{raw_id:04d}"

@dashboard_bp.route("/api/dashboard/stats")
def get_dashboard_stats():
    current_year = db.session.query(func.max(func.year(Salary.SalaryMonth))).scalar() or datetime.now().year
    
    # Total Headcount
    hc = Employee.query.filter(Employee.Status == 'ACTIVE').count()

    # Payroll Processing (sum of NetSalary for the current year)
    ytd_payroll = db.session.query(func.sum(Salary.NetSalary))\
        .filter(func.year(Salary.SalaryMonth) == current_year).scalar() or 0

    # Leave Balance (sum of LeaveDays)
    total_leave = db.session.query(func.sum(Attendance.LeaveDays))\
        .filter(func.year(Attendance.AttendanceMonth) == current_year).scalar() or 0
        
    # Active Roles (Tổng số lượng chức danh)
    active_roles = Position.query.count()

    return jsonify([
        {"title": "Total Headcount", "value": str(hc), "change": "+5% from last month", "trend": "up", "status": ""},
        {"title": "Active Roles", "value": str(active_roles), "change": "Across all depts", "trend": "up", "status": ""},
        {"title": "Payroll Processing", "value": fmt_currency(ytd_payroll), "change": "YTD Total", "trend": "", "status": "ON BUDGET"},
        {"title": "Leave Balance", "value": f"{total_leave} Days", "change": "-2% from last month", "trend": "down", "status": ""},
    ])


@dashboard_bp.route("/api/dashboard/payroll-trends")
def get_payroll_trends():
    current_year = db.session.query(func.max(func.year(Salary.SalaryMonth))).scalar() or datetime.now().year
    rows = db.session.query(
        func.month(Salary.SalaryMonth).label("m"),
        func.sum(Salary.NetSalary).label("total")
    ).filter(
        func.year(Salary.SalaryMonth) == current_year
    ).group_by(func.month(Salary.SalaryMonth)).order_by("m").all()

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    result = []
    for r in rows:
        m_idx = r.m - 1
        name = month_names[m_idx] if 0 <= m_idx < 12 else str(r.m)
        result.append({"name": name, "Payroll": float(r.total)})
    return jsonify(result)


@dashboard_bp.route("/api/dashboard/actions")
def get_dashboard_actions():
    actions = []
    current_month = datetime.now().month
    
    # 1. Work Anniversaries
    anniversaries = Employee.query.filter(func.month(Employee.HireDate) == current_month).all()
    if anniversaries:
        actions.append({
            "type": "info",
            "title": "Upcoming Anniversaries",
            "detail": f"{len(anniversaries)} employees have work anniversaries this month.",
            "link": "View List"
        })
        
    # 2. Vacation Limit
    excess_leave = Attendance.query.filter(Attendance.LeaveDays > 15).count()
    if excess_leave > 0:
        actions.append({
            "type": "warning",
            "title": "Leave Limit Exceeded",
            "detail": f"{excess_leave} employees exceeded 15 PTO days.",
            "link": "Review Records"
        })
        
    # 3. Tax Form Missing (Mock)
    actions.append({
        "type": "error",
        "title": "Tax Form Missing",
        "detail": "Some employees are missing updated tax documents.",
        "link": "Send Reminder"
    })
    
    return jsonify(actions)


@dashboard_bp.route("/api/dashboard/department-overview")
def get_department_overview():
    # Group by department, get count and average salary
    dept_stats = db.session.query(
        DepartmentPayroll.DepartmentName,
        func.count(func.distinct(EmployeePayroll.EmployeeID)).label('headcount'),
        func.avg(Salary.NetSalary).label('avg_salary')
    ).outerjoin(
        EmployeePayroll, DepartmentPayroll.DepartmentID == EmployeePayroll.DepartmentID
    ).outerjoin(
        Salary, EmployeePayroll.EmployeeID == Salary.EmployeeID
    ).group_by(
        DepartmentPayroll.DepartmentName
    ).all()
    
    result = []
    for stat in dept_stats:
        result.append({
            "name": stat.DepartmentName,
            "headcount": stat.headcount,
            "avgSalary": fmt_currency(stat.avg_salary) if stat.avg_salary else "$0.00",
            "status": "ON BUDGET"
        })
        
    return jsonify(result)


@dividends_bp.route("/api/dividends")
def get_dividends():
    current_year = db.session.query(func.max(func.year(Dividend.DividendDate))).scalar() or datetime.now().year

    ytd_total = db.session.query(
        func.sum(Dividend.DividendAmount)
    ).filter(
        func.year(Dividend.DividendDate) == current_year
    ).scalar() or 0

    rows = db.session.query(
        Dividend.EmployeeID,
        func.sum(Dividend.DividendAmount).label("total"),
    ).filter(
        func.year(Dividend.DividendDate) == current_year
    ).group_by(Dividend.EmployeeID).all()

    return jsonify({
        "ytdTotal": fmt_currency(ytd_total),
        "ytdTotalRaw": float(ytd_total),
        "perEmployee": [
            {"employeeId": emp_id(r.EmployeeID), "total": float(r.total)}
            for r in rows
        ],
    })