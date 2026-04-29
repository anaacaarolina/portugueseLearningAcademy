import { useEffect, useMemo, useState } from "react";

const emptyCourse = {
  title: "",
  description: "",
  level: "A1",
  type: "group",
  regime: "in-person",
  startDate: "",
  endDate: "",
  totalHours: "",
  maxStudents: "",
  location: "",
  teacherId: "",
  status: "draft",
  weeklySchedule: [],
  scheduleExceptions: [],
};

const emptyWeeklyScheduleItem = {
  dayOfWeek: "Mon",
  startTime: "09:00",
  endTime: "10:00",
  effectiveFrom: "",
  effectiveTo: "",
};

const emptyScheduleExceptionItem = {
  exceptionDate: "",
  startTime: "09:00",
  endTime: "10:00",
  isCancelled: false,
  reason: "",
};

const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2", "Business"];
const typeOptions = [
  { value: "group", label: "Group" },
  { value: "individual", label: "Individual" },
];
const regimeOptions = [
  { value: "in-person", label: "In person" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];
const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "full", label: "Full" },
  { value: "completed", label: "Completed" },
];

const dayOptions = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

function normalizeTimeValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 5);
}

function normalizeDateValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function normalizeCourse(course) {
  const typeValue = course?.type ?? course?.model ?? emptyCourse.type;
  const startDate = course?.start_date ?? course?.startDate ?? "";
  const endDate = course?.end_date ?? course?.endDate ?? "";

  return {
    ...emptyCourse,
    ...(course ?? {}),
    description: course?.description ?? "",
    level: course?.level ?? emptyCourse.level,
    type: String(typeValue).toLowerCase(),
    regime: course?.regime ?? emptyCourse.regime,
    startDate,
    endDate,
    totalHours: course?.total_hours ?? course?.hours ?? "",
    maxStudents: course?.max_students ?? course?.maxStudents ?? "",
    location: course?.location ?? "",
    teacherId: course?.teacher_id ?? course?.teacherId ?? "",
    status: course?.status ?? emptyCourse.status,
    weeklySchedule: Array.isArray(course?.weekly_schedule)
      ? course.weekly_schedule.map((item) => ({
          dayOfWeek: item?.day_of_week ?? "Mon",
          startTime: normalizeTimeValue(item?.start_time),
          endTime: normalizeTimeValue(item?.end_time),
          effectiveFrom: normalizeDateValue(item?.effective_from) || startDate,
          effectiveTo: normalizeDateValue(item?.effective_to) || endDate,
        }))
      : [],
    scheduleExceptions: Array.isArray(course?.schedule_exceptions)
      ? course.schedule_exceptions.map((item) => ({
          exceptionDate: normalizeDateValue(item?.exception_date),
          startTime: normalizeTimeValue(item?.start_time),
          endTime: normalizeTimeValue(item?.end_time),
          isCancelled: Boolean(item?.is_cancelled),
          reason: item?.reason ?? "",
        }))
      : [],
  };
}

export default function CourseForm({ course, onSubmit, apiBaseUrl }) {
  const draftCourse = useMemo(() => normalizeCourse(course), [course]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [isTeacherLoading, setIsTeacherLoading] = useState(false);
  const [teacherLoadError, setTeacherLoadError] = useState("");
  const [titleValue, setTitleValue] = useState(draftCourse.title);
  const [descriptionValue, setDescriptionValue] = useState(draftCourse.description);
  const [levelValue, setLevelValue] = useState(draftCourse.level);
  const [typeValue, setTypeValue] = useState(draftCourse.type);
  const [regimeValue, setRegimeValue] = useState(draftCourse.regime);
  const [startDateValue, setStartDateValue] = useState(draftCourse.startDate);
  const [endDateValue, setEndDateValue] = useState(draftCourse.endDate);
  const [totalHoursValue, setTotalHoursValue] = useState(draftCourse.totalHours);
  const [maxStudentsValue, setMaxStudentsValue] = useState(draftCourse.maxStudents);
  const [locationValue, setLocationValue] = useState(draftCourse.location);
  const [teacherIdValue, setTeacherIdValue] = useState(draftCourse.teacherId ? String(draftCourse.teacherId) : "");
  const [statusValue, setStatusValue] = useState(draftCourse.status);
  const [weeklyScheduleValue, setWeeklyScheduleValue] = useState(draftCourse.weeklySchedule);
  const [scheduleExceptionsValue, setScheduleExceptionsValue] = useState(draftCourse.scheduleExceptions);

  useEffect(() => {
    setTitleValue(draftCourse.title);
    setDescriptionValue(draftCourse.description);
    setLevelValue(draftCourse.level);
    setTypeValue(draftCourse.type);
    setRegimeValue(draftCourse.regime);
    setStartDateValue(draftCourse.startDate);
    setEndDateValue(draftCourse.endDate);
    setTotalHoursValue(draftCourse.totalHours);
    setMaxStudentsValue(draftCourse.maxStudents);
    setLocationValue(draftCourse.location);
    setTeacherIdValue(draftCourse.teacherId ? String(draftCourse.teacherId) : "");
    setStatusValue(draftCourse.status);
    setWeeklyScheduleValue(draftCourse.weeklySchedule);
    setScheduleExceptionsValue(draftCourse.scheduleExceptions);
  }, [draftCourse]);

  useEffect(() => {
    setWeeklyScheduleValue((current) =>
      current.map((item) => ({
        ...item,
        effectiveFrom: item.effectiveFrom || startDateValue,
        effectiveTo: item.effectiveTo || endDateValue,
      })),
    );
  }, [endDateValue, startDateValue]);

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      setIsTeacherLoading(true);
      setTeacherLoadError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/teachers`);
        if (!response.ok) {
          throw new Error("Unable to load teachers");
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        setTeacherOptions(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) {
          setTeacherLoadError("Could not load teachers from the API.");
        }
      } finally {
        if (isMounted) {
          setIsTeacherLoading(false);
        }
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedWeeklySchedule = weeklyScheduleValue
      .filter((item) => item.dayOfWeek && item.startTime && item.endTime)
      .map((item) => ({
        day_of_week: item.dayOfWeek,
        start_time: item.startTime,
        end_time: item.endTime,
        effective_from: item.effectiveFrom || null,
        effective_to: item.effectiveTo || null,
      }));

    const normalizedScheduleExceptions = scheduleExceptionsValue
      .filter((item) => item.exceptionDate && (item.isCancelled || (item.startTime && item.endTime)))
      .map((item) => ({
        exception_date: item.exceptionDate,
        start_time: item.isCancelled ? null : item.startTime,
        end_time: item.isCancelled ? null : item.endTime,
        is_cancelled: item.isCancelled,
        reason: item.reason.trim() || null,
      }));

    const payload = {
      title: titleValue.trim(),
      description: descriptionValue.trim(),
      level: levelValue,
      type: typeValue,
      regime: regimeValue,
      start_date: startDateValue || null,
      end_date: endDateValue || null,
      total_hours: totalHoursValue === "" ? null : Number(totalHoursValue),
      max_students: maxStudentsValue === "" ? null : Number(maxStudentsValue),
      location: locationValue.trim(),
      teacher_id: teacherIdValue === "" ? null : Number(teacherIdValue),
      status: statusValue,
      weekly_schedule: typeValue === "group" ? normalizedWeeklySchedule : [],
      schedule_exceptions: typeValue === "group" ? normalizedScheduleExceptions : [],
    };

    onSubmit?.(payload);
  }

  const addWeeklyScheduleItem = () => {
    setWeeklyScheduleValue((current) => [
      ...current,
      {
        ...emptyWeeklyScheduleItem,
        effectiveFrom: startDateValue,
        effectiveTo: endDateValue,
      },
    ]);
  };

  const updateWeeklyScheduleItem = (index, field, value) => {
    setWeeklyScheduleValue((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeWeeklyScheduleItem = (index) => {
    setWeeklyScheduleValue((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addScheduleExceptionItem = () => {
    setScheduleExceptionsValue((current) => [...current, { ...emptyScheduleExceptionItem }]);
  };

  const updateScheduleExceptionItem = (index, field, value) => {
    setScheduleExceptionsValue((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeScheduleExceptionItem = (index) => {
    setScheduleExceptionsValue((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <form id="admin-course-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-section-title">Course Details</div>
      <div className="admin-content-form-grid two-columns">
        <div className="span-two-columns">
          <label htmlFor="admin-course-title">Course title</label>
          <input id="admin-course-title" type="text" value={titleValue} required onChange={(event) => setTitleValue(event.target.value)} />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-course-description">Description</label>
          <textarea id="admin-course-description" rows="4" value={descriptionValue} onChange={(event) => setDescriptionValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-course-level">Level</label>
          <select id="admin-course-level" value={levelValue} required onChange={(event) => setLevelValue(event.target.value)}>
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-course-type">Course type</label>
          <select id="admin-course-type" value={typeValue} required onChange={(event) => setTypeValue(event.target.value)}>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-course-regime">Regime</label>
          <select id="admin-course-regime" value={regimeValue} required onChange={(event) => setRegimeValue(event.target.value)}>
            {regimeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-course-status">Status</label>
          <select id="admin-course-status" value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-course-hours">Total hours</label>
          <input id="admin-course-hours" type="number" min="0" step="0.1" value={totalHoursValue} onChange={(event) => setTotalHoursValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-course-max-students">Max students</label>
          <input id="admin-course-max-students" type="number" min="0" step="1" value={maxStudentsValue} onChange={(event) => setMaxStudentsValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-course-location">Location</label>
          <input id="admin-course-location" type="text" value={locationValue} onChange={(event) => setLocationValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-course-teacher">Teacher</label>
          <select id="admin-course-teacher" value={teacherIdValue} onChange={(event) => setTeacherIdValue(event.target.value)} disabled={isTeacherLoading || teacherOptions.length === 0}>
            <option value="">Select a teacher</option>
            {teacherOptions.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          {teacherLoadError ? <p className="admin-content-modal-feedback">{teacherLoadError}</p> : null}
        </div>

        <div>
          <label htmlFor="admin-course-start">Start date</label>
          <input id="admin-course-start" type="date" value={startDateValue} onChange={(event) => setStartDateValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-course-end">End date</label>
          <input id="admin-course-end" type="date" value={endDateValue} onChange={(event) => setEndDateValue(event.target.value)} />
        </div>

        {typeValue === "group" ? (
          <div className="span-two-columns admin-course-schedule-section">
            <div className="admin-content-form-section-title">Weekly Class Schedule</div>
            <p className="admin-course-schedule-help">Each row repeats every week until the course end date. To apply a permanent change, add a new row for the same weekday with a later Effective from date.</p>

            <div className="admin-course-schedule-list">
              {weeklyScheduleValue.map((item, index) => (
                <div key={`weekly-schedule-${index}`} className="admin-course-schedule-row">
                  <div>
                    <label htmlFor={`admin-course-schedule-day-${index}`}>Day</label>
                    <select id={`admin-course-schedule-day-${index}`} aria-label={`Weekly schedule day ${index + 1}`} value={item.dayOfWeek} onChange={(event) => updateWeeklyScheduleItem(index, "dayOfWeek", event.target.value)}>
                      {dayOptions.map((dayOption) => (
                        <option key={dayOption.value} value={dayOption.value}>
                          {dayOption.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`admin-course-schedule-start-${index}`}>Start</label>
                    <input id={`admin-course-schedule-start-${index}`} aria-label={`Weekly schedule start time ${index + 1}`} type="time" value={item.startTime} onChange={(event) => updateWeeklyScheduleItem(index, "startTime", event.target.value)} />
                  </div>

                  <div>
                    <label htmlFor={`admin-course-schedule-end-${index}`}>End</label>
                    <input id={`admin-course-schedule-end-${index}`} aria-label={`Weekly schedule end time ${index + 1}`} type="time" value={item.endTime} onChange={(event) => updateWeeklyScheduleItem(index, "endTime", event.target.value)} />
                  </div>

                  <div>
                    <label htmlFor={`admin-course-schedule-effective-from-${index}`}>Effective from</label>
                    <input id={`admin-course-schedule-effective-from-${index}`} aria-label={`Weekly schedule effective from ${index + 1}`} type="date" value={item.effectiveFrom} onChange={(event) => updateWeeklyScheduleItem(index, "effectiveFrom", event.target.value)} />
                  </div>

                  <div>
                    <label htmlFor={`admin-course-schedule-effective-to-${index}`}>Effective to</label>
                    <input id={`admin-course-schedule-effective-to-${index}`} aria-label={`Weekly schedule effective to ${index + 1}`} type="date" value={item.effectiveTo} onChange={(event) => updateWeeklyScheduleItem(index, "effectiveTo", event.target.value)} />
                  </div>

                  <button type="button" className="admin-course-schedule-remove" onClick={() => removeWeeklyScheduleItem(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="admin-course-schedule-add" onClick={addWeeklyScheduleItem}>
              Add Weekly Slot
            </button>

            <div className="admin-content-form-section-title">One-Time Changes</div>
            <p className="admin-course-schedule-help">Use this for exceptions on a specific date, like changing time once or cancelling that session.</p>

            <div className="admin-course-schedule-list">
              {scheduleExceptionsValue.map((item, index) => (
                <div key={`schedule-exception-${index}`} className="admin-course-schedule-row">
                  <div>
                    <label htmlFor={`admin-course-exception-date-${index}`}>Date</label>
                    <input id={`admin-course-exception-date-${index}`} aria-label={`One-time exception date ${index + 1}`} type="date" value={item.exceptionDate} onChange={(event) => updateScheduleExceptionItem(index, "exceptionDate", event.target.value)} />
                  </div>

                  <div>
                    <label htmlFor={`admin-course-exception-cancelled-${index}`}>Status</label>
                    <select id={`admin-course-exception-cancelled-${index}`} aria-label={`One-time exception status ${index + 1}`} value={item.isCancelled ? "cancelled" : "rescheduled"} onChange={(event) => updateScheduleExceptionItem(index, "isCancelled", event.target.value === "cancelled")}>
                      <option value="rescheduled">Time change</option>
                      <option value="cancelled">Cancelled class</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`admin-course-exception-start-${index}`}>Start</label>
                    <input id={`admin-course-exception-start-${index}`} aria-label={`One-time exception start time ${index + 1}`} type="time" value={item.startTime} disabled={item.isCancelled} onChange={(event) => updateScheduleExceptionItem(index, "startTime", event.target.value)} />
                  </div>

                  <div>
                    <label htmlFor={`admin-course-exception-end-${index}`}>End</label>
                    <input id={`admin-course-exception-end-${index}`} aria-label={`One-time exception end time ${index + 1}`} type="time" value={item.endTime} disabled={item.isCancelled} onChange={(event) => updateScheduleExceptionItem(index, "endTime", event.target.value)} />
                  </div>

                  <div className="span-two-columns">
                    <label htmlFor={`admin-course-exception-reason-${index}`}>Reason</label>
                    <input id={`admin-course-exception-reason-${index}`} aria-label={`One-time exception reason ${index + 1}`} type="text" value={item.reason} onChange={(event) => updateScheduleExceptionItem(index, "reason", event.target.value)} placeholder="Optional note" />
                  </div>

                  <button type="button" className="admin-course-schedule-remove" onClick={() => removeScheduleExceptionItem(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="admin-course-schedule-add" onClick={addScheduleExceptionItem}>
              Add One-Time Change
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
