import { Link } from "react-router-dom";
import { useState } from "react";
import "./StudentsTable.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getStudentIsActive(student) {
  if (typeof student.is_active === "boolean") {
    return student.is_active;
  }

  if (typeof student.status === "string") {
    return student.status.toLowerCase() === "active";
  }

  return true;
}

export default function StudentsTable({ students }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const openSchedule = async (student) => {
    setSelectedStudent(student);

    const res = await fetch(`/api/teachers/by_course/${student.course}`);
    const teachers = await res.json();

    if (teachers.length > 0) {
      setSelectedTeacher(teachers[0].id);

      const slotsRes = await fetch(`/api/teachers/${teachers[0].id}/available-slots`);
      const slots = await slotsRes.json();

      setAvailableSlots(slots);
    }
  };

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot.id)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slot.id));
    } else {
      setSelectedSlots([...selectedSlots, slot.id]);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          teacherId: selectedTeacher,
          slots: selectedSlots.map((id) => ({ id })),
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      alert("Booking successful!");
      setSelectedSlots([]);
    } catch (err) {
      console.error(err);
      alert("Booking failed!");
    }
  };

  return (
    <div className="admin-students-section">
      <div className="admin-students-header">
        <h2>Students</h2>
        <span className="admin-students-count-pill">Total students: {students?.length ?? 0}</span>
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
            {students.map((student) => {
              const isActive = getStudentIsActive(student);

              return (
                <tr key={student.id}>
                  <td>
                    <div className="admin-student-name-cell">
                      <span className="admin-student-avatar">{getInitials(student.name)}</span>
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td>{student.email}</td>
                  <td>{student.phone || "-"}</td>
                  <td>{student.course || "-"}</td>
                  <td>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "-"}</td>
                  <td>
                    <span className={`admin-student-status-pill ${isActive ? "status-active" : "status-inactive"}`}>{isActive ? "Active" : "Inactive"}</span>
                  </td>
                  <td>
                    <Link to={`/student-details/${student.id}`} className="admin-student-action-link">
                      View Details
                    </Link>
                    {student.course && <button onClick={() => openSchedule(student)}>Schedule Course</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {selectedStudent && (
          <div className="modal">
            <div className="modal-content">
              <h3>Schedule Classes</h3>

              {availableSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => toggleSlot(slot)}
                  style={{
                    backgroundColor: selectedSlots.includes(slot.id) ? "blue" : "lightgray",
                  }}
                >
                  {slot.day} {slot.start}-{slot.end}
                </button>
              ))}
              <button onClick={handleConfirmBooking}>Confirm Booking</button>

              <button onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
