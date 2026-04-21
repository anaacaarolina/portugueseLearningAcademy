import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import "./StudentDetails.css";
import { ArrowLeft, GraduationCap, Mail, Phone, UserRound } from "lucide-react";

export default function StudentDetails() {
  const { id } = useParams(); // dynamic route

  const [student, setStudent] = useState(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isEnrollmentEditing, setIsEnrollmentEditing] = useState(false);

  const [profileDraft, setProfileDraft] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [hourPackages, setHourPackages] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [hoursToAdd, setHoursToAdd] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [teacherSlots, setTeacherSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [bookingStatusDraft, setBookingStatusDraft] = useState({});

  function getInitials(name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getStatusClass(status) {
    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();
    if (normalizedStatus === "active") {
      return "status-active";
    }
    if (normalizedStatus === "inactive" || normalizedStatus === "innactive") {
      return "status-inactive";
    }
    return "";
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(Number(value));
  }

  function formatDateTime(value) {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }

  const loadStudent = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`/api/students/${id}`);
      const text = await response.text();

      if (!response.ok) {
        throw new Error(text || "Failed to load student details");
      }

      if (!text) {
        throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);

      setStudent(data);
      setNotes(data.notes || "");
      setProfileDraft({
        name: data.name || data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
      });
      setSelectedPackageId(data.hourPackage?.id ? String(data.hourPackage.id) : "");
      setSelectedCourseId(data.activeCourseId ? String(data.activeCourseId) : "");
      setBookingStatusDraft(
        (data.bookings || []).reduce((acc, booking) => {
          acc[booking.id] = booking.status;
          return acc;
        }, {}),
      );
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load student details");
    }
  }, [id]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  useEffect(() => {
    const loadManagementData = async () => {
      try {
        const [packagesResponse, coursesResponse] = await Promise.all([fetch(`/api/hour-packages`), fetch(`/api/courses`)]);

        if (!packagesResponse.ok) {
          throw new Error("Unable to load hour packages");
        }

        if (!coursesResponse.ok) {
          throw new Error("Unable to load courses");
        }

        const packagesData = await packagesResponse.json();
        const coursesData = await coursesResponse.json();
        setHourPackages(Array.isArray(packagesData) ? packagesData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        console.error(err);
      }
    };

    loadManagementData();
  }, []);

  useEffect(() => {
    const loadTeachersByCourse = async () => {
      const selectedCourseTitle = courses.find((course) => Number(course.id) === Number(selectedCourseId))?.title || student?.course;
      if (!selectedCourseTitle) {
        setTeachers([]);
        setSelectedTeacherId("");
        return;
      }

      try {
        const response = await fetch(`/api/teachers/by_course/${encodeURIComponent(selectedCourseTitle)}`);
        if (!response.ok) {
          throw new Error("Unable to load teachers for this course");
        }

        const data = await response.json();
        setTeachers(Array.isArray(data) ? data : []);
        setSelectedTeacherId("");
      } catch (err) {
        console.error(err);
        setTeachers([]);
        setSelectedTeacherId("");
      }
    };

    loadTeachersByCourse();
  }, [courses, selectedCourseId, student?.course]);

  useEffect(() => {
    const loadTeacherSlots = async () => {
      if (!selectedTeacherId) {
        setTeacherSlots([]);
        setSelectedSlotId("");
        return;
      }

      try {
        const response = await fetch(`/api/teachers/${selectedTeacherId}/available-slots`);
        if (!response.ok) {
          throw new Error("Unable to load available slots");
        }

        const data = await response.json();
        setTeacherSlots(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setTeacherSlots([]);
      }
    };

    loadTeacherSlots();
  }, [selectedTeacherId]);

  const handleClearNotes = () => {
    setNotes("");
  };

  const profileChanged = isProfileEditing && !!student && (profileDraft.name.trim() !== (student.name || "") || profileDraft.email.trim() !== (student.email || "") || profileDraft.phone.trim() !== (student.phone || ""));

  const notesChanged = !!student && notes !== (student.notes || "");
  const packageChanged = !!student && selectedPackageId && Number(selectedPackageId) !== student?.hourPackage?.id;
  const courseChanged = isEnrollmentEditing && !!student && selectedCourseId && Number(selectedCourseId) !== Number(student?.activeCourseId || 0);
  const addHoursRequested = isEnrollmentEditing && Number(hoursToAdd) > 0;
  const scheduleRequested = Boolean(selectedTeacherId && selectedSlotId);
  const hasPendingChanges = profileChanged || notesChanged || packageChanged || courseChanged || addHoursRequested || scheduleRequested;

  const handleApplyChanges = async () => {
    const actions = [];
    if (profileChanged) actions.push("profile");
    if (notesChanged) actions.push("notes");
    if (packageChanged) actions.push("hour package");
    if (courseChanged) actions.push("course assignment");
    if (addHoursRequested) actions.push("hours");
    if (scheduleRequested) actions.push("class scheduling");

    if (!actions.length) {
      setNotice("No pending changes to apply.");
      return;
    }

    const confirmed = window.confirm(`Confirm applying changes for: ${actions.join(", ")}?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setNotice("");

    try {
      if (profileChanged) {
        const response = await fetch(`/api/students/${id}/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profileDraft.name.trim(),
            email: profileDraft.email.trim(),
            phone: profileDraft.phone.trim(),
          }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      if (notesChanged) {
        const response = await fetch(`/api/students/${id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      if (packageChanged) {
        const response = await fetch(`/api/students/${id}/hour-package`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: Number(selectedPackageId) }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      if (courseChanged) {
        const response = await fetch(`/api/students/${id}/course`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId: Number(selectedCourseId) }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      if (addHoursRequested) {
        const response = await fetch(`/api/students/${id}/hours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours: Number(hoursToAdd) }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      if (scheduleRequested) {
        const response = await fetch(`/api/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: Number(id),
            teacherId: Number(selectedTeacherId),
            slots: [{ id: Number(selectedSlotId) }],
          }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
      }

      setHoursToAdd("");
      setSelectedSlotId("");
      await loadStudent();
      if (profileChanged) {
        setIsProfileEditing(false);
      }
      setNotice("Changes applied successfully.");
    } catch (err) {
      console.error(err);
      setNotice(err.message || "Unable to apply changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAttendance = async (bookingId) => {
    const nextStatus = bookingStatusDraft[bookingId];
    if (!nextStatus) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${id}/bookings/${bookingId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setStudent((prev) => ({
        ...prev,
        bookings: (prev?.bookings || []).map((booking) => (booking.id === bookingId ? { ...booking, status: nextStatus } : booking)),
      }));
      setNotice("Attendance updated.");
    } catch (err) {
      console.error(err);
      setNotice(err.message || "Unable to update attendance.");
    }
  };

  if (error) return <p>{error}</p>;
  if (!student) return <p>Loading...</p>;

  return (
    <div className="student-details-page">
      <div className="student-details-back-link-section">
        <Link to={"/admin-dashboard"} className="student-details-back-link">
          <ArrowLeft /> Return to Dashboard
        </Link>
      </div>
      <div className="student-details-card">
        <div className="student-details-header">
          <div className="student-details-name-group">
            <span className="student-details-avatar">{getInitials(student.name)}</span>
            <h1>{student.name ?? student.full_name}</h1>
            <span className={`student-details-status-pill ${getStatusClass(student.status)}`.trim()}>{student.status}</span>
          </div>
          <button
            type="button"
            className="student-details-edit-profile-button"
            onClick={() => {
              if (isProfileEditing) {
                setProfileDraft({
                  name: student.name || student.full_name || "",
                  email: student.email || "",
                  phone: student.phone || "",
                });
              }
              setIsProfileEditing((prev) => !prev);
            }}
          >
            {isProfileEditing ? "Cancel profile edit" : "Edit profile"}
          </button>
        </div>
        <div className="student-details-info-grid">
          <label className="student-details-info-item student-details-edit-item">
            <Mail />
            {isProfileEditing ? <input type="email" value={profileDraft.email} onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" /> : <p className="student-details-info-value">{student.email || "No email"}</p>}
          </label>
          <label className="student-details-info-item student-details-edit-item">
            <Phone />
            {isProfileEditing ? <input type="text" value={profileDraft.phone} onChange={(event) => setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" /> : <p className="student-details-info-value">{student.phone || "No phone"}</p>}
          </label>
          <label className="student-details-info-item student-details-edit-item">
            <UserRound />
            {isProfileEditing ? <input type="text" value={profileDraft.name} onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" /> : <p className="student-details-info-value">{student.name || student.full_name || "No name"}</p>}
          </label>
          <span className="student-details-info-item">
            <GraduationCap />
            {student.course || "No active course"}
          </span>
        </div>

        <div className="student-details-hours-summary">
          <h2>Hours summary</h2>
          <div className="student-details-hours-grid">
            <div>
              <strong>{student.hoursSummary?.total ?? 0}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{student.hoursSummary?.used ?? 0}</strong>
              <span>Used</span>
            </div>
            <div>
              <strong>{student.hoursSummary?.remaining ?? 0}</strong>
              <span>Remaining</span>
            </div>
          </div>
        </div>

        <div className="student-details-package-section">
          <div className="student-details-section-header">
            <h2>Purchased package</h2>
            <button
              type="button"
              className="student-details-edit-profile-button"
              onClick={() => {
                if (isEnrollmentEditing) {
                  setSelectedCourseId(student.activeCourseId ? String(student.activeCourseId) : "");
                  setHoursToAdd("");
                }
                setIsEnrollmentEditing((prev) => !prev);
              }}
            >
              {isEnrollmentEditing ? "Cancel enrollment edit" : "Edit enrollment"}
            </button>
          </div>
          {student.hourPackage ? (
            <div className="student-details-package-card">
              <div className="student-details-package-main">
                <strong>{student.hourPackage.name}</strong>
                <span>
                  {student.hourPackage.hours} hours {student.hourPackage.isPopular ? "- Popular package" : ""}
                </span>
              </div>
              <div className="student-details-package-meta">
                <span>{formatCurrency(student.hourPackage.price)}</span>
                {student.hourPackage.paidAt ? <span>Paid {formatDateTime(student.hourPackage.paidAt)}</span> : null}
              </div>
            </div>
          ) : (
            <p className="student-details-package-empty">No hour package purchased yet.</p>
          )}

          <div className="student-details-management-grid">
            <label>
              Assign to course
              <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} disabled={!isEnrollmentEditing}>
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Change hour package
              <select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)}>
                <option value="">Select package</option>
                {hourPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.hours}h)
                  </option>
                ))}
              </select>
            </label>

            <label>
              Add hours
              <input type="number" min="0" step="0.5" value={hoursToAdd} onChange={(event) => setHoursToAdd(event.target.value)} placeholder="2" disabled={!isEnrollmentEditing} />
            </label>

            <label>
              Schedule class teacher
              <select value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)}>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Schedule class slot
              <select value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)}>
                <option value="">Select slot</option>
                {teacherSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.day} {slot.start}-{slot.end}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="student-classes">
        <h3>Booked classes</h3>
        {(student.bookings || []).map((b) => (
          <div key={b.id} className="booking-card">
            <div>
              <strong>{b.day}</strong>
            </div>
            <div>
              {b.start} → {b.end}
            </div>
            <div className="student-attendance-controls">
              <select value={bookingStatusDraft[b.id] || "scheduled"} onChange={(event) => setBookingStatusDraft((prev) => ({ ...prev, [b.id]: event.target.value }))}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Attended</option>
                <option value="no_show">No show</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button type="button" onClick={() => handleSaveAttendance(b.id)}>
                Save attendance
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="student-details-notes-section">
        <h2>Notes</h2>

        <textarea className="student-details-notes-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter notes about the student..." />

        <div className="student-details-notes-actions">
          <button onClick={handleClearNotes} className="student-details-clear-button">
            Clear Notes
          </button>
        </div>
      </div>

      <div className="student-management-actions">
        {notice ? <p className="student-management-notice">{notice}</p> : null}
        <button type="button" className="student-details-save-button" onClick={handleApplyChanges} disabled={!hasPendingChanges || isSubmitting}>
          {isSubmitting ? "Applying..." : "Apply changes"}
        </button>
      </div>
    </div>
  );
}
