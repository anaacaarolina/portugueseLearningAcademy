import "./AdminDashboard.css";
import { BookOpen, Euro, Target, Users, X } from "lucide-react";
import KpiCard from "../../../components/Admin/KpiCard/KpiCard";
import ManageContentSection from "../../../components/Admin/ManageContentSection/ManageContentSection";
import StudentsTable from "../../../components/Admin/StudentsTable/StudentsTable";
import TeacherForm from "../../../components/Admin/TeachersTables/TeacherForm/TeacherForm";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const kpis = [
  {
    id: 1,
    icon: Users,
    value: "5",
    title: "Active Students",
  },
  {
    id: 2,
    icon: BookOpen,
    value: "9",
    title: "Total Courses",
  },
  {
    id: 3,
    icon: Target,
    value: "87%",
    title: "Completion Rate",
  },
  {
    id: 4,
    icon: Euro,
    value: "€24,300",
    title: "Total Revenue",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [newSlot, setNewSlot] = useState({
    day: "Monday",
    start: "",
    end: "",
  });

  const [detailsTeacher, setDetailsTeacher] = useState(null);
  const [teacherAvailability, setTeacherAvailability] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  const tutorDetails = async (teacherId) => {
    setDetailsTeacher(teacherId);

    try {
      const res = await fetch(`/api/teachers/${teacherId}/availability`);

      if (!res.ok) {
        const text = await res.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to fetch teacher availability");
      }

      const data = await res.json();
      setTeacherAvailability(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this tutor?")) return;

    await fetch(`/api/teachers/${teacherId}`, {
      method: "DELETE",
    });

    window.location.reload();
  };

  const groupedAvailability = teacherAvailability.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  const handleTeacherSubmit = async (payload) => {
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to create teacher");
      }

      setShowTeacherModal(false);

      const res2 = await fetch("/api/teachers");
      if (res2.ok) {
        const data = await res2.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error(err);
      alert("Error creating teacher: " + err.message);
    }
  };

  useEffect(() => {
    fetch("/api/students")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error("SERVER ERROR:", text);
          throw new Error("Failed to fetch students");
        }
        return res.json();
      })
      .then(setStudents)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("/api/teachers")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error("SERVER ERROR:", text);
          throw new Error("Failed to fetch teachers");
        }
        return res.json();
      })
      .then(setTeachers)
      .catch(console.error);
  }, []);

  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-hero-section">
        <h1>Admin Dashboard</h1>
      </section>

      <section className="admin-kpis-section">
        <div className="admin-kpis-grid">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.id} icon={kpi.icon} value={kpi.value} title={kpi.title} />
          ))}
        </div>
      </section>

      <section>
        <h2>Teachers</h2>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Course</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.name}</td>
                <td>{teacher.course}</td>
                <td>
                  <button onClick={() => setSelectedTeacher(teacher.id)}>Set Availability</button>
                  <button onClick={() => tutorDetails(teacher.id)}>view details</button>
                  <button onClick={() => handleDelete(teacher.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedTeacher && (
          <div className="modal">
            <div className="modal-content">
              <h3>Set Availability</h3>
              <select value={newSlot.day} onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </select>

              <input type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} />

              <input type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} />

              <button
                onClick={() => {
                  setAvailability([...availability, newSlot]);
                  setNewSlot({ day: "Monday", start: "", end: "" });
                }}
              >
                Add slot
              </button>
              <button
                onClick={async () => {
                  if (!selectedTeacher) {
                    console.error("No teacher selected");
                    return;
                  }
                  try {
                    const res = await fetch(`/api/teachers/${selectedTeacher}/availability`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(availability),
                    });

                    if (!res.ok) {
                      const text = await res.text();
                      console.error("SERVER ERROR:", text);
                      throw new Error("Failed to save availability");
                    }

                    alert("Availability saved!");
                    setSelectedTeacher(null);
                    setAvailability([]);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Save Availability
              </button>
              <ul>
                {availability.map((slot, index) => (
                  <li key={index}>
                    {slot.day} - {slot.start} to {slot.end}
                    <button onClick={() => setAvailability(availability.filter((_, i) => i !== index))}>Remove</button>
                  </li>
                ))}
              </ul>
              <button onClick={() => setSelectedTeacher(null)}>Close</button>
            </div>
          </div>
        )}
        {detailsTeacher && (
          <div className="modal">
            <div className="modal-content">
              <h3>Teacher Availability</h3>

              {Object.keys(groupedAvailability).length === 0 ? (
                <p>No availability set</p>
              ) : (
                Object.entries(groupedAvailability).map(([day, slots]) => (
                  <div key={day}>
                    <strong>{day}</strong>
                    <ul>
                      {slots.map((slot, index) => (
                        <li key={index}>
                          {slot.start} - {slot.end}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}

              <button onClick={() => setDetailsTeacher(null)}>Close</button>
            </div>
          </div>
        )}

        <div className="admin-manage-content-actions">
          <button type="button" onClick={() => setShowTeacherModal(true)}>
            Create Teacher
          </button>
        </div>

        {showTeacherModal && (
          <div className="admin-content-modal-backdrop" role="presentation" onClick={() => setShowTeacherModal(false)}>
            <div className="admin-content-modal" role="dialog" aria-modal="true" aria-label="Create Teacher" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="admin-content-modal-close" onClick={() => setShowTeacherModal(false)} aria-label="Close modal">
                <X size={18} aria-hidden="true" />
              </button>
              <h3>Create New Teacher</h3>
              <p>Fill out the information fields.</p>
              <TeacherForm onSubmit={handleTeacherSubmit} apiBaseUrl="/api" />
              <div className="admin-content-modal-actions">
                <button type="button" onClick={() => setShowTeacherModal(false)} className="admin-content-modal-cancel">
                  Cancel
                </button>
                <button type="submit" form="admin-teacher-form" className="admin-content-modal-confirm">
                  Create Teacher
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="admin-students-wrapper-section">
        <StudentsTable students={students} />

        <button onClick={() => navigate("/create-student")}>+ Create Student</button>
      </section>

      <section className="admin-manage-wrapper-section">
        <ManageContentSection />
      </section>
    </div>
  );
}
