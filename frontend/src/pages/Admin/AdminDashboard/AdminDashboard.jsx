import "./AdminDashboard.css";
import { BookOpen, Euro, Users, X } from "lucide-react";
import KpiCard from "../../../components/Admin/KpiCard/KpiCard";
import ManageContentSection from "../../../components/Admin/ManageContentSection/ManageContentSection";
import StudentsTable from "../../../components/Admin/StudentsTable/StudentsTable";
import StudentForm from "../../../components/Admin/StudentsTable/StudentForm/StudentForm";
import TeacherForm from "../../../components/Admin/TeachersTables/TeacherForm/TeacherForm";
import TeachersTable from "../../../components/Admin/TeachersTables/TeachersTable/TeachersTable";
import { useState, useEffect, useMemo } from "react";

const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const KPI_FALLBACKS = {
  activeStudents: 0,
  totalCourses: 0,
  totalRevenue: 0,
};

const EMAIL_TEMPLATES = [
  {
    id: "general-update",
    label: "General Update",
    subject: "Important update from Portuguese Learning Academy",
    message: "Hello,\n\nWe would like to share an important update with you.\n\nBest regards,\nPortuguese Learning Academy",
  },
  {
    id: "class-reminder",
    label: "Class Reminder",
    subject: "Reminder about your upcoming class",
    message: "Hello,\n\nThis is a reminder about your upcoming class.\nPlease arrive a few minutes early.\n\nBest regards,\nPortuguese Learning Academy",
  },
  {
    id: "payment-reminder",
    label: "Payment Reminder",
    subject: "Friendly payment reminder",
    message: "Hello,\n\nThis is a friendly reminder regarding your pending payment.\nIf you have already paid, please disregard this message.\n\nBest regards,\nPortuguese Learning Academy",
  },
];

const dayOfWeekToIndex = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function buildIsoDateFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthGridDateObjects(year, month) {
  const firstDay = new Date(year, month, 1);
  const startingWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < startingWeekday; i += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatReadableDate(isoDate) {
  if (!isoDate) {
    return "Date not available";
  }

  const parsedDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDate;
  }

  return parsedDate.toLocaleDateString("en-GB", {
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

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDayTone(count) {
  if (count > 1) {
    return "multiple";
  }

  if (count === 1) {
    return "single";
  }

  return "none";
}

function getDayToneLabel(count) {
  if (count > 1) {
    return "2+ classes";
  }

  if (count === 1) {
    return "1 class";
  }

  return "No classes";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function buildGroupCourseScheduleEntries(courses) {
  const entries = [];

  (Array.isArray(courses) ? courses : []).forEach((course) => {
    if (String(course?.type || "").toLowerCase() !== "group") {
      return;
    }

    const courseStart = parseIsoDate(course?.start_date);
    const courseEnd = parseIsoDate(course?.end_date);
    if (!courseStart || !courseEnd || courseEnd < courseStart) {
      return;
    }

    const weeklySchedule = Array.isArray(course?.weekly_schedule) ? course.weekly_schedule : [];
    const scheduleExceptions = Array.isArray(course?.schedule_exceptions) ? course.schedule_exceptions : [];
    const exceptionMap = scheduleExceptions.reduce((acc, item) => {
      const key = String(item?.exception_date || "").slice(0, 10);
      if (!key) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const consumedExceptionIds = new Set();

    weeklySchedule.forEach((scheduleItem, scheduleIndex) => {
      const targetWeekday = dayOfWeekToIndex[scheduleItem?.day_of_week];
      if (targetWeekday === undefined) {
        return;
      }

      const effectiveFrom = parseIsoDate(scheduleItem?.effective_from) || courseStart;
      const effectiveTo = parseIsoDate(scheduleItem?.effective_to) || courseEnd;
      const windowStart = effectiveFrom > courseStart ? effectiveFrom : courseStart;
      const windowEnd = effectiveTo < courseEnd ? effectiveTo : courseEnd;

      if (windowEnd < windowStart) {
        return;
      }

      const firstOccurrence = new Date(windowStart);
      const delta = (targetWeekday - firstOccurrence.getDay() + 7) % 7;
      firstOccurrence.setDate(firstOccurrence.getDate() + delta);

      for (let current = new Date(firstOccurrence); current <= windowEnd; current.setDate(current.getDate() + 7)) {
        const isoDate = buildIsoDateFromDate(current);
        const exceptionsOnDate = exceptionMap[isoDate] || [];
        const cancelled = exceptionsOnDate.some((item) => item?.is_cancelled);
        const replacementExceptions = exceptionsOnDate.filter((item) => !item?.is_cancelled && item?.start_time && item?.end_time);

        if (cancelled) {
          continue;
        }

        if (replacementExceptions.length > 0) {
          replacementExceptions.forEach((item, itemIndex) => {
            if (item?.id != null) {
              consumedExceptionIds.add(item.id);
            }

            entries.push({
              bookingId: `course-exception-${course.id}-${isoDate}-${scheduleIndex}-${itemIndex}`,
              date: isoDate,
              start: normalizeTimeLabel(item.start_time),
              end: normalizeTimeLabel(item.end_time),
              teacherId: course?.teacher_id,
              teacherName: "",
              studentName: null,
              courseTitle: course?.title || "Group class",
              entryType: "course_schedule",
            });
          });
          continue;
        }

        entries.push({
          bookingId: `course-${course.id}-${isoDate}-${scheduleIndex}`,
          date: isoDate,
          start: normalizeTimeLabel(scheduleItem?.start_time),
          end: normalizeTimeLabel(scheduleItem?.end_time),
          teacherId: course?.teacher_id,
          teacherName: "",
          studentName: null,
          courseTitle: course?.title || "Group class",
          entryType: "course_schedule",
        });
      }
    });

    scheduleExceptions.forEach((item, index) => {
      if (item?.is_cancelled || !item?.start_time || !item?.end_time) {
        return;
      }

      if (item?.id != null && consumedExceptionIds.has(item.id)) {
        return;
      }

      const exceptionDate = parseIsoDate(item?.exception_date);
      if (!exceptionDate || exceptionDate < courseStart || exceptionDate > courseEnd) {
        return;
      }

      const isoDate = buildIsoDateFromDate(exceptionDate);
      entries.push({
        bookingId: `course-extra-exception-${course.id}-${isoDate}-${index}`,
        date: isoDate,
        start: normalizeTimeLabel(item.start_time),
        end: normalizeTimeLabel(item.end_time),
        teacherId: course?.teacher_id,
        teacherName: "",
        studentName: null,
        courseTitle: course?.title || "Group class",
        entryType: "course_schedule",
      });
    });
  });

  return entries;
}

function parseManualEmails(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => Boolean(item));
}

function buildUniqueEmails(emails) {
  const uniqueEmails = [];
  const seen = new Set();

  emails.forEach((email) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    uniqueEmails.push(normalized);
  });

  return uniqueEmails;
}

export default function AdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState(KPI_FALLBACKS);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [scheduledClasses, setScheduledClasses] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [platformRecipients, setPlatformRecipients] = useState([]);
  const [selectedPlatformEmails, setSelectedPlatformEmails] = useState([]);
  const [manualRecipients, setManualRecipients] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => buildIsoDateFromDate(new Date()));

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

  const loadDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard-kpis");
      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setDashboardStats({
        activeStudents: Number(data?.activeStudents || 0),
        totalCourses: Number(data?.totalCourses || 0),
        totalRevenue: Number(data?.totalRevenue || 0),
      });
    } catch (error) {
      console.error(error);
      setDashboardStats(KPI_FALLBACKS);
    }
  };

  const loadScheduledClasses = async () => {
    try {
      const [bookingsResponse, coursesResponse] = await Promise.all([
        fetch("/api/admin/scheduled-classes"),
        fetch(`${API_BASE_URL}/courses`),
      ]);

      if (!bookingsResponse.ok) {
        const text = await bookingsResponse.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to fetch scheduled class bookings");
      }

      const bookingsData = await bookingsResponse.json();
      const bookings = Array.isArray(bookingsData) ? bookingsData.filter((item) => Boolean(item?.date)) : [];

      const coursesData = coursesResponse.ok ? await coursesResponse.json() : [];
      const generatedCourseScheduleEntries = buildGroupCourseScheduleEntries(coursesData);

      const normalizedData = [...bookings, ...generatedCourseScheduleEntries];
      setScheduledClasses(normalizedData);

      if (normalizedData.length > 0) {
        const firstScheduledDate = [...normalizedData]
          .map((item) => item.date)
          .sort((a, b) => a.localeCompare(b))[0];

        if (firstScheduledDate) {
          const parsed = new Date(`${firstScheduledDate}T00:00:00`);
          if (!Number.isNaN(parsed.getTime())) {
            setCalendarAnchorDate(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
            setSelectedCalendarDate(firstScheduledDate);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setScheduledClasses([]);
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

  const handleEmailChange = (event) => {
    const { name, value } = event.target;

    setEmailForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadEmailRecipients = async () => {
    setIsRecipientsLoading(true);

    try {
      const response = await fetch("/api/admin/email-recipients");
      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to load email recipients");
      }

      const data = await response.json();
      setPlatformRecipients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPlatformRecipients([]);
    } finally {
      setIsRecipientsLoading(false);
    }
  };

  const applyEmailTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const selectedTemplate = EMAIL_TEMPLATES.find((item) => item.id === templateId);

    if (!selectedTemplate) {
      return;
    }

    setEmailForm((current) => ({
      ...current,
      subject: selectedTemplate.subject,
      message: selectedTemplate.message,
    }));
  };

  const handlePlatformRecipientToggle = (email) => {
    setSelectedPlatformEmails((current) => {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      if (!normalizedEmail) {
        return current;
      }

      if (current.includes(normalizedEmail)) {
        return current.filter((item) => item !== normalizedEmail);
      }

      return [...current, normalizedEmail];
    });
  };

  const clearEmailModalState = () => {
    setEmailForm({ to: "", subject: "", message: "" });
    setSelectedTemplateId("");
    setSelectedPlatformEmails([]);
    setManualRecipients("");
    setRecipientSearch("");
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    clearEmailModalState();
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();

    const recipients = buildUniqueEmails([...selectedPlatformEmails, ...parseManualEmails(manualRecipients)]);

    if (recipients.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject: emailForm.subject.trim(),
          message: emailForm.message.trim(),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("SERVER ERROR:", text);
        throw new Error("Failed to send email");
      }

      closeEmailModal();
      alert("Email sent successfully!");
    } catch (error) {
      console.error(error);
      alert("Error sending email: " + error.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    loadScheduledClasses();
  }, []);

  useEffect(() => {
    if (showEmailModal) {
      loadEmailRecipients();
    }
  }, [showEmailModal]);

  const classesByDate = useMemo(() => {
    return scheduledClasses.reduce((acc, item) => {
      if (!item?.date) {
        return acc;
      }

      if (!acc[item.date]) {
        acc[item.date] = [];
      }

      acc[item.date].push(item);
      return acc;
    }, {});
  }, [scheduledClasses]);

  const monthYear = {
    year: calendarAnchorDate.getFullYear(),
    month: calendarAnchorDate.getMonth(),
  };

  const monthLabel = new Date(monthYear.year, monthYear.month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const monthGrid = useMemo(() => getMonthGridDateObjects(monthYear.year, monthYear.month), [monthYear.year, monthYear.month]);

  const selectedDayClasses = selectedCalendarDate
    ? [...(classesByDate[selectedCalendarDate] || [])].sort((a, b) => `${a.start || ""}`.localeCompare(`${b.start || ""}`))
    : [];
  const selectedDayTone = getDayTone(selectedDayClasses.length);

  const filteredRecipients = useMemo(() => {
    const normalizedQuery = recipientSearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return platformRecipients;
    }

    return platformRecipients.filter((recipient) => {
      const name = String(recipient?.name || "").toLowerCase();
      const email = String(recipient?.email || "").toLowerCase();
      return name.includes(normalizedQuery) || email.includes(normalizedQuery);
    });
  }, [platformRecipients, recipientSearch]);

  const selectedManualEmails = useMemo(() => parseManualEmails(manualRecipients), [manualRecipients]);
  const allSelectedRecipients = useMemo(() => buildUniqueEmails([...selectedPlatformEmails, ...selectedManualEmails]), [selectedPlatformEmails, selectedManualEmails]);

  const handleCalendarNavigation = (direction) => {
    const nextDate = new Date(calendarAnchorDate);
    nextDate.setMonth(nextDate.getMonth() + direction);
    setCalendarAnchorDate(nextDate);
  };

  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-hero-section">
        <h1>Admin Dashboard</h1>
        <div className="admin-manage-content-actions">
          <button type="button" onClick={() => setShowEmailModal(true)}>
            Send Email
          </button>
        </div>
      </section>

      <section className="admin-kpis-section">
        <div className="admin-kpis-grid">
          <KpiCard icon={Users} value={dashboardStats.activeStudents.toString()} title="Active Students" />
          <KpiCard icon={BookOpen} value={dashboardStats.totalCourses.toString()} title="Total Courses" />
          <KpiCard icon={Euro} value={formatCurrency(dashboardStats.totalRevenue)} title="Total Revenue" />
        </div>
      </section>

      <section className="admin-classes-calendar-section">
        <div className="admin-classes-calendar-header">
          <div>
            <h2>Scheduled Classes Calendar</h2>
            <p>View booked classes by month. Days with scheduled classes are highlighted.</p>
          </div>
        </div>

        <div className="admin-classes-calendar-layout">
          <div className="admin-classes-calendar-panel">
            <div className="admin-classes-calendar-nav-row">
              <button type="button" className="admin-classes-calendar-nav" onClick={() => handleCalendarNavigation(-1)} aria-label="Previous month">
                &lt;
              </button>
              <strong>{monthLabel}</strong>
              <button type="button" className="admin-classes-calendar-nav" onClick={() => handleCalendarNavigation(1)} aria-label="Next month">
                &gt;
              </button>
            </div>

            <div className="admin-classes-calendar-weekdays">
              {CALENDAR_WEEKDAYS.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>

            <div className="admin-classes-calendar-grid">
              {monthGrid.map((date, index) => {
                if (!date) {
                  return <button type="button" key={`empty-${index}`} className="admin-classes-calendar-day is-empty" aria-hidden="true" tabIndex={-1} />;
                }

                const isoDate = buildIsoDateFromDate(date);
                const dayEntries = classesByDate[isoDate] || [];
                const tone = getDayTone(dayEntries.length);
                const isSelected = selectedCalendarDate === isoDate;

                return (
                  <button
                    type="button"
                    key={isoDate}
                    className={`admin-classes-calendar-day has-${tone} ${isSelected ? "is-selected" : ""}`}
                    onClick={() => {
                      setSelectedCalendarDate(isoDate);
                      setCalendarAnchorDate(new Date(date));
                    }}
                    aria-label={`${date.getDate()} ${date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}${dayEntries.length ? `, ${getDayToneLabel(dayEntries.length).toLowerCase()}` : " has no classes"}`}
                  >
                    <span>{date.getDate()}</span>
                    {dayEntries.length > 0 ? <i aria-hidden="true" className="admin-classes-calendar-day-dot" /> : null}
                    {dayEntries.length > 0 ? <small>{dayEntries.length}</small> : null}
                  </button>
                );
              })}
            </div>

            <div className="admin-classes-calendar-legend">
              <span>
                <i className="single" aria-hidden="true" /> 1 class
              </span>
              <span>
                <i className="multiple" aria-hidden="true" /> 2+ classes
              </span>
              <span>
                <i className="none" aria-hidden="true" /> No classes
              </span>
            </div>
          </div>

          <div className="admin-classes-selected-day-panel">
            <h3>{selectedCalendarDate ? formatReadableDate(selectedCalendarDate) : "Select a day"}</h3>
            {selectedDayClasses.length > 0 ? (
              <ul className="admin-classes-selected-day-list">
                {selectedDayClasses.map((item) => (
                  <li key={item.bookingId} className={`is-${selectedDayTone}`}>
                    <span className="admin-classes-selected-day-accent" aria-hidden="true" />
                    <strong>
                      {item.start} - {item.end}
                    </strong>
                    <p>
                      <span>Course:</span> {item.courseTitle || "Not assigned"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-classes-empty-state">No scheduled classes on this day.</p>
            )}
          </div>
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

      {showEmailModal && (
        <div className="admin-content-modal-backdrop" role="presentation" onClick={closeEmailModal}>
          <div className="admin-content-modal admin-email-modal" role="dialog" aria-modal="true" aria-label="Send Email" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-content-modal-close" onClick={closeEmailModal} aria-label="Close modal">
              <X size={18} aria-hidden="true" />
            </button>
            <h3>Send Email</h3>
            <p>Choose a template, select recipients from the platform, add custom emails, and preview before sending.</p>

            <form id="admin-email-form" onSubmit={handleEmailSubmit}>
              <div className="admin-content-form-grid two-columns">
                <div className="span-two-columns">
                  <label htmlFor="admin-email-template">Template</label>
                  <select id="admin-email-template" value={selectedTemplateId} onChange={(event) => applyEmailTemplate(event.target.value)}>
                    <option value="">Custom message</option>
                    {EMAIL_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="span-two-columns">
                  <label htmlFor="admin-email-recipient-search">Platform recipients</label>
                  <input
                    id="admin-email-recipient-search"
                    type="text"
                    value={recipientSearch}
                    onChange={(event) => setRecipientSearch(event.target.value)}
                    placeholder="Search by name or email"
                  />
                  <div className="admin-email-recipient-list" role="listbox" aria-label="Platform recipients list">
                    {isRecipientsLoading ? (
                      <p className="admin-email-inline-note">Loading recipients...</p>
                    ) : filteredRecipients.length > 0 ? (
                      filteredRecipients.map((recipient) => {
                        const email = String(recipient?.email || "").toLowerCase();
                        const isChecked = selectedPlatformEmails.includes(email);

                        return (
                          <label key={email} className="admin-email-recipient-item">
                            <input type="checkbox" checked={isChecked} onChange={() => handlePlatformRecipientToggle(email)} />
                            <span className="admin-email-recipient-checkmark" aria-hidden="true" />
                            <div className="admin-email-recipient-copy">
                              <span>{recipient?.name || email}</span>
                              <small>{email}</small>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <p className="admin-email-inline-note">No recipients match your search.</p>
                    )}
                  </div>
                </div>

                <div className="span-two-columns">
                  <label htmlFor="admin-email-manual-recipients">Other recipients</label>
                  <textarea
                    id="admin-email-manual-recipients"
                    rows="3"
                    value={manualRecipients}
                    onChange={(event) => setManualRecipients(event.target.value)}
                    placeholder="Add emails separated by comma, semicolon, or new line"
                  />
                  <p className="admin-email-inline-note">Include external emails here.</p>
                </div>

                <div className="span-two-columns">
                  <label htmlFor="admin-email-subject">Subject</label>
                  <input id="admin-email-subject" name="subject" type="text" value={emailForm.subject} onChange={handleEmailChange} required />
                </div>

                <div className="span-two-columns">
                  <label htmlFor="admin-email-message">Message</label>
                  <textarea id="admin-email-message" name="message" rows="8" value={emailForm.message} onChange={handleEmailChange} required />
                </div>

                <div className="span-two-columns admin-email-preview-panel">
                  <h4>Email preview</h4>
                  <p className="admin-email-preview-recipients">
                    Recipients ({allSelectedRecipients.length}): {allSelectedRecipients.length > 0 ? allSelectedRecipients.join(", ") : "None selected"}
                  </p>
                  <div className="admin-email-preview-card">
                    <strong>{emailForm.subject || "No subject"}</strong>
                    <p>{emailForm.message || "No message"}</p>
                  </div>
                </div>
              </div>

              <div className="admin-content-modal-actions">
                <button type="button" onClick={closeEmailModal} className="admin-content-modal-cancel" disabled={isSendingEmail}>
                  Cancel
                </button>
                <button type="submit" className="admin-content-modal-confirm" disabled={isSendingEmail || allSelectedRecipients.length === 0}>
                  {isSendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
