import pyodbc
import mysql.connector

# ============================================
# KẾT NỐI SQL SERVER (HUMAN)
# Hàm này tạo kết nối tới DB HUMAN bằng ODBC
# ============================================
def get_sqlserver_connection():
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost\\SQLEXPRESS;"     # <--- SỬA DÒNG NÀY (Thêm \\SQLEXPRESS)
            "DATABASE=HUMAN_2025;"                   # Đảm bảo database HUMAN đã được tạo
            "UID=sa;"
            "PWD=123;",                         # <--- ĐIỀN ĐÚNG MẬT KHẨU CỦA BẠN VÀO ĐÂY
            timeout=5
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối SQL Server:", str(e))
        raise

# ============================================
# KẾT NỐI MYSQL (PAYROLL)
# Dùng mysql.connector với autocommit = False
# ============================================
def get_mysql_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="minhtriet",
            database="payrool",  # <--- Sửa lại thành payrool
            autocommit=False            
        )
        return conn
    except Exception as e:
        print("Lỗi kết nối MySQL:", str(e))
        raise

# =====================================================================
# BỔ SUNG CẤU HÌNH MỚI CHO SQLALCHEMY (Dành cho app.py mới)
# =====================================================================

# 1. Chuỗi kết nối SQL Server (HUMAN_2025)
# Cú pháp: mssql+pyodbc://<username>:<password>@<server>/<database>?driver=<driver_name>
SQL_SERVER_CONN = r"mssql+pyodbc://sa:123@localhost\SQLEXPRESS/HUMAN_2025?driver=ODBC+Driver+17+for+SQL+Server"

# 2. Chuỗi kết nối MySQL (PAYROLL)
# Cú pháp: mysql+mysqlconnector://<username>:<password>@<server>/<database>
MYSQL_CONN = "mysql+mysqlconnector://root:minhtriet@localhost/payrool"    