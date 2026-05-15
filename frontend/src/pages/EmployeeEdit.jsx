// Import các React hooks
// useState: dùng để lưu dữ liệu form và dropdown
// useEffect: dùng để chạy code khi component được render
import { useEffect, useState } from "react";

// useNavigate: chuyển trang bằng code
// useParams: lấy tham số từ URL (ví dụ /employees/5 -> id = 5)
import { useNavigate, useParams } from "react-router-dom";

// Component dùng để chỉnh sửa thông tin nhân viên
export default function EmployeeEdit() {

    // Hook điều hướng trang
    const nav = useNavigate();

    // Lấy id từ URL
    // Ví dụ URL: /employees/5 -> id = 5
    const { id } = useParams();

    // STATE lưu dữ liệu form nhân viên
    const [form, setForm] = useState({
        FullName: "",
        DateOfBirth: "",
        Gender: "",
        PhoneNumber: "",
        Email: "",
        HireDate: "",
        DepartmentID: "",
        PositionID: "",
        Status: "",
    });

    // STATE lưu dữ liệu dropdown
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    // Hàm xử lý khi người dùng thay đổi dữ liệu input
    const handleChange = (e) => {
        // Cập nhật state form
        setForm({
            ...form,                       // giữ nguyên dữ liệu cũ
            [e.target.id]: e.target.value, // cập nhật field vừa thay đổi
        });
    };

    // Hàm chuyển định dạng ngày
    // Backend thường trả dạng GMT
    // Input HTML date cần dạng YYYY-MM-DD
    const convertDate = (dt) => {
        if (!dt) return "";
        return new Date(dt)
            .toISOString()
            .substring(0, 10);
    };

    // Hàm load dữ liệu dropdown
    const loadDropdowns = () => {
        // Gọi API lấy danh sách phòng ban
        fetch("http://localhost:5000/api/departments")
            .then((res) => res.json())
            .then((data) => setDepartments(data))
            .catch(() => alert("Không load được danh sách phòng ban"));

        // Gọi API lấy danh sách chức vụ
        fetch("http://localhost:5000/api/positions")
            .then((res) => res.json())
            .then((data) => setPositions(data))
            .catch(() => alert("Không load được danh sách chức vụ"));
    };

    // Hàm load dữ liệu chi tiết của nhân viên
    const loadEmployee = () => {
        // Gọi API lấy thông tin nhân viên theo ID
        fetch(`http://localhost:5000/api/employees/${id}`)
            .then((res) => res.json())
            .then((data) => {
                // Đưa dữ liệu từ API vào form
                setForm({
                    FullName: data.FullName || "",
                    DateOfBirth: convertDate(data.DateOfBirth),
                    Gender: data.Gender || "",
                    PhoneNumber: data.PhoneNumber || "",
                    Email: data.Email || "",
                    HireDate: convertDate(data.HireDate),
                    DepartmentID: data.DepartmentID || "",
                    PositionID: data.PositionID || "",
                    Status: data.Status || "Active",
                });
            })
            .catch(() => alert("Không tải được dữ liệu nhân viên!"));
    };

    // Hàm gửi dữ liệu cập nhật lên backend
    const handleSubmit = (e) => {
        // Ngăn form reload trang
        e.preventDefault();

        // Gửi request PUT tới API
        fetch(`http://localhost:5000/api/employees/${id}`, {
            method: "PUT",
            // Header báo server dữ liệu gửi là JSON
            headers: { "Content-Type": "application/json" },
            // Chuyển object form thành JSON
            body: JSON.stringify(form),
        })
            .then((res) => res.json())
            .then((rs) => {
                // Hiển thị thông báo từ backend
                alert(rs.msg);

                // Nếu cập nhật thành công -> quay về danh sách nhân viên
                if (rs.status === "success") {
                    nav("/");
                }
            })
            .catch(() => alert("Không thể cập nhật nhân viên"));
    };

    // useEffect chạy khi trang được load
    useEffect(() => {
        // Load dropdown
        loadDropdowns();
        // Load dữ liệu nhân viên
        loadEmployee();
    }, []);

    // JSX giao diện chỉnh sửa nhân viên
    return (
        <div>
            {/* Tiêu đề trang */}
            <h3>Edit Employee</h3>

            {/* Form chỉnh sửa */}
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
                    type="email"
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

                {/* Department */}
                <label>Department</label>
                <select
                    id="DepartmentID"
                    className="form-control mb-2"
                    value={form.DepartmentID}
                    onChange={handleChange}
                    required
                >
                    <option value="">-- Select Department --</option>
                    {/* Tạo danh sách phòng ban */}
                    {departments.map((d) => (
                        <option key={d.DepartmentID} value={d.DepartmentID}>
                            {d.DepartmentName}
                        </option>
                    ))}
                </select>

                {/* Position */}
                <label>Position</label>
                <select
                    id="PositionID"
                    className="form-control mb-2"
                    value={form.PositionID}
                    onChange={handleChange}
                    required
                >
                    <option value="">-- Select Position --</option>
                    {/* Tạo danh sách chức vụ */}
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
                    required
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Đang làm việc">Đang làm việc</option>
                </select>

                {/* Nút lưu thay đổi */}
                <button className="btn btn-primary mt-2">
                    Save Changes
                </button>

            </form>
        </div>
    );
}