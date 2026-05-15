from flask import Blueprint, jsonify, request
from datetime import datetime, date
from extensions import db
from models import Department, DepartmentPayroll, Position, PositionPayroll, Employee, EmployeePayroll

departments_bp = Blueprint("departments", __name__)

@departments_bp.route("/api/departments", methods=["POST"])
def add_department():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "Name is required"}), 400
    new_dept = Department(DepartmentName=name, CreatedAt=datetime.now())
    db.session.add(new_dept)
    db.session.commit()
    
    # Sync to DepartmentPayroll
    dept_payroll = DepartmentPayroll(
        DepartmentID=new_dept.DepartmentID,
        DepartmentName=new_dept.DepartmentName,
        SyncedAt=datetime.now()
    )
    db.session.add(dept_payroll)
    db.session.commit()
    return jsonify({"status": "ok", "id": new_dept.DepartmentID, "name": new_dept.DepartmentName})


@departments_bp.route("/api/departments/<int:dept_id>", methods=["PUT"])
def update_department(dept_id):
    data = request.get_json()
    dept = Department.query.get_or_404(dept_id)
    if "name" in data:
        dept.DepartmentName = data["name"]
        dept.UpdatedAt = datetime.now()
        db.session.commit()
        
        dept_payroll = DepartmentPayroll.query.get(dept_id)
        if dept_payroll:
            dept_payroll.DepartmentName = dept.DepartmentName
            dept_payroll.SyncedAt = datetime.now()
            db.session.commit()
            
    return jsonify({"status": "ok"})


@departments_bp.route("/api/departments/<int:dept_id>", methods=["DELETE"])
def delete_department(dept_id):
    # Check if there are employees in this department
    has_emp = Employee.query.filter_by(DepartmentID=dept_id).first()
    if has_emp:
        return jsonify({"error": "Cannot delete department with existing employees."}), 400
        
    dept_payroll = DepartmentPayroll.query.get(dept_id)
    if dept_payroll:
        db.session.delete(dept_payroll)
        
    dept = Department.query.get_or_404(dept_id)
    db.session.delete(dept)
    db.session.commit()
    return jsonify({"status": "ok"})


@departments_bp.route("/api/departments/<int:dept_id>/positions", methods=["POST"])
def add_position_to_department(dept_id):
    data = request.get_json()
    pos_id = data.get("positionId")
    if not pos_id:
        return jsonify({"error": "Position ID is required"}), 400
        
    pos = Position.query.get_or_404(pos_id)
    
    # Create the dummy employee
    emp = Employee(
        FullName=f"Open Role - {pos.PositionName}",
        DateOfBirth=date(1990, 1, 1),
        Gender="N/A",
        PhoneNumber="0000000000",
        Email="openrole@company.com",
        DepartmentID=dept_id,
        PositionID=pos.PositionID,
        Status="INACTIVE",
        HireDate=datetime.now(),
        CreatedAt=datetime.now()
    )
    db.session.add(emp)
    db.session.commit()
    
    # Sync the dummy employee
    emp_payroll = EmployeePayroll(
        EmployeeID=emp.EmployeeID,
        FullName=emp.FullName,
        DepartmentID=emp.DepartmentID,
        PositionID=emp.PositionID,
        Status=emp.Status,
        SyncedAt=datetime.now()
    )
    db.session.add(emp_payroll)
    db.session.commit()
    
    return jsonify({"status": "ok", "positionId": pos.PositionID, "employeeId": emp.EmployeeID})


@departments_bp.route("/api/departments", methods=["GET"])
def get_departments():
    departments = Department.query.all()
    employees   = Employee.query.all()
    positions   = Position.query.all()

    # Count employees per dept and per position within dept
    emp_by_dept = {}
    emp_by_pos_dept = {}
    for e in employees:
        if e.DepartmentID is None: continue
        emp_by_dept.setdefault(e.DepartmentID, 0)
        emp_by_dept[e.DepartmentID] += 1

        if e.PositionID is None: continue
        key = (e.DepartmentID, e.PositionID)
        emp_by_pos_dept.setdefault(key, 0)
        emp_by_pos_dept[key] += 1

    pos_map = {p.PositionID: p.PositionName for p in positions}

    # Collect all position IDs that appear in each dept
    pos_in_dept = {}
    for e in employees:
        if e.DepartmentID is not None and e.PositionID is not None:
            pos_in_dept.setdefault(e.DepartmentID, set()).add(e.PositionID)

    # Icon assignment (cycle through available icons)
    icons = ["code", "people", "finance", "chart", "settings"]

    result = []
    for i, dept in enumerate(departments):
        headcount = emp_by_dept.get(dept.DepartmentID, 0)

        positions_list = []
        for pid in pos_in_dept.get(dept.DepartmentID, []):
            hc = emp_by_pos_dept.get((dept.DepartmentID, pid), 0)
            positions_list.append({
                "rawId": pid,
                "level": "1a",
                "title": pos_map.get(pid, f"Position {pid}"),
                "hc":    f"{hc} HC",
                "open":  False,
            })

        result.append({
            "id":        f"DEP-{dept.DepartmentID:03d}",
            "rawId":     dept.DepartmentID,
            "name":      dept.DepartmentName,
            "employees": headcount,
            "budget":    "—",
            "icon":      icons[i % len(icons)],
            "positions": positions_list,
        })

    return jsonify(result)


@departments_bp.route("/api/positions", methods=["GET"])
def get_positions():
    positions = Position.query.all()
    result = [{"id": p.PositionID, "title": p.PositionName} for p in positions]
    return jsonify(result)