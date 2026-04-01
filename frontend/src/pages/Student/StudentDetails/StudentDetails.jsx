import "./StudentDetails.css";
import { ArrowLeft, CalendarDays, GraduationCap, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function StudentDetails() {
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const student = {
    name: "Ana Costa",
    status: "Active",
    email: "ana.costa@email.com",
    phone: "+351 912 345 111",
    enrollmentDate: "2026-02-15",
    course: "Beginner A1-A2",
  };

  function handleSaveNotes() {
    // Persists notes locally until API persistence is added.
    localStorage.setItem(`student-notes-${student.email}`, notes);
    setIsSaved(true);
  }

  return (
    <div className="student-details-page">
      <section className="student-details-back-link-section">
        <Link to="/admin-dashboard" className="student-details-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Admin Dashboard
        </Link>
      </section>

      <section className="student-details-card">
        <header className="student-details-header">
          <div className="student-details-name-group">
            <span className="student-details-avatar">{getInitials(student.name)}</span>
            <h1>{student.name}</h1>
          </div>
          <span className={`student-details-status-pill status-${student.status.toLowerCase()}`}>{student.status}</span>
        </header>

        <div className="student-details-info-grid">
          <div className="student-details-info-item">
            <div className="student-details-info-item-icon">
              <Mail size={18} aria-hidden="true" />{" "}
            </div>
            <div className="student-details-info-item-text">
              <p>Email</p>
              <span>{student.email}</span>
            </div>
          </div>

          <div className="student-details-info-item">
            <div className="student-details-info-item-icon">
              <Phone size={18} aria-hidden="true" />
            </div>
            <div className="student-details-info-item-text">
              <p>Phone</p>
              <span>{student.phone}</span>
            </div>
          </div>

          <div className="student-details-info-item">
            <div className="student-details-info-item-icon">
              <CalendarDays size={18} aria-hidden="true" />{" "}
            </div>
            <div className="student-details-info-item-text">
              <p>Enrollment Date</p>
              <span>{student.enrollmentDate}</span>
            </div>
          </div>

          <div className="student-details-info-item">
            <div className="student-details-info-item-icon">
              <GraduationCap size={18} aria-hidden="true" />{" "}
            </div>
            <div className="student-details-info-item-text">
              <p>Course</p>
              <span>{student.course}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="student-details-notes-section">
        <h2>Admin Notes</h2>
        <p>Add private notes about this student to keep follow-up details organized.</p>
        <textarea
          className="student-details-notes-textarea"
          placeholder="Write notes about attendance, goals, concerns, or any next actions..."
          rows={8}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setIsSaved(false);
          }}
        />
        <div className="student-details-notes-actions">
          <button type="button" className="student-details-save-button" onClick={handleSaveNotes}>
            Save Notes
          </button>
          {isSaved ? <span className="student-details-saved-feedback">Notes saved</span> : null}
        </div>
      </section>
    </div>
  );
}
