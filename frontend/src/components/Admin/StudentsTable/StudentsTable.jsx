import { Link } from "react-router-dom";
import "./StudentsTable.css";

function getInitials(name) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function StudentsTable({ students }) {
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        await fetch(`/api/students/${id}`, {
            method: "DELETE",
        });

        window.location.reload();
    };

    return (
        <div className="admin-students-table-wrapper">
            <table className="admin-students-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Course</th>
                        <th>Enrollment Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td>
                                <div className="admin-student-name-cell">
                                    <span className="admin-student-avatar">
                                        {getInitials(student.name)}
                                    </span>
                                    <span>{student.name}</span>
                                </div>
                            </td>
                            <td>{student.email}</td>
                            <td>{student.phone}</td>
                            <td>{student.course}</td>
                            <td>{student.enrollmentDate}</td>
                            <td>{student.status}</td>

                            <td>
                                <Link to={`/student-details/${student.id}`}>
                                    View Details
                                </Link>

                                <button onClick={() => handleDelete(student.id)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}