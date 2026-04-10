import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
    const [courseTeachers, setCourseTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState([]);


    useEffect(() => {
        if (selectedStudent) {
            fetch(`/api/teachers/by_course/${selectedStudent.course}`)
                .then(res => res.json())
                .then(setCourseTeachers)
        }
    }, [selectedStudent]);

    const openSchedule = async (student) => {
        setSelectedStudent(student)

        const res = await fetch(`/api/teachers/by_course/${student.course}`);
        const teachers = await res.json();

        setCourseTeachers(teachers);

        if (teachers.length > 0) {
            setSelectedTeacher(teachers[0].id);

            const slotsRes = await fetch(`/api/teachers/${teachers[0].id}/available-slots`);
            const slots = await slotsRes.json();

            setAvailableSlots(slots);
        }
    };

    const toggleSlot = (slot) => {
        if (selectedSlots.includes(slot.id)) {
            setSelectedSlots(selectedSlots.filter(id => id !== slot.id));
        } else {
            setSelectedSlots([...selectedSlots, slot.id]);
        }
    };

    const bookRequest = async () => {
        await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentId: student.id,
                teacherId: selectedTeacher,
                slots: selectedSlots.map(id => ({id})),
            })
        });

        alert("class has been booked")
        setSelectedStudent(null);
        setSelectedSlots([]);
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        await fetch(`/api/students/${id}`, {
            method: "DELETE",
        });

        window.location.reload();
    };

    const handleConfirmBooking = async () => {
        try {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    teacherId: selectedTeacher,
                    slots: selectedSlots.map(id => ({ id }))
                })
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
                                {student.course && (
                                    <button onClick={() => openSchedule(student)}>
                                        Schedule Course
                                    </button>
                                )}
                                <button onClick={() => handleDelete(student.id)}>
                                    Delete
                                </button>
                            </td>

                        </tr>
                    ))}
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
                                    backgroundColor: selectedSlots.includes(slot.id)
                                        ? "blue"
                                        : "lightgray"
                                }}
                            >
                                {slot.day} {slot.start}-{slot.end}
                            </button>
                            
                        ))}
                        <button onClick={handleConfirmBooking}>
                            Confirm Booking
                        </button>

                        <button onClick={() => setSelectedStudent(null)}>Close</button>
                    </div>
                </div>
            )}

        </div>
    );
}