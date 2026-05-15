from flask import Flask, jsonify
from flask_cors import CORS
import config
from extensions import db

# 1. Import tất cả các đường dẫn
from routes.employees import employees_bp
from routes.departments import departments_bp
from routes.payroll import payroll_bp
from routes.dashboard import dashboard_bp, dividends_bp
from routes.auth import auth_bp

# 2. KHỞI TẠO ỨNG DỤNG (Chỉ dùng 1 lần duy nhất)
app = Flask(__name__)

# 3. CẤU HÌNH CORS (Cho phép React gọi)
CORS(app, resources={r"/*": {"origins": "*"}}, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# 4. CẤU HÌNH DATABASE
app.config["SQLALCHEMY_BINDS"] = {
    "default": config.SQL_SERVER_CONN,
    "payroll": config.MYSQL_CONN,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# 5. ĐĂNG KÝ TẤT CẢ BLUEPRINT VÀO ỨNG DỤNG
app.register_blueprint(auth_bp) # Đăng nhập đã ở đây!
app.register_blueprint(employees_bp)
app.register_blueprint(departments_bp)
app.register_blueprint(payroll_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(dividends_bp)

# 6. KIỂM TRA SỨC KHỎE
@app.route("/api/health")
def health_check():
    try:
        from models import Employee
        Employee.query.first()
        return jsonify({"status": "ok", "message": "Connected to all databases successfully!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)