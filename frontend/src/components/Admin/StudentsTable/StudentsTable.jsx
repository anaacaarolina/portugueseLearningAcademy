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
  return (
    <section className="admin-students-section">
      <div className="admin-students-header">
        <h2>Students</h2>
        <p className="admin-students-count-pill">{students.length} students</p>
      </div>

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
                    <span className="admin-student-avatar">{getInitials(student.name)}</span>
                    <span>{student.name}</span>
                  </div>
                </td>
                <td>{student.email}</td>
                <td>{student.phone}</td>
                <td>{student.course}</td>
                <td>{student.enrollmentDate}</td>
                <td>
                  <span className={`admin-student-status-pill status-${student.status.toLowerCase()}`}>{student.status}</span>
                </td>
                <td>
                  <Link className="admin-student-action-link" to="/student-details">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
