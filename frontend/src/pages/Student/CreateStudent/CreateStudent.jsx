import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateStudent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    courseId: "",
    is_active: true,
  });
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "is_active" ? value === "true" : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { courseId, ...studentPayload } = form;

    const createResponse = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(studentPayload),
    });

    if (!createResponse.ok) {
      return;
    }

    const created = await createResponse.json();

    if (courseId && created?.id) {
      const assignResponse = await fetch(`/api/students/${created.id}/course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId: Number(courseId) }),
      });

      if (!assignResponse.ok) {
        return;
      }
    }

    navigate("/admin-dashboard");
  };

  return (
    <div>
      <h1>Create Student</h1>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} required aria-label="Name" />
        <input name="email" placeholder="Email" onChange={handleChange} required aria-label="Email" />
        <input name="phone" placeholder="Phone" onChange={handleChange} required aria-label="Phone" />
        <select name="courseId" value={form.courseId} onChange={handleChange} disabled={isCourseLoading || courseOptions.length === 0}>
          <option value="">Select course</option>
          {courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        {courseLoadError ? <p>{courseLoadError}</p> : null}

        <select name="is_active" value={String(form.is_active)} onChange={handleChange}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <button type="submit">Create</button>
      </form>
    </div>
  );
}
