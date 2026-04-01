import "./StudentDashboard.css";
import { useState } from "react";
import { CalendarDays, Clock3, GraduationCap, MapPin, UserRound, UsersRound } from "lucide-react";

const studentName = "Ana";

const scheduleItems = [
  {
    id: 1,
    title: "Beginner",
    level: "A1-A2",
    format: "Group",
    date: "2026-04-02",
    time: "18:00",
    duration: "90 min",
    instructor: "Prof. Marta Silva",
    place: "Gaia",
  },
  {
    id: 2,
    title: "Beginner",
    level: "A1-A2",
    format: "Group",
    date: "2026-04-09",
    time: "18:00",
    duration: "90 min",
    instructor: "Prof. Marta Silva",
    place: "Gaia",
  },
  {
    id: 3,
    title: "Beginner",
    level: "A1-A2",
    format: "Group",
    date: "2026-04-16",
    time: "18:00",
    duration: "90 min",
    instructor: "Prof. Marta Silva",
    place: "Gaia",
  },
  {
    id: 4,
    title: "Beginner",
    level: "A1-A2",
    format: "Group",
    date: "2026-04-23",
    time: "18:00",
    duration: "90 min",
    instructor: "Prof. Marta Silva",
    place: "Gaia",
  },
];

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
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ClassCard({ item }) {
  return (
    <article className="student-class-card">
      <div className="student-class-card-top">
        <div className="student-class-pills">
          <span className="student-class-level-pill">{item.level}</span>
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
  const [viewMode, setViewMode] = useState("calendar");
  const activeMonth = new Date(2026, 3, 1);
  const [selectedDay, setSelectedDay] = useState(new Date(`${scheduleItems[0].date}T00:00:00`).getDate());

  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();

  const monthGrid = getMonthGrid(year, month);
  const monthLabel = activeMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const classesByDay = {};
  scheduleItems.forEach((item) => {
    const day = new Date(`${item.date}T00:00:00`).getDate();
    if (!classesByDay[day]) {
      classesByDay[day] = [];
    }
    classesByDay[day].push(item);
  });

  const selectedDayClasses = classesByDay[selectedDay] || [];

  const currentCourse = scheduleItems[0];
  const nextClass = scheduleItems[0];

  return (
    <div className="student-dashboard-page">
      <section className="student-dashboard-hero">
        <h1>Welcome back, {studentName}</h1>
      </section>

      <section className="student-dashboard-content">
        <div className="student-dashboard-main-card">
          <div className="student-dashboard-main-card-header">
            <div>
              <h2>Classes & Calendar</h2>
              <p>Track your classes in your current course.</p>
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
                {selectedDayClasses.length > 0 ? (
                  <div className="student-classes-list">
                    {selectedDayClasses.map((item) => (
                      <ClassCard key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="student-no-classes-message">No classes or events scheduled for this day.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="student-classes-list">
              {scheduleItems.map((item) => (
                <ClassCard key={item.id} item={item} />
              ))}
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
                {currentCourse ? `${currentCourse.title} ${currentCourse.level}` : "No active course"}
              </strong>
            </li>
            <li>
              <span>Hours completed</span>
              <strong>34h / 60h</strong>
            </li>
            <li>
              <span>Attendance</span>
              <strong>92%</strong>
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
