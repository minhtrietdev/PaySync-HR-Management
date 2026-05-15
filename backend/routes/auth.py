from flask import Blueprint, jsonify, request
from flask_cors import cross_origin # Dùng vũ khí hạng nặng
from models import Account

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/login", methods=["POST", "OPTIONS"])
@cross_origin() # Bùa chú ép buộc mở cửa CORS cho riêng API này
def login():
    # Tiếp đón lệnh "thăm dò" của trình duyệt bằng nụ cười (Mã 200)
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "Không có dữ liệu gửi lên"}), 400

    email = data.get("username")
    password = data.get("password")

    # Tìm tài khoản trong database
    account = Account.query.filter_by(Username=email).first()

    if not account or account.PasswordHash != password:
        return jsonify({"error": "Sai email hoặc mật khẩu! Vui lòng thử lại."}), 401

    # Nếu đúng, cấp vé vào cổng
    return jsonify({
        "status": "success",
        "user": {
            "id": account.EmployeeID,
            "email": account.Username,
            "role": account.Role
        }
    }), 200