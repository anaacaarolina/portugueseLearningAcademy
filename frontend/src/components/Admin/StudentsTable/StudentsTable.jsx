import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
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

function buildIsoDateFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startingWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < startingWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(day);
  }

  return days;
}

function formatReadableDate(dateStr) {
  if (!dateStr) {
    return "Date not available";
  }

  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeTimeLabel(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 5);
}

function parseTimeToMinutes(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutesToTimeLabel(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) {
    return "";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function expandAvailabilitySlots(slots) {
  return (Array.isArray(slots) ? slots : []).flatMap((slot) => {
    const date = String(slot?.date || "").slice(0, 10);
    const startMinutes = parseTimeToMinutes(normalizeTimeLabel(slot?.start));
    const endMinutes = parseTimeToMinutes(normalizeTimeLabel(slot?.end));

    if (!date || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return [];
    }

    const segments = [];
    for (let current = startMinutes; current + 60 <= endMinutes; current += 60) {
      const startLabel = formatMinutesToTimeLabel(current);
      const endLabel = formatMinutesToTimeLabel(current + 60);
      segments.push({
        key: `${slot.id}-${date}-${startLabel}`,
        availabilityId: slot.id,
        date,
        start: startLabel,
        end: endLabel,
      });
    }

    if (segments.length > 0) {
      return segments;
    }

    return [
      {
        key: `${slot.id}-${date}-${normalizeTimeLabel(slot?.start)}`,
        availabilityId: slot.id,
        date,
        start: normalizeTimeLabel(slot?.start),
        end: normalizeTimeLabel(slot?.end),
      },
    ];
  });
}

export default function StudentsTable({ students }) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [scheduleMonth, setScheduleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  const availabilityByDate = useMemo(() => {
    return availableSlots.reduce((acc, slot) => {
      const slotDate = String(slot?.date || "").slice(0, 10);
      if (!slotDate) {
        return acc;
      }

      if (!acc[slotDate]) {
        acc[slotDate] = [];
      }

      acc[slotDate].push(slot);
      return acc;
    }, {});
  }, [availableSlots]);

  const scheduleMonthLabel = scheduleMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const scheduleMonthGrid = getMonthGrid(scheduleMonth.getFullYear(), scheduleMonth.getMonth());
  const selectedDateSlots = selectedScheduleDate ? availabilityByDate[selectedScheduleDate] || [] : [];
  const selectedSlot = availableSlots.find((slot) => slot.key === selectedSlotKey);

  const openSchedule = async (student) => {
    setSelectedTeacher(null);
    setAvailableSlots([]);
    setSelectedSlotKey("");
    setSelectedScheduleDate("");
    setScheduleError("");
    const now = new Date();
    setScheduleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedStudent(student);

    try {
      const studentResponse = await fetch(`${apiBaseUrl}/api/students/${student.id}`);
      if (!studentResponse.ok) {
        throw new Error("Unable to load student details.");
      }

      const studentData = await studentResponse.json();
      const activeCourseId = Number(studentData?.activeCourseId);
      if (!Number.isFinite(activeCourseId)) {
        throw new Error("Student does not have an active course.");
      }

      const coursesResponse = await fetch(`${apiBaseUrl}/courses`);
      if (!coursesResponse.ok) {
        throw new Error("Unable to load course data.");
      }

      const coursesData = await coursesResponse.json();
      const courses = Array.isArray(coursesData) ? coursesData : [];
      const activeCourse = courses.find((course) => Number(course?.id) === activeCourseId);

      if (!activeCourse) {
        throw new Error("Course details not found.");
      }

      if (String(activeCourse?.type || "").toLowerCase() !== "individual") {
        throw new Error("Only individual courses can be scheduled.");
      }

      if (!activeCourse?.teacher_id) {
        throw new Error("This course does not have a teacher assigned.");
      }

      setSelectedTeacher(activeCourse.teacher_id);

      const slotsRes = await fetch(`${apiBaseUrl}/api/teachers/${activeCourse.teacher_id}/available-slots`);
      if (!slotsRes.ok) {
        throw new Error("Unable to load available slots.");
      }

      const slots = await slotsRes.json();
      const expandedSlots = expandAvailabilitySlots(slots);
      setAvailableSlots(expandedSlots);
    } catch (error) {
      console.error(error);
      setScheduleError(error instanceof Error ? error.message : "Unable to open scheduling.");
    }
  };

  const handleConfirmBooking = async () => {
    try {
      if (!selectedSlot || !selectedTeacher || !selectedStudent) {
        return;
      }

      setIsScheduling(true);
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          teacherId: selectedTeacher,
          slots: [
            {
              id: selectedSlot.availabilityId,
              start: selectedSlot.start,
              end: selectedSlot.end,
            },
          ],
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      alert("Booking successful!");
      setSelectedSlotKey("");
      setSelectedScheduleDate("");
      setSelectedStudent(null);
    } catch (err) {
      console.error(err);
      alert("Booking failed!");
    } finally {
      setIsScheduling(false);
    }
  };

  const closeScheduleModal = () => {
    setSelectedStudent(null);
    setSelectedTeacher(null);
    setAvailableSlots([]);
    setSelectedSlotKey("");
    setSelectedScheduleDate("");
    setScheduleError("");
  };

  const handleScheduleMonthNav = (direction) => {
    const next = new Date(scheduleMonth);
    next.setMonth(next.getMonth() + direction);
    setScheduleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setSelectedScheduleDate("");
    setSelectedSlotKey("");
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
              const isIndividualCourse = String(student.activeCourseType || "").toLowerCase() === "individual";

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
                    {student.course && isIndividualCourse && (
                      <button type="button" className="admin-student-schedule-button" onClick={() => openSchedule(student)}>
                        Schedule Class
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {selectedStudent && (
          <div className="admin-content-modal-backdrop" role="presentation" onClick={closeScheduleModal}>
            <div className="admin-content-modal admin-schedule-modal" role="dialog" aria-modal="true" aria-label="Schedule class" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="admin-content-modal-close" onClick={closeScheduleModal} aria-label="Close modal">
                <span aria-hidden="true">X</span>
              </button>
              <h3>Schedule Class</h3>
              <p>Select a date and time based on teacher availability.</p>

              {scheduleError ? <p className="admin-schedule-error">{scheduleError}</p> : null}

              <div className="admin-schedule-layout">
                <div className="admin-schedule-calendar">
                  <div className="admin-schedule-calendar-header">
                    <button type="button" onClick={() => handleScheduleMonthNav(-1)} aria-label="Previous month">
                      &lt;
                    </button>
                    <strong>{scheduleMonthLabel}</strong>
                    <button type="button" onClick={() => handleScheduleMonthNav(1)} aria-label="Next month">
                      &gt;
                    </button>
                  </div>
                  <div className="admin-schedule-weekdays">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                  <div className="admin-schedule-grid">
                    {scheduleMonthGrid.map((day, index) => {
                      const isoDate = day ? buildIsoDateFromDate(new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth(), day)) : "";
                      const hasSlots = Boolean(day && availabilityByDate[isoDate]);
                      const isSelected = isoDate && isoDate === selectedScheduleDate;

                      return (
                        <button
                          type="button"
                          className={`admin-schedule-day ${day ? "" : "is-empty"} ${hasSlots ? "has-events" : ""} ${isSelected ? "is-selected" : ""}`}
                          key={`${day || "empty"}-${index}`}
                          disabled={!day || !hasSlots}
                          onClick={() => {
                            if (!isoDate) {
                              return;
                            }
                            setSelectedScheduleDate(isoDate);
                            setSelectedSlotKey("");
                          }}
                        >
                          {day}
                          {hasSlots ? <span className="admin-schedule-day-dot" aria-hidden="true" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-schedule-times">
                  <h4>{selectedScheduleDate ? `Times on ${formatReadableDate(selectedScheduleDate)}` : "Select a day"}</h4>
                  {selectedScheduleDate && selectedDateSlots.length === 0 ? <p className="admin-schedule-note">No available times on this day.</p> : null}
                  <div className="admin-schedule-slot-grid">
                    {selectedDateSlots
                      .slice()
                      .sort((a, b) => String(a?.start || "").localeCompare(String(b?.start || "")))
                      .map((slot) => (
                        <button
                          key={slot.key}
                          type="button"
                          className={`admin-schedule-slot ${selectedSlotKey === slot.key ? "is-selected" : ""}`}
                          onClick={() => setSelectedSlotKey(slot.key)}
                        >
                          {normalizeTimeLabel(slot.start)} - {normalizeTimeLabel(slot.end)}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="admin-content-modal-actions">
                <button type="button" className="admin-content-modal-cancel" onClick={closeScheduleModal} disabled={isScheduling}>
                  Cancel
                </button>
                <button type="button" className="admin-content-modal-confirm" onClick={handleConfirmBooking} disabled={isScheduling || !selectedSlot}>
                  {isScheduling ? "Scheduling..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
