import "./Courses.css";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import CourseCatalogCard from "../../../../components/Course/CourseCatalogCard/CourseCatalogCard";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [coursesLoadError, setCoursesLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setIsLoadingCourses(true);
      setCoursesLoadError("");

      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Unable to load courses");
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        setCourses(Array.isArray(data) ? data : []);
      } catch {
        if (isMounted) {
          setCoursesLoadError("Could not load courses from the API.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const typeOptions = useMemo(() => {
    const options = Array.from(new Set(courses.map((course) => course.type)));
    return [
      { value: "all", label: "All Types" },
      ...options.map((type) => ({
        value: type,
        label: type === "group" ? "Group Courses" : "Individual Courses",
      })),
    ];
  }, [courses]);

  const locationOptions = useMemo(() => {
    const options = Array.from(new Set(courses.map((course) => course.location)));
    return [{ value: "all", label: "All Locations" }, ...options.map((location) => ({ value: location, label: location }))];
  }, [courses]);

  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const filteredCourses = courses.filter((course) => {
    const matchesType = selectedType === "all" || course.type === selectedType;
    const matchesLocation = selectedLocation === "all" || course.location === selectedLocation;
    return matchesType && matchesLocation;
  });

  const formatStartDate = (value) => {
    if (!value) {
      return "Flexible Start";
    }

    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toSlug = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <div className="courses-page">
      <section className="courses-hero-section">
        <p className="courses-subtitle">Our Courses</p>
        <h1>Our Portuguese Courses</h1>
        <p>From begginer to advanced, find the perfect course to start or continue your Portuguese learning journey.</p>
      </section>

      <section className="courses-filter-section">
        <div className="courses-filter-field">
          <label htmlFor="courses-filter-type">Course Type</label>
          <Select inputId="courses-filter-type" className="courses-filter-select" classNamePrefix="react-select" value={typeOptions.find((option) => option.value === selectedType)} onChange={(option) => setSelectedType(option.value)} options={typeOptions} isSearchable={false} />
        </div>

        <div className="courses-filter-field">
          <label htmlFor="courses-filter-location">Location</label>
          <Select inputId="courses-filter-location" className="courses-filter-select" classNamePrefix="react-select" value={locationOptions.find((option) => option.value === selectedLocation)} onChange={(option) => setSelectedLocation(option.value)} options={locationOptions} isSearchable={false} />
        </div>
      </section>

      <section className="courses-catalog-section">
        {isLoadingCourses ? <p>Loading courses...</p> : null}
        {coursesLoadError ? <p>{coursesLoadError}</p> : null}
        <div className="courses-catalog-grid">
          {filteredCourses.map((course) => (
            <CourseCatalogCard
              key={course.id}
              slug={toSlug(course.title)}
              level={course.level || "All Levels"}
              title={course.title || "Untitled Course"}
              description={course.description || "Course details coming soon."}
              weeks={course.total_hours ? `${course.total_hours} hours` : null}
              startDate={formatStartDate(course.start_date)}
              location={course.location || "Location to be announced"}
              type={course.type || "group"}
            />
          ))}
          {!isLoadingCourses && !coursesLoadError && filteredCourses.length === 0 ? <p>No courses found for the selected filters.</p> : null}
        </div>
      </section>
    </div>
  );
}
