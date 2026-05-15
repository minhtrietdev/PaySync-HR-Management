from flask import Blueprint, jsonify, request
from sqlalchemy import func
from datetime import datetime
from extensions import db
from models import Employee, Department, Position, Attendance, Salary, EmployeePayroll

payroll_bp = Blueprint("payroll", __name__)

def fmt_currency(val):
    return f"${val:,.2f}" if val is not None else "$0.00"

def emp_id(raw_id):
    return f"EMP-{raw_id:04d}"

@payroll_bp.route("/api/payroll/<int:employee_id>")
def get_employee_payroll(employee_id):
    emp = Employee.query.get_or_404(employee_id)
    dept = Department.query.get(emp.DepartmentID)
    pos  = Position.query.get(emp.PositionID)

    current_year = db.session.query(func.max(func.year(Salary.SalaryMonth))).scalar()
    if not current_year:
        current_year = datetime.now().year
    
    # Yearly stats
    attendances = Attendance.query.filter(
        Attendance.EmployeeID == employee_id,
        func.year(Attendance.AttendanceMonth) == current_year
    ).order_by(Attendance.AttendanceMonth.desc()).all()
    
    if attendances:
        latest_att = attendances[0] # Chỉ lấy tháng mới nhất
        total_work   = latest_att.WorkDays or 0
        total_absent = latest_att.AbsentDays or 0
        total_leave  = latest_att.LeaveDays or 0
        att_period   = latest_att.AttendanceMonth.strftime("%b %Y")
    else:
        total_work = total_absent = total_leave = 0
        att_period = "No Data"

    salaries = Salary.query.filter(
        Salary.EmployeeID == employee_id,
        func.year(Salary.SalaryMonth) == current_year
    ).order_by(Salary.SalaryMonth.asc()).all()

    sal_history = []
    for s in salaries:
        sal_history.append({
            "period": s.SalaryMonth.strftime("%Y-%m"),
            "base": fmt_currency(float(s.BaseSalary or 0)),
            "bonus": fmt_currency(float(s.Bonus or 0)),
            "deductions": fmt_currency(float(s.Deductions or 0)),
            "net": fmt_currency(float(s.NetSalary or 0)),
            "status": "PAID"
        })

    # Latest record
    if salaries:
        latest = salaries[-1]
        current_period = {
            "month": latest.SalaryMonth.strftime("%b %Y"),
            "baseSalary": fmt_currency(latest.BaseSalary),
            "bonusAllowances": fmt_currency(latest.Bonus),
            "taxesDeductions": fmt_currency(latest.Deductions),
            "netSalary": fmt_currency(latest.NetSalary),
            "status": "PROCESSING",
            "directDeposit": "Enabled"
        }
    else:
        current_period = {
            "month": datetime.now().strftime("%b %Y"),
            "baseSalary": "$0.00",
            "bonusAllowances": "$0.00",
            "taxesDeductions": "$0.00",
            "netSalary": "$0.00",
            "status": "PENDING",
            "directDeposit": "Enabled"
        }

    return jsonify({
        "employee": {
            "name": emp.FullName,
            "id": emp_id(emp.EmployeeID),
            "title": pos.PositionName if pos else "—",
            "dept": dept.DepartmentName if dept else "—"
        },
        "attendance": {
            "workDays": total_work,
            "period": att_period,
            "leaveDays": total_leave,
            "leaveStatus": "Approved",
            "absentDays": total_absent,
            "absentStatus": "Unpaid",
        },
        "currentPeriod": current_period,
        "salaryHistory": sal_history
    })


@payroll_bp.route("/api/payroll/<int:employee_id>/adjust", methods=["POST"])
def adjust_payroll(employee_id):
    data = request.get_json()
    base = float(data.get("base", 0))
    bonus = float(data.get("bonus", 0))
    deductions = float(data.get("deductions", 0))
    net = base + bonus - deductions
    
    # We update the latest salary record in the current year
    current_year = db.session.query(func.max(func.year(Salary.SalaryMonth))).scalar()
    if not current_year:
        current_year = datetime.now().year
        
    latest_salary = Salary.query.filter(
        Salary.EmployeeID == employee_id,
        func.year(Salary.SalaryMonth) == current_year
    ).order_by(Salary.SalaryMonth.desc()).first()
    
    if latest_salary:
        latest_salary.BaseSalary = base
        latest_salary.Bonus = bonus
        latest_salary.Deductions = deductions
        latest_salary.NetSalary = net
        db.session.commit()
        return jsonify({"status": "ok", "message": "Salary adjusted successfully."})
    else:
        return jsonify({"error": "No salary record found for current period."}), 404


@payroll_bp.route("/api/payroll/release", methods=["POST"])
def release_payroll():
    data = request.get_json() or {}
    send_email = data.get("sendEmail", False)
    
    if send_email:
        print("Mock: Sending payroll release emails to all employees...")
        
    return jsonify({"status": "ok", "message": "Payroll released successfully."})