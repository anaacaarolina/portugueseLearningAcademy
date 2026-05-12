import "./StudentDashboard.css";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, GraduationCap, MapPin, UserRound, UsersRound } from "lucide-react";
import { getStoredAccessToken, getStoredAuth } from "../../../utils/auth";

const dayToWeekdayIndex = {
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

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function formatDuration(start, end) {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return "Duration not available";
  }

  return `${endMinutes - startMinutes} min`;
}

function buildDateForMonth(dayOfWeek, occurrenceIndex, year, month) {
  const targetWeekday = dayToWeekdayIndex[dayOfWeek];
  if (targetWeekday === undefined) {
    return null;
  }

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const firstMatch = 1 + ((targetWeekday - firstWeekday + 7) % 7);
  const day = firstMatch + occurrenceIndex * 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (day > daysInMonth) {
    return null;
  }

  const monthNumber = String(month + 1).padStart(2, "0");
  const dayNumber = String(day).padStart(2, "0");
  return `${year}-${monthNumber}-${dayNumber}`;
}

function buildGroupCourseScheduleEntries(course, year, month, teacherNameById) {
  if (!course || String(course?.type || "").toLowerCase() !== "group") {
    return [];
  }

  const courseStart = parseIsoDate(course?.start_date);
  const courseEnd = parseIsoDate(course?.end_date);
  if (!courseStart || !courseEnd || courseEnd < courseStart) {
    return [];
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const windowStart = monthStart > courseStart ? monthStart : courseStart;
  const windowEnd = monthEnd < courseEnd ? monthEnd : courseEnd;

  if (windowEnd < windowStart) {
    return [];
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
  const entries = [];

  weeklySchedule.forEach((scheduleItem, scheduleIndex) => {
    const targetWeekday = dayToWeekdayIndex[scheduleItem?.day_of_week];
    if (targetWeekday === undefined) {
      return;
    }

    const effectiveFrom = parseIsoDate(scheduleItem?.effective_from) || courseStart;
    const effectiveTo = parseIsoDate(scheduleItem?.effective_to) || courseEnd;
    const scheduleStart = effectiveFrom > windowStart ? effectiveFrom : windowStart;
    const scheduleEnd = effectiveTo < windowEnd ? effectiveTo : windowEnd;

    if (scheduleEnd < scheduleStart) {
      return;
    }

    const firstOccurrence = new Date(scheduleStart);
    const delta = (targetWeekday - firstOccurrence.getDay() + 7) % 7;
    firstOccurrence.setDate(firstOccurrence.getDate() + delta);

    for (let current = new Date(firstOccurrence); current <= scheduleEnd; current.setDate(current.getDate() + 7)) {
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
            id: `course-exception-${course.id}-${isoDate}-${scheduleIndex}-${itemIndex}`,
            title: course?.title || "Group class",
            level: course?.level ? String(course.level) : "",
            format: "Group",
            date: isoDate,
            time: normalizeTimeLabel(item.start_time),
            duration: formatDuration(item.start_time, item.end_time),
            instructor: teacherNameById[course?.teacher_id] || "Teacher to be announced",
            place: course?.location || "TBD",
            status: "scheduled",
          });
        });
        continue;
      }

      entries.push({
        id: `course-${course.id}-${isoDate}-${scheduleIndex}`,
        title: course?.title || "Group class",
        level: course?.level ? String(course.level) : "",
        format: "Group",
        date: isoDate,
        time: normalizeTimeLabel(scheduleItem?.start_time),
        duration: formatDuration(scheduleItem?.start_time, scheduleItem?.end_time),
        instructor: teacherNameById[course?.teacher_id] || "Teacher to be announced",
        place: course?.location || "TBD",
        status: "scheduled",
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
    if (!exceptionDate || exceptionDate < windowStart || exceptionDate > windowEnd) {
      return;
    }

    const isoDate = buildIsoDateFromDate(exceptionDate);
    entries.push({
      id: `course-extra-exception-${course.id}-${isoDate}-${index}`,
      title: course?.title || "Group class",
      level: course?.level ? String(course.level) : "",
      format: "Group",
      date: isoDate,
      time: normalizeTimeLabel(item.start_time),
      duration: formatDuration(item.start_time, item.end_time),
      instructor: teacherNameById[course?.teacher_id] || "Teacher to be announced",
      place: course?.location || "TBD",
      status: "scheduled",
    });
  });

  return entries;
}

function ClassCard({ item }) {
  const levelText = item.level || "All levels";
  return (
    <article className="student-class-card">
      <div className="student-class-card-top">
        <div className="student-class-pills">
          <span className="student-class-level-pill">{levelText}</span>
          <span className="student-class-format-pill">
            <UsersRound size={14} aria-hidden="true" />
            {item.format}
          </span>
        </div>
        <span className="student-class-date">{formatReadableDate(item.date)}</span>
      </div>
      <h3>{item.title}</h3>
      <div className="student-class-meta-grid">
        <p>
          <Clock3 size={16} aria-hidden="true" />
          {item.time}
        </p>
        <p>
          <CalendarDays size={16} aria-hidden="true" />
          {item.duration}
        </p>
        <p>
          <UserRound size={16} aria-hidden="true" />
          {item.instructor}
        </p>
        <p>
          <MapPin size={16} aria-hidden="true" />
          {item.place}
        </p>
      </div>
    </article>
  );
}

export default function StudentDashboard() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const { role } = getStoredAuth();
  const [dashboardRole, setDashboardRole] = useState(role || "student");
  const [studentName, setStudentName] = useState("Student");
  const [currentCourseLabel, setCurrentCourseLabel] = useState("No active course");
  const [activeCourse, setActiveCourse] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [hoursSummary, setHoursSummary] = useState({ used: 0, total: 0 });
  const [attendanceLabel, setAttendanceLabel] = useState("N/A");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewMode, setViewMode] = useState("calendar");
  const activeMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);
  const [selectedDay, setSelectedDay] = useState(1);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedAvailabilityDate, setSelectedAvailabilityDate] = useState("");
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [scheduleMonth, setScheduleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      const token = getStoredAccessToken();
      if (!token) {
        if (isMounted) {
          setLoadError("You need to sign in to view your dashboard.");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!meResponse.ok) {
          throw new Error("Could not identify the logged-in student.");
        }

        const meData = await meResponse.json();
        const studentId = Number(meData?.id);

        if (!Number.isFinite(studentId)) {
          throw new Error("Invalid student profile data.");
        }

        const [studentResponse, teachersResponse, coursesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/students/${studentId}`),
          fetch(`${apiBaseUrl}/api/teachers`),
          fetch(`${apiBaseUrl}/courses`),
        ]);

        if (!studentResponse.ok) {
          throw new Error("Could not load student dashboard data.");
        }

        const studentData = await studentResponse.json();
        const teachersData = teachersResponse.ok ? await teachersResponse.json() : [];
        const teachers = Array.isArray(teachersData) ? teachersData : [];
        const coursesData = coursesResponse.ok ? await coursesResponse.json() : [];
        const courses = Array.isArray(coursesData) ? coursesData : [];

        const teacherNameById = teachers.reduce((acc, teacher) => {
          if (teacher?.id != null && teacher?.name) {
            acc[teacher.id] = teacher.name;
          }
          return acc;
        }, {});

        const bookings = Array.isArray(studentData?.bookings) ? studentData.bookings : [];
        const activeCourseId = Number(studentData?.activeCourseId);
        const resolvedCourse = Number.isFinite(activeCourseId)
          ? courses.find((course) => Number(course?.id) === activeCourseId)
          : null;
        const weekdayOccurrences = {};
        const mappedSchedule = bookings
          .map((booking, index) => {
            const backendDate = typeof booking?.date === "string" ? booking.date : "";
            let date = backendDate;

            if (!date) {
              const weekday = booking?.day;
              weekdayOccurrences[weekday] = (weekdayOccurrences[weekday] || 0) + 1;
              date = buildDateForMonth(weekday, weekdayOccurrences[weekday] - 1, year, month);
            }

            if (!date) {
              return null;
            }

            const startTime = booking?.start || "";
            const endTime = booking?.end || "";

            return {
              id: booking?.id ?? index + 1,
              title: studentData?.course || "Portuguese Class",
              level: "",
              format: studentData?.activeCourseId ? "Enrolled" : "Pending",
              date,
              time: startTime,
              duration: formatDuration(startTime, endTime),
              instructor: teacherNameById[booking?.teacherId] || "Teacher to be announced",
              place: "TBD",
              status: booking?.status || "scheduled",
            };
          })
          .filter(Boolean);

        const groupScheduleEntries = buildGroupCourseScheduleEntries(resolvedCourse, year, month, teacherNameById);
        const mergedSchedule = [...mappedSchedule, ...groupScheduleEntries]
          .filter(Boolean)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const completedBookings = bookings.filter((booking) => booking?.status === "completed").length;
        const attendance = bookings.length > 0 ? `${Math.round((completedBookings / bookings.length) * 100)}%` : "N/A";

        if (!isMounted) {
          return;
        }

        setDashboardRole(meData?.user_role || role || "student");
        setStudentName(studentData?.name || "Student");
        setCurrentCourseLabel(studentData?.course || "No active course");
        setActiveCourse(resolvedCourse || null);
        setStudentId(studentId);
        setScheduleData(mergedSchedule);
        setHoursSummary({
          used: Number(studentData?.hoursSummary?.used) || 0,
          total: Number(studentData?.hoursSummary?.total) || 0,
        });
        setAttendanceLabel(attendance);
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Could not load dashboard data.");
          setScheduleData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, month, refreshKey, role, year]);

  useEffect(() => {
    if (scheduleData.length === 0) {
      setSelectedDay(1);
      return;
    }

    const firstDay = new Date(`${scheduleData[0].date}T00:00:00`).getDate();
    setSelectedDay(firstDay);
  }, [scheduleData]);

  const isUnrolledStudent = dashboardRole === "unrolled_student";
  const canScheduleClass =
    activeCourse &&
    String(activeCourse?.type || "").toLowerCase() === "individual" &&
    Number.isFinite(Number(activeCourse?.teacher_id));

  const monthGrid = getMonthGrid(year, month);
  const monthLabel = activeMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const classesByDay = {};
  scheduleData.forEach((item) => {
    const day = new Date(`${item.date}T00:00:00`).getDate();
    if (!classesByDay[day]) {
      classesByDay[day] = [];
    }
    classesByDay[day].push(item);
  });

  const selectedDayClasses = classesByDay[selectedDay] || [];

  const nextClass = scheduleData.find((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() >= today.getTime();
  }) || scheduleData[0];

  const availabilityByDate = useMemo(() => {
    return availabilitySlots.reduce((acc, slot) => {
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
  }, [availabilitySlots]);

  const scheduleMonthLabel = scheduleMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const scheduleMonthGrid = getMonthGrid(scheduleMonth.getFullYear(), scheduleMonth.getMonth());
  const selectedDateSlots = selectedAvailabilityDate ? availabilityByDate[selectedAvailabilityDate] || [] : [];
  const selectedSlot = availabilitySlots.find((slot) => slot.key === selectedSlotKey);

  const loadAvailabilitySlots = async () => {
    const teacherId = activeCourse?.teacher_id;
    if (!canScheduleClass || !teacherId) {
      setAvailabilitySlots([]);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/teachers/${teacherId}/available-slots`);
      if (!response.ok) {
        throw new Error("Could not load available slots.");
      }

      const data = await response.json();
      const expanded = expandAvailabilitySlots(data);
      setAvailabilitySlots(expanded);
    } catch (error) {
      setAvailabilitySlots([]);
      setAvailabilityError(error instanceof Error ? error.message : "Could not load available slots.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openScheduleModal = () => {
    setIsScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedAvailabilityDate("");
    setSelectedSlotKey("");
    setAvailabilityError("");
  };

  const handleScheduleMonthNav = (direction) => {
    const next = new Date(scheduleMonth);
    next.setMonth(next.getMonth() + direction);
    setScheduleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setSelectedAvailabilityDate("");
    setSelectedSlotKey("");
  };

  const handleBookingConfirm = async () => {
    if (!studentId || !activeCourse?.teacher_id || !selectedSlot) {
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          teacherId: activeCourse.teacher_id,
          slots: [
            {
              id: selectedSlot.availabilityId,
              start: selectedSlot.start,
              end: selectedSlot.end,
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Could not schedule class.");
      }

      if (selectedSlot?.date) {
        const parsed = new Date(`${selectedSlot.date}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) {
          setSelectedDay(parsed.getDate());
        }
      }

      closeScheduleModal();
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : "Could not schedule class.");
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (isScheduleModalOpen) {
      loadAvailabilitySlots();
    }
  }, [activeCourse, apiBaseUrl, canScheduleClass, isScheduleModalOpen]);

  return (
    <div className="student-dashboard-page">
      <section className="student-dashboard-hero">
        <h1>Welcome back, {studentName}</h1>
        {isUnrolledStudent ? <p>You are not enrolled in any course yet.</p> : null}
        {loadError ? <p>{loadError}</p> : null}
      </section>

      <section className="student-dashboard-content">
        <div className="student-dashboard-main-card">
          <div className="student-dashboard-main-card-header">
            <div>
              <h2>Classes & Calendar</h2>
              <p>{isUnrolledStudent ? "You will see your schedule here after enrolling in a course." : "Track your classes in your current course."}</p>
            </div>
            <div className="student-dashboard-actions">
              {canScheduleClass ? (
                <button type="button" className="student-schedule-button" onClick={openScheduleModal}>
                  Schedule Class
                </button>
              ) : null}
              <div className="student-view-toggle" role="group" aria-label="Toggle schedule view">
                <button type="button" className={`student-view-toggle-button ${viewMode === "calendar" ? "is-active" : ""}`} onClick={() => setViewMode("calendar")}>
                  Calendar View
                </button>
                <button type="button" className={`student-view-toggle-button ${viewMode === "list" ? "is-active" : ""}`} onClick={() => setViewMode("list")}>
                  List View
                </button>
              </div>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <div className="student-calendar-view">
              <div className="student-calendar">
                <div className="student-calendar-header">
                  <h3>{monthLabel}</h3>
                </div>
                <div className="student-calendar-weekdays">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="student-calendar-grid">
                  {monthGrid.map((day, index) => {
                    const hasEvents = Boolean(day && classesByDay[day]);
                    const isSelected = day === selectedDay;

                    return (
                      <button type="button" className={`student-calendar-day ${day ? "" : "is-empty"} ${hasEvents ? "has-events" : ""} ${isSelected ? "is-selected" : ""}`} key={`${day || "empty"}-${index}`} disabled={!day} onClick={() => setSelectedDay(day)}>
                        {day}
                        {hasEvents ? <span className="student-calendar-day-dot" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="student-selected-day-list">
                <h3>
                  Classes on {selectedDay} {activeMonth.toLocaleDateString("en-GB", { month: "short" })}
                </h3>
                {isLoading ? <p className="student-no-classes-message">Loading your classes...</p> : null}
                {selectedDayClasses.length > 0 ? (
                  <div className="student-classes-list">
                    {selectedDayClasses.map((item) => (
                      <ClassCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="student-no-classes-message">{isUnrolledStudent ? "No classes available because you are not enrolled in a course." : "No classes or events scheduled for this day."}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="student-classes-list">
              {scheduleData.map((item) => (
                <ClassCard key={item.id} item={item} />
              ))}
              {scheduleData.length === 0 ? <p className="student-no-classes-message">No classes available because you are not enrolled in a course.</p> : null}
            </div>
          )}
        </div>

        <aside className="student-stats-card">
          <h2>Your stats</h2>
          <ul>
            <li>
              <span>Current course</span>
              <strong>
                <GraduationCap size={16} aria-hidden="true" />
                {currentCourseLabel}
              </strong>
            </li>
            <li>
              <span>Hours completed</span>
              <strong>{`${hoursSummary.used}h / ${hoursSummary.total}h`}</strong>
            </li>
            <li>
              <span>Attendance</span>
              <strong>{attendanceLabel}</strong>
            </li>
            <li>
              <span>Next class</span>
              <strong>{nextClass ? `${formatReadableDate(nextClass.date)} at ${nextClass.time}` : "No upcoming class"}</strong>
            </li>
          </ul>
        </aside>
      </section>

      {isScheduleModalOpen ? (
        <div className="student-modal-backdrop" role="presentation" onClick={closeScheduleModal}>
          <div className="student-modal" role="dialog" aria-modal="true" aria-label="Schedule class" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="student-modal-close" onClick={closeScheduleModal} aria-label="Close modal">
              <span aria-hidden="true">X</span>
            </button>
            <h3>Schedule a class</h3>
            <p>Select a date and time that your teacher is available.</p>

            {availabilityError ? <p className="student-modal-error">{availabilityError}</p> : null}

            <div className="student-schedule-layout">
              <div className="student-schedule-calendar">
                <div className="student-schedule-calendar-header">
                  <button type="button" onClick={() => handleScheduleMonthNav(-1)} aria-label="Previous month">
                    &lt;
                  </button>
                  <strong>{scheduleMonthLabel}</strong>
                  <button type="button" onClick={() => handleScheduleMonthNav(1)} aria-label="Next month">
                    &gt;
                  </button>
                </div>
                <div className="student-calendar-weekdays">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>
                <div className="student-calendar-grid">
                  {scheduleMonthGrid.map((day, index) => {
                    const isoDate = day ? buildIsoDateFromDate(new Date(scheduleMonth.getFullYear(), scheduleMonth.getMonth(), day)) : "";
                    const hasSlots = Boolean(day && availabilityByDate[isoDate]);
                    const isSelected = isoDate && isoDate === selectedAvailabilityDate;

                    return (
                      <button
                        type="button"
                        className={`student-calendar-day ${day ? "" : "is-empty"} ${hasSlots ? "has-events" : ""} ${isSelected ? "is-selected" : ""}`}
                        key={`${day || "empty"}-${index}`}
                        disabled={!day || !hasSlots}
                        onClick={() => {
                          if (!isoDate) {
                            return;
                          }
                          setSelectedAvailabilityDate(isoDate);
                          setSelectedSlotKey("");
                        }}
                      >
                        {day}
                        {hasSlots ? <span className="student-calendar-day-dot" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="student-schedule-times">
                <h4>{selectedAvailabilityDate ? `Times on ${formatReadableDate(selectedAvailabilityDate)}` : "Select a day"}</h4>
                {availabilityLoading ? <p className="student-modal-note">Loading available times...</p> : null}
                {!availabilityLoading && selectedAvailabilityDate && selectedDateSlots.length === 0 ? (
                  <p className="student-modal-note">No available times on this day.</p>
                ) : null}
                <div className="student-time-slot-grid">
                  {selectedDateSlots
                    .slice()
                    .sort((a, b) => String(a?.start || "").localeCompare(String(b?.start || "")))
                    .map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        className={`student-time-slot ${selectedSlotKey === slot.key ? "is-selected" : ""}`}
                        onClick={() => setSelectedSlotKey(slot.key)}
                      >
                        {normalizeTimeLabel(slot.start)} - {normalizeTimeLabel(slot.end)}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="student-modal-actions">
              <button type="button" className="student-modal-cancel" onClick={closeScheduleModal} disabled={isBooking}>
                Cancel
              </button>
              <button type="button" className="student-modal-confirm" onClick={handleBookingConfirm} disabled={isBooking || !selectedSlot}>
                {isBooking ? "Scheduling..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
