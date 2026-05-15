from flask import Blueprint, jsonify, request
from datetime import datetime, date
from extensions import db
# ĐÃ THÊM Account VÀO DÒNG IMPORT DƯỚI ĐÂY
from models import Employee, EmployeePayroll, Department, Position, Attendance, Salary, Dividend, Account

employees_bp = Blueprint("employees", __name__)

def fmt_date(d):
    return d.strftime("%Y-%m-%d") if d else "—"

def emp_id(raw_id):
    return f"EMP-{raw_id:04d}"

@employees_bp.route("/api/employees")
def get_employees():
    query = request.args.get("q", "").lower()

    # Get mappings
    depts = {d.DepartmentID: d.DepartmentName for d in Department.query.all()}
    positions = {p.PositionID: p.PositionName for p in Position.query.all()}

    # Base query joining Department and Position
    base_query = db.session.query(Employee, Department, Position)\
        .outerjoin(Department, Employee.DepartmentID == Department.DepartmentID)\
        .outerjoin(Position, Employee.PositionID == Position.PositionID)

    if query:
        # Search by FullName, DepartmentName, or PositionName
        results = base_query.filter(
            db.or_(
                Employee.FullName.ilike(f"%{query}%"),
                Department.DepartmentName.ilike(f"%{query}%"),
                Position.PositionName.ilike(f"%{query}%")
            )
        ).all()
    else:
        results = base_query.all()

    def initials(name):
        parts = name.split()
        return (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else name[:2].upper()

    response = []
    for e, d, p in results:
        response.append({
            "id": emp_id(e.EmployeeID),
            "rawId": e.EmployeeID,
            "name": e.FullName,
            "initials": initials(e.FullName),
            "department": d.DepartmentName if d else "—",
            "position": p.PositionName if p else "—",
            "status": (e.Status or "ACTIVE").upper(),
            "joinDate": fmt_date(e.HireDate),
            "email": e.Email or "",
            "phone": e.PhoneNumber or "",
            "gender": e.Gender or "",
            "dob": fmt_date(e.DateOfBirth),
        })

    return jsonify(response)


@employees_bp.route("/api/employees/<int:employee_id>")
def get_employee(employee_id):
    e = Employee.query.get_or_404(employee_id)
    depts     = {d.DepartmentID: d.DepartmentName for d in Department.query.all()}
    positions = {p.PositionID: p.PositionName     for p in Position.query.all()}

    def initials(name):
        parts = name.split()
        return (parts[0][0] + parts[-1][0]).upper() if len(parts) >= 2 else name[:2].upper()

    return jsonify({
        "id": emp_id(e.EmployeeID),
        "rawId": e.EmployeeID,
        "name": e.FullName,
        "initials": initials(e.FullName),
        "department": depts.get(e.DepartmentID, "—"),
        "position": positions.get(e.PositionID, "—"),
        "status": (e.Status or "ACTIVE").upper(),
        "joinDate": fmt_date(e.HireDate),
        "email": e.Email or "",
        "phone": e.PhoneNumber or "",
        "gender": e.Gender or "",
        "dob": fmt_date(e.DateOfBirth),
    })

# ==========================================
# 1. NÂNG CẤP API THÊM NHÂN VIÊN
# ==========================================
@employees_bp.route("/api/employees", methods=["POST"])
def add_employee():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    dept_id = data.get("departmentId")
    pos_id = data.get("positionId")
    
    # MẸO: Lấy email từ form truyền lên. Nếu ko có, tự động tạo 1 email rác nhưng DUY NHẤT để khỏi lỗi DB
    email = data.get("email", f"nv{int(datetime.now().timestamp())}@company.com")
    
    emp = Employee(
        FullName=name,
        DateOfBirth=date(1990, 1, 1),
        Gender="N/A",
        PhoneNumber="0000000000",
        Email=email, # Gán email vào đây
        DepartmentID=int(dept_id) if dept_id else None,
        PositionID=int(pos_id) if pos_id else None,
        Status=data.get("status", "ACTIVE"),
        HireDate=datetime.now(),
        CreatedAt=datetime.now()
    )
    db.session.add(emp)
    db.session.flush() # Lấy EmployeeID ngay lập tức nhưng chưa lưu hẳn để phòng hờ lỗi
    
    # BƯỚC MỚI: TẠO TÀI KHOẢN ĐĂNG NHẬP
    new_account = Account(
        EmployeeID=emp.EmployeeID,
        Username=email,        # Dùng email làm tài khoản
        PasswordHash="123456", # Mật khẩu mặc định
        Role="Employee"        # Quyền mặc định là nhân viên quèn
    )
    db.session.add(new_account)
    
    # Sync to EmployeePayroll (MySQL)
    emp_payroll = EmployeePayroll(
        EmployeeID=emp.EmployeeID,
        FullName=emp.FullName,
        DepartmentID=emp.DepartmentID,
        PositionID=emp.PositionID,
        Status=emp.Status,
        SyncedAt=datetime.now()
    )
    db.session.add(emp_payroll)
    
    # Lưu TẤT CẢ cùng 1 lúc (Nếu lỗi 1 cái thì hủy toàn bộ, không bị kẹt rác)
    db.session.commit() 
    
    return jsonify({
        "status": "ok", 
        "employeeId": emp.EmployeeID,
        "message": f"Tạo thành công. Tài khoản: {email} / Mật khẩu: 123456"
    })


@employees_bp.route("/api/employees/<int:employee_id>", methods=["PUT"])
def update_employee(employee_id):
    data = request.get_json()
    emp = Employee.query.get_or_404(employee_id)
    
    if "name" in data: emp.FullName = data["name"]
    if "departmentId" in data:
        dept_id = data["departmentId"]
        emp.DepartmentID = int(dept_id) if dept_id else None
    if "positionId" in data:
        pos_id = data["positionId"]
        emp.PositionID = int(pos_id) if pos_id else None
    if "status" in data: emp.Status = data["status"]
    emp.UpdatedAt = datetime.now()
    db.session.commit()
    
    # Sync to EmployeePayroll
    emp_payroll = EmployeePayroll.query.get(employee_id)
    if emp_payroll:
        emp_payroll.FullName = emp.FullName
        emp_payroll.DepartmentID = emp.DepartmentID
        emp_payroll.PositionID = emp.PositionID
        emp_payroll.Status = emp.Status
        emp_payroll.SyncedAt = datetime.now()
        db.session.commit()
        
    return jsonify({"status": "ok"})


# ==========================================
# 2. NÂNG CẤP API XÓA NHÂN VIÊN
# ==========================================
@employees_bp.route("/api/employees/<int:employee_id>", methods=["DELETE"])
def delete_employee(employee_id):
    # Check constraints
    has_attendance = Attendance.query.filter_by(EmployeeID=employee_id).first()
    has_salary = Salary.query.filter_by(EmployeeID=employee_id).first()
    has_dividend = Dividend.query.filter_by(EmployeeID=employee_id).first()
    
    if has_attendance or has_salary or has_dividend:
        return jsonify({"error": "Cannot delete employee. Existing payroll or attendance records found."}), 400
        
    # BƯỚC MỚI: XÓA TÀI KHOẢN TRƯỚC ĐỂ KHÔNG BỊ LỖI RÀNG BUỘC
    acc = Account.query.filter_by(EmployeeID=employee_id).first()
    if acc:
        db.session.delete(acc)
        
    emp_payroll = EmployeePayroll.query.get(employee_id)
    if emp_payroll:
        db.session.delete(emp_payroll)
        
    emp = Employee.query.get_or_404(employee_id)
    db.session.delete(emp)
    
    db.session.commit()
    return jsonify({"status": "ok"})