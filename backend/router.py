# =====================================================================
# 1. IMPORT THƯ VIỆN
# =====================================================================
from flask import Blueprint, jsonify, request
# Blueprint: giúp chia cấu trúc API thành từng nhóm riêng.
# jsonify: dùng để trả dữ liệu JSON về cho Frontend (JavaScript).
# request: dùng để lấy dữ liệu gửi từ Frontend lên (POST, PUT).

from config import get_sqlserver_connection, get_mysql_connection
# Import 2 hàm do bạn định nghĩa trong file config.py.
# get_sqlserver_connection(): tạo kết nối SQL Server (HUMAN)
# get_mysql_connection(): tạo kết nối MySQL (PAYROLL)

# =====================================================================
# 2. TẠO ĐỐI TƯỢNG BLUEPRINT CHỨA TOÀN BỘ API
# =====================================================================
router = Blueprint("router", __name__)
# "router" là tên của Blueprint.
# __name__ giúp Flask biết vị trí file để map route.


# =====================================================================
# 0. API: LẤY DANH SÁCH PHÒNG BAN (DEPARTMENTS)
# =====================================================================
@router.route("/api/departments")
def get_departments():
    sql = get_sqlserver_connection() # Mở kết nối tới DB SQL Server (HUMAN)
    cur = sql.cursor()               # Tạo con trỏ thực thi SQL

    cur.execute("""
        SELECT DepartmentID, DepartmentName 
        FROM Departments 
        ORDER BY DepartmentName
    """) # Lấy toàn bộ phòng ban, sắp xếp theo tên
    
    rows = [
        {"DepartmentID": r[0], "DepartmentName": r[1]}
        for r in cur.fetchall()
    ]
    return jsonify(rows) # Trả dữ liệu JSON về Frontend


# =====================================================================
# 0. API: LẤY DANH SÁCH CHỨC VỤ (POSITIONS)
# =====================================================================
@router.route("/api/positions")
def get_positions():
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    
    cur.execute("""
        SELECT PositionID, PositionName 
        FROM Positions 
        ORDER BY PositionName
    """)
    
    rows = [
        {"PositionID": r[0], "PositionName": r[1]}
        for r in cur.fetchall()
    ]
    return jsonify(rows)


# =====================================================================
# 1. API: LẤY DANH SÁCH NHÂN VIÊN (GET EMPLOYEES)
# =====================================================================
@router.route("/api/employees")
def get_employees():
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    
    # Query JOIN 3 bảng để lấy tên phòng ban & chức vụ
    cur.execute("""
        SELECT e.EmployeeID, e.FullName, d.DepartmentName, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        ORDER BY e.EmployeeID
    """)
    
    rows = [] 
    for r in cur.fetchall():
        rows.append({
            "EmployeeID": r[0],   # ID của nhân viên
            "FullName": r[1],     # Họ tên
            "Department": r[2],   # Tên phòng ban
            "Position": r[3]      # Tên chức vụ
        })
    return jsonify(rows)


# =====================================================================
# 2. API: LẤY CHI TIẾT NHÂN VIÊN THEO ID (GET EMPLOYEE DETAIL)
# =====================================================================
@router.route("/api/employees/<int:emp_id>")
def get_employee_detail(emp_id):
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    
    cur.execute("""
        SELECT 
            e.EmployeeID, e.FullName, e.Email, e.DateOfBirth, e.Gender, 
            e.PhoneNumber, e.HireDate, e.Status, 
            d.DepartmentID, d.DepartmentName, 
            p.PositionID, p.PositionName
        FROM Employees e
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        LEFT JOIN Positions p ON e.PositionID = p.PositionID
        WHERE EmployeeID = ?
    """, emp_id)
    
    r = cur.fetchone() # Lấy 1 dòng duy nhất
    
    if not r: # Nếu không tìm thấy nhân viên
        return jsonify({"msg": "Employee not found"}), 404
        
    return jsonify({
        "EmployeeID": r[0],
        "FullName": r[1],
        "Email": r[2],
        "DateOfBirth": r[3],
        "Gender": r[4],
        "PhoneNumber": r[5],
        "HireDate": r[6],
        "Status": r[7],
        "DepartmentID": r[8],
        "DepartmentName": r[9],
        "PositionID": r[10],
        "PositionName": r[11]
    })


# =====================================================================
# 3. API: THÊM NHÂN VIÊN MỚI (CREATE EMPLOYEE)
# =====================================================================
@router.route("/api/employees", methods=["POST"])
def add_employee():
    data = request.get_json() # Lấy JSON mà Frontend gửi qua fetch()
    
    # Lấy từng trường dữ liệu
    full_name = data.get("FullName")
    dob       = data.get("DateOfBirth")
    gender    = data.get("Gender")
    phone     = data.get("PhoneNumber")
    email     = data.get("Email")
    hire_date = data.get("HireDate")
    dept_id   = data.get("DepartmentID") or None
    pos_id    = data.get("PositionID") or None
    status    = data.get("Status") or "Active"

    # 1. CHECK EMAIL TRÙNG TRONG SQL SERVER
    sql = get_sqlserver_connection()
    cur = sql.cursor()
    cur.execute("SELECT COUNT(*) FROM Employees WHERE Email = ?", email)
    if cur.fetchone()[0] > 0:
        return jsonify({"status": "error", "msg": "Email đã tồn tại"}), 400

    # 2. BẮT ĐẦU TRANSACTION CHO 2 DATABASE
    my = get_mysql_connection()
    sql.autocommit = False      # Buộc SQL Server chờ commit
    my.start_transaction()      # Bắt đầu transaction trong MySQL

    try:
        # 3. INSERT SQL SERVER VÀ LẤY EMPLOYEEID MỚI
        cur.execute("""
            INSERT INTO Employees
            (FullName, DateOfBirth, Gender, PhoneNumber, Email, 
             HireDate, DepartmentID, PositionID, Status)
            OUTPUT INSERTED.EmployeeID
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (full_name, dob, gender, phone, email, hire_date, dept_id, pos_id, status))
        
        row = cur.fetchone()
        new_id = int(row[0]) # Lấy EmployeeID mới tạo

        # 4. INSERT SANG MYSQL ĐỂ ĐỒNG BỘ PAYROLL
        my_cur = my.cursor(dictionary=True)
        my_cur.execute("""
            INSERT INTO employees_payroll
            (EmployeeID, FullName, DepartmentID, PositionID, Status)
            VALUES (%s, %s, %s, %s, %s)
        """, (new_id, full_name, dept_id, pos_id, status))

        # Cả 2 đều thành công -> commit 2 DB
        sql.commit()
        my.commit()
        
    except Exception as e:
        # Nếu có lỗi ở 1 trong 2 DB -> rollback cả 2
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({
        "status": "success",
        "msg": f"Thêm nhân viên thành công (ID = {new_id})"
    })


# =====================================================================
# 4. API: UPDATE NHÂN VIÊN
# =====================================================================
@router.route("/api/employees/<int:emp_id>", methods=["PUT"])
def update_employee(emp_id):
    data = request.get_json()
    
    full_name = data.get("FullName")
    dob       = data.get("DateOfBirth")
    gender    = data.get("Gender")
    phone     = data.get("PhoneNumber")
    email     = data.get("Email")
    hire_date = data.get("HireDate")
    dept_id   = data.get("DepartmentID")
    pos_id    = data.get("PositionID")
    status    = data.get("Status")

    sql = get_sqlserver_connection()
    my = get_mysql_connection()

    sql.autocommit = False
    my.start_transaction()

    try:
        # UPDATE SQL SERVER
        cur = sql.cursor()
        cur.execute("""
            UPDATE Employees
            SET 
                FullName=?, DateOfBirth=?, Gender=?, PhoneNumber=?, 
                Email=?, HireDate=?, DepartmentID=?, PositionID=?, Status=?
            WHERE EmployeeID=?
        """, (full_name, dob, gender, phone, email, hire_date, dept_id, pos_id, status, emp_id))

        # UPDATE MYSQL (PAYROLL)
        my_cur = my.cursor(dictionary=True)
        my_cur.execute("""
            UPDATE employees_payroll
            SET 
                FullName=%s, DepartmentID=%s, PositionID=%s, Status=%s
            WHERE EmployeeID=%s
        """, (full_name, dept_id, pos_id, status, emp_id))

        sql.commit()
        my.commit()
        
    except Exception as e:
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Update thành công"})


# =====================================================================
# 5. API: XÓA NHÂN VIÊN
# =====================================================================
@router.route("/api/employees/<int:emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    sql = get_sqlserver_connection()
    my = get_mysql_connection()

    sql.autocommit = False
    my.start_transaction()

    try:
        cur = sql.cursor()
        
        # CHECK RÀNG BUỘC: NẾU NHÂN VIÊN CÓ DIVIDENDS -> KHÔNG XOÁ
        cur.execute("SELECT COUNT(*) FROM Dividends WHERE EmployeeID=?", emp_id)
        if cur.fetchone()[0] > 0:
            return jsonify({
                "status": "error", 
                "msg": "Không thể xoá nhân viên có Dividends"
            }), 400

        # XÓA TRONG SQL SERVER
        cur.execute("DELETE FROM Employees WHERE EmployeeID=?", emp_id)

        # XÓA TRONG MYSQL (PAYROLL, ATTENDANCE, SALARIES)
        my_cur = my.cursor(dictionary=True)
        my_cur.execute("DELETE FROM employees_payroll WHERE EmployeeID=%s", (emp_id,))
        my_cur.execute("DELETE FROM attendance WHERE EmployeeID=%s", (emp_id,))
        my_cur.execute("DELETE FROM salaries WHERE EmployeeID=%s", (emp_id,))

        sql.commit()
        my.commit()
        
    except Exception as e:
        sql.rollback()
        my.rollback()
        return jsonify({"status": "error", "msg": str(e)}), 500

    return jsonify({"status": "success", "msg": "Xoá thành công"})
