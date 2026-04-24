import "./AdminDashboard.css";
import { BookOpen, Euro, Target, Users, X } from "lucide-react";
import KpiCard from "../../../components/Admin/KpiCard/KpiCard";
import ManageContentSection from "../../../components/Admin/ManageContentSection/ManageContentSection";
import StudentsTable from "../../../components/Admin/StudentsTable/StudentsTable";
import StudentForm from "../../../components/Admin/StudentsTable/StudentForm/StudentForm";
import TeacherForm from "../../../components/Admin/TeachersTables/TeacherForm/TeacherForm";
import TeachersTable from "../../../components/Admin/TeachersTables/TeachersTable/TeachersTable";
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
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const loadStudents = async () => {
    try {
      const response = await fetch("/api/students");
      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to fetch teachers");
      }

      const data = await response.json();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("Are you sure you want to delete this tutor?")) return;

    await fetch(`/api/teachers/${teacherId}`, {
      method: "DELETE",
    });

    await loadTeachers();
  };

  const handleSaveTeacherAvailability = async (teacherId, availabilitySlots) => {
    if (!teacherId) {
      return;
    }

    const response = await fetch(`/api/teachers/${teacherId}/availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(availabilitySlots),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("SERVER ERROR:", text);
      throw new Error("Failed to save availability");
    }

    alert("Availability saved!");
  };

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
      await loadTeachers();
    } catch (err) {
      console.error(err);
      alert("Error creating teacher: " + err.message);
    }
  };

  const handleStudentSubmit = async (payload) => {
    try {
      const { courseId, ...studentPayload } = payload;

      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to create student");
      }

      const created = await response.json();

      if (courseId && created?.id) {
        const assignResponse = await fetch(`/api/students/${created.id}/course`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId }),
        });

        if (!assignResponse.ok) {
          const text = await assignResponse.text();
          console.error("SERVER ERROR:", text);
          throw new Error("Student created but course assignment failed");
        }
      }

      await loadStudents();
      setShowStudentModal(false);
      alert(`Student created successfully. Temporary password: ${created?.temporary_password || "PLA2026"}`);
    } catch (error) {
      console.error(error);
      alert("Error creating student: " + error.message);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadTeachers();
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
        <TeachersTable teachers={teachers} onDeleteTeacher={handleDelete} onSaveAvailability={handleSaveTeacherAvailability} />

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

        <div className="admin-manage-content-actions">
          <button type="button" onClick={() => setShowStudentModal(true)}>
            Create Student
          </button>
        </div>

        {showStudentModal && (
          <div className="admin-content-modal-backdrop" role="presentation" onClick={() => setShowStudentModal(false)}>
            <div className="admin-content-modal" role="dialog" aria-modal="true" aria-label="Create Student" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="admin-content-modal-close" onClick={() => setShowStudentModal(false)} aria-label="Close modal">
                <X size={18} aria-hidden="true" />
              </button>
              <h3>Create New Student</h3>
              <p>Fill out the information fields.</p>
              <StudentForm onSubmit={handleStudentSubmit} />
              <div className="admin-content-modal-actions">
                <button type="button" onClick={() => setShowStudentModal(false)} className="admin-content-modal-cancel">
                  Cancel
                </button>
                <button type="submit" form="admin-student-form" className="admin-content-modal-confirm">
                  Create Student
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="admin-manage-wrapper-section">
        <ManageContentSection />
      </section>
    </div>
  );
}
