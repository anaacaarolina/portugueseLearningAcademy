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

function normalizeCourse(course) {
  const typeValue = course?.type ?? course?.model ?? emptyCourse.type;

  return {
    ...emptyCourse,
    ...(course ?? {}),
    description: course?.description ?? "",
    level: course?.level ?? emptyCourse.level,
    type: String(typeValue).toLowerCase(),
    regime: course?.regime ?? emptyCourse.regime,
    startDate: course?.start_date ?? course?.startDate ?? "",
    endDate: course?.end_date ?? course?.endDate ?? "",
    totalHours: course?.total_hours ?? course?.hours ?? "",
    maxStudents: course?.max_students ?? course?.maxStudents ?? "",
    location: course?.location ?? "",
    teacherId: course?.teacher_id ?? course?.teacherId ?? "",
    status: course?.status ?? emptyCourse.status,
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
  }, [draftCourse]);

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
    };

    onSubmit?.(payload);
  }

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
      </div>
    </form>
  );
}
