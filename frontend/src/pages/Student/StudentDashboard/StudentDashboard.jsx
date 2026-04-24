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
  const [scheduleData, setScheduleData] = useState([]);
  const [hoursSummary, setHoursSummary] = useState({ used: 0, total: 0 });
  const [attendanceLabel, setAttendanceLabel] = useState("N/A");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [viewMode, setViewMode] = useState("calendar");
  const activeMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);
  const [selectedDay, setSelectedDay] = useState(1);

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

        const [studentResponse, teachersResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/students/${studentId}`),
          fetch(`${apiBaseUrl}/api/teachers`),
        ]);

        if (!studentResponse.ok) {
          throw new Error("Could not load student dashboard data.");
        }

        const studentData = await studentResponse.json();
        const teachersData = teachersResponse.ok ? await teachersResponse.json() : [];
        const teachers = Array.isArray(teachersData) ? teachersData : [];

        const teacherNameById = teachers.reduce((acc, teacher) => {
          if (teacher?.id != null && teacher?.name) {
            acc[teacher.id] = teacher.name;
          }
          return acc;
        }, {});

        const bookings = Array.isArray(studentData?.bookings) ? studentData.bookings : [];
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
        setScheduleData(mappedSchedule);
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
  }, [apiBaseUrl, month, role, year]);

  useEffect(() => {
    if (scheduleData.length === 0) {
      setSelectedDay(1);
      return;
    }

    const firstDay = new Date(`${scheduleData[0].date}T00:00:00`).getDate();
    setSelectedDay(firstDay);
  }, [scheduleData]);

  const isUnrolledStudent = dashboardRole === "unrolled_student";

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

            <div className="student-view-toggle" role="group" aria-label="Toggle schedule view">
              <button type="button" className={`student-view-toggle-button ${viewMode === "calendar" ? "is-active" : ""}`} onClick={() => setViewMode("calendar")}>
                Calendar View
              </button>
              <button type="button" className={`student-view-toggle-button ${viewMode === "list" ? "is-active" : ""}`} onClick={() => setViewMode("list")}>
                List View
              </button>
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
    </div>
  );
}
