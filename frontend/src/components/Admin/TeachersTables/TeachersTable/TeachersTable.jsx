import { useMemo, useState } from "react";
import { X } from "lucide-react";
import "./TeachersTable.css";

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULT_SLOT = {
  date: getTodayIsoDate(),
  start: "09:00",
  end: "17:00",
  isAvailable: true,
};

const CALENDAR_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function buildIsoDate(year, month, day) {
  const monthPart = String(month + 1).padStart(2, "0");
  const dayPart = String(day).padStart(2, "0");
  return `${year}-${monthPart}-${dayPart}`;
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeTeacherCourses(courseValue) {
  if (!courseValue) {
    return [];
  }

  return String(courseValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TeachersTable({ teachers, onDeleteTeacher, onSaveAvailability }) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [detailsTeacherId, setDetailsTeacherId] = useState(null);
  const [teacherAvailability, setTeacherAvailability] = useState([]);
  const [availabilityDraft, setAvailabilityDraft] = useState([]);
  const [newSlot, setNewSlot] = useState(DEFAULT_SLOT);
  const [detailsMonth, setDetailsMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDetailsDate, setSelectedDetailsDate] = useState("");

  const availabilityByDate = useMemo(() => {
    return teacherAvailability.reduce((acc, slot) => {
      if (!slot?.date) {
        return acc;
      }

      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [teacherAvailability]);

  const groupedDraftAvailability = useMemo(() => {
    return availabilityDraft.reduce((acc, slot) => {
      if (!slot?.date) {
        return acc;
      }

      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [availabilityDraft]);

  const formatDateLabel = (isoDate) => {
    if (!isoDate) {
      return "Date not set";
    }

    const parsedDate = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return isoDate;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openAvailabilityDetails = async (teacherId) => {
    setDetailsTeacherId(teacherId);

    try {
      const response = await fetch(`/api/teachers/${teacherId}/availability`);
      if (!response.ok) {
        throw new Error("Failed to fetch teacher availability");
      }

      const data = await response.json();
      const normalizedData = Array.isArray(data) ? data.filter((slot) => Boolean(slot?.date)) : [];
      setTeacherAvailability(normalizedData);

      if (normalizedData.length > 0) {
        const firstDate = [...normalizedData]
          .map((slot) => slot.date)
          .sort((a, b) => a.localeCompare(b))[0];

        if (firstDate) {
          const firstDateObj = new Date(`${firstDate}T00:00:00`);
          if (!Number.isNaN(firstDateObj.getTime())) {
            setDetailsMonth(new Date(firstDateObj.getFullYear(), firstDateObj.getMonth(), 1));
            setSelectedDetailsDate(firstDate);
          }
        }
      } else {
        const now = new Date();
        setDetailsMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        setSelectedDetailsDate("");
      }
    } catch (error) {
      console.error(error);
      setTeacherAvailability([]);
      setSelectedDetailsDate("");
    }
  };

  const openAvailabilityEditor = async (teacherId) => {
    setSelectedTeacherId(teacherId);

    try {
      const response = await fetch(`/api/teachers/${teacherId}/availability`);
      if (!response.ok) {
        throw new Error("Failed to fetch teacher availability");
      }

      const data = await response.json();
      setAvailabilityDraft(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setAvailabilityDraft([]);
    }

    setNewSlot({ ...DEFAULT_SLOT, date: getTodayIsoDate() });
  };

  const handleAddSlot = () => {
    if (!newSlot.date || !newSlot.start || !newSlot.end) {
      return;
    }

    setAvailabilityDraft((current) => [...current, newSlot]);
    setNewSlot({ ...DEFAULT_SLOT, date: newSlot.date });
  };

  const handleSaveAvailability = async () => {
    if (!selectedTeacherId) {
      return;
    }

    const hasCurrentSlot = Boolean(newSlot.date && newSlot.start && newSlot.end);
    const slotsToSave = hasCurrentSlot ? [...availabilityDraft, newSlot] : availabilityDraft;

    if (slotsToSave.length === 0) {
      alert("Add at least one availability slot before saving.");
      return;
    }

    try {
      await onSaveAvailability?.(selectedTeacherId, slotsToSave);
      setSelectedTeacherId(null);
      setAvailabilityDraft([]);
      setNewSlot({ ...DEFAULT_SLOT, date: getTodayIsoDate() });
    } catch (error) {
      console.error(error);
    }
  };

  const calendarYear = detailsMonth.getFullYear();
  const calendarMonth = detailsMonth.getMonth();
  const monthGrid = useMemo(() => getMonthGrid(calendarYear, calendarMonth), [calendarYear, calendarMonth]);
  const monthLabel = detailsMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const selectedDateSlots = selectedDetailsDate
    ? [...(availabilityByDate[selectedDetailsDate] || [])].sort((a, b) => `${a.start}`.localeCompare(`${b.start}`))
    : [];

  const getDayStatus = (isoDate) => {
    const slots = availabilityByDate[isoDate] || [];
    if (slots.length === 0) {
      return "none";
    }

    const hasAvailable = slots.some((slot) => slot.isAvailable);
    const hasUnavailable = slots.some((slot) => !slot.isAvailable);

    if (hasAvailable && hasUnavailable) {
      return "mixed";
    }

    if (hasUnavailable) {
      return "unavailable";
    }

    return "available";
  };

  return (
    <div className="admin-teachers-section">
      <div className="admin-teachers-header">
        <h2>Teachers</h2>
        <span className="admin-teachers-count-pill">Total teachers: {teachers?.length ?? 0}</span>
      </div>

      <div className="admin-teachers-table-wrapper">
        <table className="admin-teachers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Courses</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((teacher) => {
              const courses = normalizeTeacherCourses(teacher.course);

              return (
                <tr key={teacher.id}>
                  <td>
                    <div className="admin-teacher-name-cell">
                      <span className="admin-teacher-avatar">{getInitials(teacher.name)}</span>
                      <span>{teacher.name}</span>
                    </div>
                  </td>
                  <td>
                    {courses.length > 0 ? (
                      <ul className="admin-teacher-courses-list">
                        {courses.map((courseName) => (
                          <li key={`${teacher.id}-${courseName}`}>{courseName}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="admin-teacher-empty-course">No assigned courses</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-teacher-actions">
                      <button type="button" onClick={() => openAvailabilityEditor(teacher.id)}>
                        Set Availability
                      </button>
                      <button type="button" onClick={() => openAvailabilityDetails(teacher.id)}>
                        View Details
                      </button>
                      <button type="button" onClick={() => onDeleteTeacher?.(teacher.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTeacherId && (
        <div className="admin-content-modal-backdrop" role="presentation" onClick={() => setSelectedTeacherId(null)}>
          <div className="admin-content-modal" role="dialog" aria-modal="true" aria-label="Set Teacher Availability" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-content-modal-close" onClick={() => setSelectedTeacherId(null)} aria-label="Close modal">
              <X size={18} aria-hidden="true" />
            </button>
            <h3>Set Availability</h3>

            <label htmlFor="teacher-availability-date">Date</label>
            <input id="teacher-availability-date" type="date" value={newSlot.date} onChange={(event) => setNewSlot((prev) => ({ ...prev, date: event.target.value }))} aria-label="Availability date" />

            <label htmlFor="teacher-availability-start">Start time</label>
            <input id="teacher-availability-start" type="time" value={newSlot.start} onChange={(event) => setNewSlot((prev) => ({ ...prev, start: event.target.value }))} aria-label="Start time" />

            <label htmlFor="teacher-availability-end">End time</label>
            <input id="teacher-availability-end" type="time" value={newSlot.end} onChange={(event) => setNewSlot((prev) => ({ ...prev, end: event.target.value }))} aria-label="End time" />

            <label htmlFor="teacher-availability-status">Status</label>
            <select
              id="teacher-availability-status"
              value={newSlot.isAvailable ? "available" : "unavailable"}
              onChange={(event) =>
                setNewSlot((prev) => ({
                  ...prev,
                  isAvailable: event.target.value === "available",
                }))
              }
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <div className="admin-content-modal-actions">
              <button type="button" className="admin-content-modal-cancel" onClick={handleAddSlot}>
                Add Slot
              </button>
              <button type="button" className="admin-content-modal-confirm" onClick={handleSaveAvailability}>
                Save Availability
              </button>
            </div>

            <ul className="admin-teacher-draft-availability-list">
              {availabilityDraft.map((slot, index) => (
                <li key={`${slot.date}-${slot.start}-${slot.end}-${index}`}>
                  <span>
                    {formatDateLabel(slot.date)} - {slot.start} to {slot.end} ({slot.isAvailable ? "Available" : "Unavailable"})
                  </span>
                  <button type="button" onClick={() => setAvailabilityDraft((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            {Object.keys(groupedDraftAvailability).length > 0 && (
              <div className="admin-teacher-availability-group-list">
                {Object.entries(groupedDraftAvailability).map(([slotDate, slots]) => (
                  <div key={slotDate} className="admin-teacher-availability-group">
                    <strong>{formatDateLabel(slotDate)}</strong>
                    <ul>
                      {slots.map((slot, index) => (
                        <li key={`${slotDate}-${slot.start}-${slot.end}-${index}`}>
                          {slot.start} - {slot.end} ({slot.isAvailable ? "Available" : "Unavailable"})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {detailsTeacherId && (
        <div className="admin-content-modal-backdrop" role="presentation" onClick={() => setDetailsTeacherId(null)}>
          <div className="admin-content-modal" role="dialog" aria-modal="true" aria-label="Teacher Availability Details" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="admin-content-modal-close" onClick={() => setDetailsTeacherId(null)} aria-label="Close modal">
              <X size={18} aria-hidden="true" />
            </button>
            <h3>Teacher Availability</h3>

            {Object.keys(availabilityByDate).length === 0 ? (
              <p>No availability set</p>
            ) : (
              <div className="admin-teacher-calendar-panel">
                <div className="admin-teacher-calendar-header">
                  <button
                    type="button"
                    className="admin-teacher-calendar-nav"
                    onClick={() => setDetailsMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  >
                    Prev
                  </button>
                  <strong>{monthLabel}</strong>
                  <button
                    type="button"
                    className="admin-teacher-calendar-nav"
                    onClick={() => setDetailsMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  >
                    Next
                  </button>
                </div>

                <div className="admin-teacher-calendar-weekdays">
                  {CALENDAR_WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="admin-teacher-calendar-grid">
                  {monthGrid.map((day, index) => {
                    if (!day) {
                      return (
                        <span key={`empty-${index}`} className="admin-teacher-calendar-day is-empty" aria-hidden="true">
                          
                        </span>
                      );
                    }

                    const isoDate = buildIsoDate(calendarYear, calendarMonth, day);
                    const status = getDayStatus(isoDate);
                    const isSelected = isoDate === selectedDetailsDate;

                    return (
                      <button
                        key={isoDate}
                        type="button"
                        className={`admin-teacher-calendar-day is-${status} ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSelectedDetailsDate(isoDate)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="admin-teacher-calendar-legend">
                  <span><i className="is-available" /> Available</span>
                  <span><i className="is-unavailable" /> Unavailable</span>
                  <span><i className="is-mixed" /> Mixed</span>
                </div>

                <div className="admin-teacher-selected-day-slots">
                  <strong>{selectedDetailsDate ? formatDateLabel(selectedDetailsDate) : "Select a day"}</strong>
                  {selectedDateSlots.length === 0 ? (
                    <p>No slots on this day.</p>
                  ) : (
                    <ul>
                      {selectedDateSlots.map((slot, index) => (
                        <li key={`${selectedDetailsDate}-${slot.start}-${slot.end}-${index}`}>
                          {slot.start} - {slot.end} ({slot.isAvailable ? "Available" : "Unavailable"})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <div className="admin-content-modal-actions">
              <button type="button" onClick={() => setDetailsTeacherId(null)} className="admin-content-modal-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
