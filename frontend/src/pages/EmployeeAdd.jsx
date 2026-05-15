// Import các React hooks
// useState: dùng để lưu dữ liệu trong component
// useEffect: dùng để chạy code khi component được render
import { useEffect, useState } from "react";

// useNavigate dùng để chuyển trang bằng code (programmatic navigation)
import { useNavigate } from "react-router-dom";

// Component dùng để thêm nhân viên mới
export default function EmployeeAdd() {

    // nav dùng để điều hướng trang
    const nav = useNavigate();

    // STATE lưu dữ liệu của form
    // Mỗi field tương ứng với một cột trong database
    const [form, setForm] = useState({
        FullName: "",
        DateOfBirth: "",
        Gender: "",
        PhoneNumber: "",
        Email: "",
        HireDate: "",
        DepartmentID: "",
        PositionID: "",
        Status: "Nhân viên chính thức", // giá trị mặc định
    });

    // STATE lưu dữ liệu cho dropdown
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    // Hàm xử lý khi người dùng thay đổi dữ liệu trong form
    const handleChange = (e) => {
        // Cập nhật state form
        setForm({
            ...form,                       // giữ nguyên các field cũ
            [e.target.id]: e.target.value, // cập nhật field đang thay đổi
        });
    };

    // Hàm load dữ liệu cho dropdown (department và position)
    const loadDropdowns = () => {
        // Gọi API lấy danh sách phòng ban
        fetch("http://localhost:5000/api/departments")
            .then((r) => r.json())
            .then((data) => setDepartments(data));

        // Gọi API lấy danh sách chức vụ
        fetch("http://localhost:5000/api/positions")
            .then((r) => r.json())
            .then((data) => setPositions(data));
    };

    // Hàm gửi dữ liệu form lên backend Flask
    const handleSubmit = (e) => {
        // Ngăn form reload trang
        e.preventDefault();

        // Gửi request POST đến API
        fetch("http://localhost:5000/api/employees", {
            method: "POST",
            // Header báo server biết dữ liệu gửi là JSON
            headers: { "Content-Type": "application/json" },
            // Chuyển object form thành JSON
            body: JSON.stringify(form),
        })
            // Nhận kết quả từ server
            .then((r) => r.json())
            .then((res) => {
                // Hiển thị thông báo từ backend
                alert(res.msg);

                // Nếu thêm thành công thì quay lại trang danh sách nhân viên
                if (res.status === "success") {
                    nav("/");
                }
            });
    };

    // useEffect chạy khi component được mở
    // Dùng để load dữ liệu dropdown
    useEffect(() => {
        loadDropdowns();
    }, []);

    // JSX trả về giao diện của form
    return (
        <div>
            {/* Tiêu đề trang */}
            <h3>Add New Employee</h3>

            {/* Form nhập thông tin nhân viên */}
            <form onSubmit={handleSubmit} className="card p-4 mt-3">

                {/* Full Name */}
                <label>Full Name</label>
                <input
                    id="FullName"
                    className="form-control mb-2"
                    value={form.FullName}
                    onChange={handleChange}
                    required
                />

                {/* Date of Birth */}
                <label>Date of Birth</label>
                <input
                    type="date"
                    id="DateOfBirth"
                    className="form-control mb-2"
                    value={form.DateOfBirth}
                    onChange={handleChange}
                    required
                />

                {/* Gender */}
                <label>Gender</label>
                <select
                    id="Gender"
                    className="form-control mb-2"
                    value={form.Gender}
                    onChange={handleChange}
                    required
                >
                    <option value="">-- Select Gender --</option>
                    <option>Nam</option>
                    <option>Nữ</option>
                    <option>Khác</option>
                </select>

                {/* Phone Number */}
                <label>Phone Number</label>
                <input
                    id="PhoneNumber"
                    className="form-control mb-2"
                    value={form.PhoneNumber}
                    onChange={handleChange}
                    required
                />

                {/* Email */}
                <label>Email</label>
                <input
                    id="Email"
                    className="form-control mb-2"
                    value={form.Email}
                    onChange={handleChange}
                    required
                />

                {/* Hire Date */}
                <label>Hire Date</label>
                <input
                    type="date"
                    id="HireDate"
                    className="form-control mb-2"
                    value={form.HireDate}
                    onChange={handleChange}
                    required
                />

                {/* Department Dropdown */}
                <label>Department</label>
                <select
                    id="DepartmentID"
                    className="form-control mb-2"
                    value={form.DepartmentID}
                    onChange={handleChange}
                >
                    <option value="">-- Select Department --</option>
                    {/* Lặp qua danh sách departments để tạo option */}
                    {departments.map((d) => (
                        <option key={d.DepartmentID} value={d.DepartmentID}>
                            {d.DepartmentName}
                        </option>
                    ))}
                </select>

                {/* Position Dropdown */}
                <label>Position</label>
                <select
                    id="PositionID"
                    className="form-control mb-2"
                    value={form.PositionID}
                    onChange={handleChange}
                >
                    <option value="">-- Select Position --</option>
                    {/* Lặp qua danh sách positions */}
                    {positions.map((p) => (
                        <option key={p.PositionID} value={p.PositionID}>
                            {p.PositionName}
                        </option>
                    ))}
                </select>

                {/* Status */}
                <label>Status</label>
                <select
                    id="Status"
                    className="form-control mb-2"
                    value={form.Status}
                    onChange={handleChange}
                >
                    <option value="Nhân viên chính thức">Nhân viên chính thức</option>
                    <option value="Nhân viên thực tập">Nhân viên thực tập</option>
                    <option value="Đã nghỉ làm">Đã nghỉ làm</option>
                </select>

                {/* Nút submit form */}
                <button className="btn btn-primary mt-2">
                    Add Employee
                </button>

            </form>
        </div>
    );
}