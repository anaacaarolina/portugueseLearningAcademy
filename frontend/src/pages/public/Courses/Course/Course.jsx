import "./Course.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, Award, BookOpen, UsersRound } from "lucide-react";
import CourseDetailCard from "../../../../components/Course/CourseDetailCard/CourseDetailCard";

export default function Course() {
  const { courseSlug } = useParams();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const toSlug = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  useEffect(() => {
    let isMounted = true;

    const loadCourse = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Unable to load course");
        }

        const data = await response.json();
        const courses = Array.isArray(data) ? data : [];
        const selectedCourse = courseSlug ? courses.find((item) => toSlug(item?.title) === courseSlug) : courses[0];

        if (!isMounted) {
          return;
        }

        setCourse(selectedCourse || null);
      } catch {
        if (isMounted) {
          setCourse(null);
          setErrorMessage("Could not load course from the API.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCourse();

    return () => {
      isMounted = false;
    };
  }, [courseSlug]);

  const formatDate = (value) => {
    if (!value) {
      return "Flexible Start";
    }

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const details = useMemo(() => {
    if (!course) {
      return [];
    }

    return [
      {
        id: 1,
        icon: Clock,
        title: "Duration",
        text: course.total_hours ? `${course.total_hours} total hours.` : "Flexible duration.",
      },
      {
        id: 2,
        icon: Award,
        title: "Level",
        text: course.level ? `${String(course.level).toUpperCase()} level.` : "All levels.",
      },
      {
        id: 3,
        icon: UsersRound,
        title: "Class Size",
        text: course.max_students ? `Up to ${course.max_students} students.` : "Class size defined by demand.",
      },
      {
        id: 4,
        icon: BookOpen,
        title: "Model",
        text: `${course.regime || "in-person"}`,
      },
      {
        id: 5,
        icon: Calendar,
        title: "Start Date",
        text: `${formatDate(course.start_date)}.`,
      },
      {
        id: 6,
        icon: Calendar,
        title: "End Date",
        text: `${course.end_date ? formatDate(course.end_date) : "To be announced"}.`,
      },
    ];
  }, [course]);

  const learningPoints = useMemo(() => {
    if (!course) {
      return [];
    }

    const title = course.title || "this course";
    const level = course.level ? String(course.level).toUpperCase() : "all levels";
    const type = course.type || "group";

    return [
      `Build confidence in ${title.toLowerCase()} communication contexts.`,
      `Develop practical Portuguese skills aligned with ${level}.`,
      `Practice through ${type} sessions focused on speaking and comprehension.`,
    ];
  }, [course]);

  const subtitle = useMemo(() => {
    if (!course) {
      return "Course";
    }

    const typeLabel = course.type ? String(course.type).toUpperCase() : "GROUP";
    const levelLabel = course.level ? String(course.level).toUpperCase() : "ALL LEVELS";
    return `${typeLabel} • ${levelLabel}`;
  }, [course]);

  const courseTitle = course?.title || "Course";
  const courseDescription = course?.description || "Course details will be available soon.";

  return (
    <div className="course-page">
      {isLoading ? <p>Loading course...</p> : null}
      {!isLoading && errorMessage ? <p>{errorMessage}</p> : null}
      {!isLoading && !errorMessage && !course ? <p>Course not found.</p> : null}

      <section className="course-intro-section">
        <p className="course-subtitle">{subtitle}</p>
        <h1 className="course-title">{courseTitle}</h1>
        <p className="course-description">{courseDescription}</p>
      </section>

      <section className="course-details-section">
        <div className="course-details-grid">
          {details.map((detail) => (
            <CourseDetailCard key={detail.id} icon={detail.icon} title={detail.title} text={detail.text} />
          ))}
        </div>
      </section>

      <section className="course-learning-section">
        <h2>What You'll Learn</h2>
        <ul className="course-learning-list">
          {learningPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="course-cta-section">
        <h2>Ready to Join This Course?</h2>
        <p>Secure your spot now and start learning Portuguese with a clear path and expert guidance.</p>
        <Link
          to="/enrollment"
          state={{
            preselectedCourseId: course?.id ?? null,
            preselectedCourseType: course?.type ?? null,
          }}
          className="button course-cta-button"
        >
          Enroll Now
        </Link>
      </section>
    </div>
  );
}
