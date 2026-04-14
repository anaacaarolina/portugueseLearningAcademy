const teachers = ["Professor Sofia Rodrigues", "Professor Tiago Almeida", "Professor Mariana Costa", "Professor Rui Fernandes"];

const emptyCourse = {
  title: "",
  level: "",
  duration: "",
  hours: 0,
  location: "",
  model: "Group",
  startDate: "",
  endDate: "",
  maxStudents: 0,
  description: "",
  learning: "",
  teacher: "",
};

export default function CourseForm({ course }) {
  const draftCourse = course ?? emptyCourse;

  return (
    <>
      <div className="admin-content-form-section-title">Basic Information</div>
      <div className="admin-content-form-grid two-columns">
        <div>
          <label htmlFor="admin-course-title">Course title</label>
          <input id="admin-course-title" type="text" defaultValue={draftCourse.title} />
        </div>
        <div>
          <label htmlFor="admin-course-level">Level</label>
          <input id="admin-course-level" type="text" defaultValue={draftCourse.level} />
        </div>
        <div>
          <label htmlFor="admin-course-duration">Duration</label>
          <input id="admin-course-duration" type="text" defaultValue={draftCourse.duration} />
        </div>
        <div>
          <label htmlFor="admin-course-hours">Hours</label>
          <input id="admin-course-hours" type="number" defaultValue={draftCourse.hours} />
        </div>
        <div>
          <label htmlFor="admin-course-location">Location</label>
          <input id="admin-course-location" type="text" defaultValue={draftCourse.location} />
        </div>
        <div>
          <label htmlFor="admin-course-model">Model</label>
          <select id="admin-course-model" defaultValue={draftCourse.model}>
            <option>Group</option>
            <option>Individual</option>
          </select>
        </div>
        <div>
          <label htmlFor="admin-course-start">Start date</label>
          <input id="admin-course-start" type="date" defaultValue={draftCourse.startDate} />
        </div>
        <div>
          <label htmlFor="admin-course-end">End date</label>
          <input id="admin-course-end" type="date" defaultValue={draftCourse.endDate} />
        </div>
        <div>
          <label htmlFor="admin-course-max-students">Max students</label>
          <input id="admin-course-max-students" type="number" defaultValue={draftCourse.maxStudents} />
        </div>
      </div>

      <div className="admin-content-form-section-title">Course Details</div>
      <div className="admin-content-form-grid">
        <div>
          <label htmlFor="admin-course-description">Description</label>
          <textarea id="admin-course-description" rows="3" defaultValue={draftCourse.description} />
        </div>
        <div>
          <label htmlFor="admin-course-learning">What you'll learn</label>
          <textarea id="admin-course-learning" rows="3" defaultValue={draftCourse.learning} />
        </div>
        <div>
          <label htmlFor="admin-course-teacher">Teacher</label>
          <select id="admin-course-teacher" defaultValue={draftCourse.teacher}>
            {teachers.map((teacherName) => (
              <option key={teacherName} value={teacherName}>
                {teacherName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
