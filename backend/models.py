from extensions import db

# ─────────────────────────────────────────────
#  SQL SERVER MODELS  (HUMAN_2025)
# ─────────────────────────────────────────────

class Department(db.Model):
    __tablename__ = "Departments"
    __bind_key__ = "default"
    DepartmentID   = db.Column(db.Integer, primary_key=True)
    DepartmentName = db.Column(db.String(100), nullable=False)
    CreatedAt      = db.Column(db.DateTime)
    UpdatedAt      = db.Column(db.DateTime)


class Position(db.Model):
    __tablename__ = "Positions"
    __bind_key__ = "default"
    PositionID   = db.Column(db.Integer, primary_key=True)
    PositionName = db.Column(db.String(100), nullable=False)
    CreatedAt    = db.Column(db.DateTime)
    UpdatedAt    = db.Column(db.DateTime)


class Employee(db.Model):
    __tablename__ = "Employees"
    __bind_key__ = "default"
    EmployeeID   = db.Column(db.Integer, primary_key=True)
    
    # Sửa String thành Unicode ở đây để lưu tiếng Việt
    FullName     = db.Column(db.Unicode(100), nullable=False) 
    
    DateOfBirth  = db.Column(db.Date)
    Gender       = db.Column(db.Unicode(10)) # Chữ 'Nam', 'Nữ' cũng cần Unicode
    PhoneNumber  = db.Column(db.String(15))
    Email        = db.Column(db.String(100))
    HireDate     = db.Column(db.Date)
    DepartmentID = db.Column(db.Integer, db.ForeignKey("Departments.DepartmentID"))
    PositionID   = db.Column(db.Integer, db.ForeignKey("Positions.PositionID"))
    
    # Sửa String thành Unicode ở đây để lưu chữ 'Đang làm việc'
    Status       = db.Column(db.Unicode(50)) 
    
    CreatedAt    = db.Column(db.DateTime)
    UpdatedAt    = db.Column(db.DateTime)

class Dividend(db.Model):
    __tablename__ = "Dividends"
    __bind_key__ = "default"
    DividendID     = db.Column(db.Integer, primary_key=True)
    EmployeeID     = db.Column(db.Integer, db.ForeignKey("Employees.EmployeeID"))
    DividendAmount = db.Column(db.Numeric(12, 2), nullable=False)
    DividendDate   = db.Column(db.Date, nullable=False)
    CreatedAt      = db.Column(db.DateTime)

# Thêm vào models.py (phần SQL Server)
class Account(db.Model):
    __tablename__ = "Accounts"
    __bind_key__ = "default"
    AccountID    = db.Column(db.Integer, primary_key=True)
    EmployeeID   = db.Column(db.Integer, db.ForeignKey("Employees.EmployeeID"), unique=True, nullable=False)
    Username     = db.Column(db.String(100), unique=True, nullable=False)
    PasswordHash = db.Column(db.String(500), nullable=False) # Lưu hash của mật khẩu
    Role         = db.Column(db.String(20), nullable=False) # 'Admin', 'Manager', 'Employee'
    CreatedAt    = db.Column(db.DateTime, default=db.func.now())

    # Thiết lập quan hệ ngược lại với Employee để dễ truy vấn
    employee = db.relationship("Employee", backref=db.backref("account", uselist=False))


# ─────────────────────────────────────────────
#  MYSQL MODELS  (payroll)
# ─────────────────────────────────────────────

class Attendance(db.Model):
    __tablename__ = "attendance"
    __bind_key__ = "payroll"
    AttendanceID      = db.Column(db.Integer, primary_key=True)
    EmployeeID        = db.Column(db.Integer)
    WorkDays          = db.Column(db.Integer)
    AbsentDays        = db.Column(db.Integer)
    LeaveDays         = db.Column(db.Integer)
    AttendanceMonth   = db.Column(db.Date)
    CreatedAt         = db.Column(db.DateTime)


class Salary(db.Model):
    __tablename__ = "salaries"
    __bind_key__ = "payroll"
    SalaryID    = db.Column(db.Integer, primary_key=True)
    EmployeeID  = db.Column(db.Integer)
    SalaryMonth = db.Column(db.Date)
    BaseSalary  = db.Column(db.Numeric(15, 2))
    Bonus       = db.Column(db.Numeric(15, 2))
    Deductions  = db.Column(db.Numeric(15, 2))
    NetSalary   = db.Column(db.Numeric(15, 2))
    CreatedAt   = db.Column(db.DateTime)


class EmployeePayroll(db.Model):
    __tablename__ = "employees_payroll"
    __bind_key__ = "payroll"
    EmployeeID   = db.Column(db.Integer, primary_key=True)
    FullName     = db.Column(db.String(100))
    DepartmentID = db.Column(db.Integer)
    PositionID   = db.Column(db.Integer)
    Status       = db.Column(db.String(50))
    SyncedAt     = db.Column(db.DateTime)


class DepartmentPayroll(db.Model):
    __tablename__ = "departments_payroll"
    __bind_key__ = "payroll"
    DepartmentID   = db.Column(db.Integer, primary_key=True)
    DepartmentName = db.Column(db.String(100))
    SyncedAt       = db.Column(db.DateTime)


class PositionPayroll(db.Model):
    __tablename__ = "positions_payroll"
    __bind_key__ = "payroll"
    PositionID   = db.Column(db.Integer, primary_key=True)
    PositionName = db.Column(db.String(100))
    SyncedAt     = db.Column(db.DateTime)