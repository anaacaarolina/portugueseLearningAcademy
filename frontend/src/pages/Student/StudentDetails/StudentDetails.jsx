import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./StudentDetails.css";

export default function StudentDetails() {

    const { id } = useParams(); // dynamic route
    const navigate = useNavigate();





    const [student, setStudent] = useState(null);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        fetch(`/api/students/${id}`)
            .then(async (response) => {
                const text = await response.text();
                console.log("RAW RESPONSE:", text);

                if (!text) {
                    throw new Error("Empty response from server");
                }

                return JSON.parse(text);
            })
            .then((data) => {
                setStudent(data);
                setNotes(data.notes || "");
            })
            .catch((err) => {
                console.error("Fetch error:", err);
            });
    }, [id]);

    const handleSaveNotes = async () => {
        try {
            await fetch(`/api/students/${id}/notes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ notes }),
            });
            alert("Notes saved successfully");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteStudent = async () => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        try {
            await fetch(`/api/students/${id}`, { method: "DELETE" });
            alert("Student deleted");
            navigate("/admin"); // redirect after delete
        } catch (error) {
            console.error(error);
        }
    };

    const handleClearNotes = () => {
        setNotes("");
    };

    if (!student) return <p>Loading...</p>;

    return (
        <div className="student-details">
            <h1>Student Details</h1>

            <div className="student-info">
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Phone:</strong> {student.phone}</p>
                <p><strong>Course:</strong> {student.course}</p>
                <p><strong>Status:</strong> {student.status}</p>
            </div>
            <div className="student-classes">
                <h3>Booked classes</h3>
                {student.bookings.map((b) => (
                    <div key={b.id} className="booking-card">
                        <div><strong>{b.day}</strong></div>
                        <div>{b.start} → {b.end}</div>
                        <div>Status: {b.status}</div>
                    </div>
                ))}
            </div>
            <div className="student-notes">
                <h3>Admin Notes</h3>

                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes about the student..."
                />

                <div className="student-note-actions">
                    <button onClick={handleSaveNotes}>Save Notes</button>
                    <button onClick={handleClearNotes}>Clear Notes</button>
                    <button onClick={handleDeleteStudent} className="delete-button">
                        Delete Student
                    </button>
                </div>
            </div>
        </div>
    );
}
