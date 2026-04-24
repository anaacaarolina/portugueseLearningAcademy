import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  courseId: "",
  is_active: true,
};

export default function StudentForm({ onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [courseOptions, setCourseOptions] = useState([]);
  const [isCourseLoading, setIsCourseLoading] = useState(false);
  const [courseLoadError, setCourseLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setIsCourseLoading(true);
      setCourseLoadError("");

      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Unable to load courses");
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        setCourseOptions(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) {
          setCourseLoadError("Could not load courses from the API.");
        }
      } finally {
        if (isMounted) {
          setIsCourseLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "is_active" ? value === "true" : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit?.({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      courseId: form.courseId === "" ? null : Number(form.courseId),
      is_active: form.is_active,
    });
  };

  return (
    <form id="admin-student-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-grid two-columns">
        <div className="span-two-columns">
          <label htmlFor="admin-student-name">Name</label>
          <input id="admin-student-name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-student-email">Email</label>
          <input id="admin-student-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="admin-student-phone">Phone</label>
          <input id="admin-student-phone" name="phone" type="text" value={form.phone} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="admin-student-course">Course</label>
          <select id="admin-student-course" name="courseId" value={form.courseId} onChange={handleChange} disabled={isCourseLoading || courseOptions.length === 0}>
            <option value="">Select course</option>
            {courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {courseLoadError ? <p className="admin-content-modal-feedback">{courseLoadError}</p> : null}
        </div>

        <div className="span-two-columns">
          <label htmlFor="admin-student-active">Status</label>
          <select id="admin-student-active" name="is_active" value={String(form.is_active)} onChange={handleChange}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </form>
  );
}
