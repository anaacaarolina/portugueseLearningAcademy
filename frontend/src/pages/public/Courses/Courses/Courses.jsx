import "./Courses.css";
import { useMemo, useState } from "react";
import Select from "react-select";
import CourseCatalogCard from "../../../../components/Course/CourseCatalogCard/CourseCatalogCard";

const courses = [
  {
    id: 1,
    type: "group",
    title: "Beginner",
    level: "A1-A2",
    description: "Start your Portuguese journey with practical classes focused on everyday communication.",
    weeks: "12 weeks",
    startDate: "April 8, 2026",
    location: "Gaia",
  },
  {
    id: 2,
    type: "group",
    title: "Intermediate",
    level: "B1-B2",
    description: "Build on your current knowledge and gain confidence in conversations and writing.",
    weeks: "12 weeks",
    startDate: "April 8, 2026",
    location: "Gaia",
  },
  {
    id: 3,
    type: "group",
    title: "Advanced",
    level: "C1-C2",
    description: "Master the language with complex grammar, fluency training, and cultural context.",
    weeks: "14 weeks",
    startDate: "April 15, 2026",
    location: "Online",
  },
  {
    id: 4,
    type: "group",
    title: "Business Portuguese",
    level: "A2-B2",
    description: "Learn professional vocabulary and communication for meetings, emails, and workplace situations.",
    weeks: "10 weeks",
    startDate: "May 6, 2026",
    location: "Online",
  },
  {
    id: 5,
    type: "individual",
    title: "Beginner",
    level: "A1",
    description: "Personalized one-to-one guidance to start speaking Portuguese from your first classes.",
    weeks: "8 weeks",
    startDate: "Flexible Start",
    location: "Online",
  },
  {
    id: 6,
    type: "individual",
    title: "Beginner",
    level: "A2",
    description: "Continue the beginner journey with custom pacing and focused speaking practice.",
    weeks: "8 weeks",
    startDate: "Flexible Start",
    location: "Online",
  },
  {
    id: 7,
    type: "individual",
    title: "Intermediate",
    level: "B1",
    description: "Improve fluency and vocabulary through classes adapted to your personal goals.",
    weeks: "10 weeks",
    startDate: "Flexible Start",
    location: "Online",
  },
  {
    id: 8,
    type: "individual",
    title: "Intermediate",
    level: "B2",
    description: "Advance your language skills with structured coaching and targeted correction.",
    weeks: "10 weeks",
    startDate: "Flexible Start",
    location: "Online",
  },
  {
    id: 9,
    type: "individual",
    title: "Advanced",
    level: "C1-C2",
    description: "Reach near-native confidence through advanced conversation, reading, and writing work.",
    weeks: "12 weeks",
    startDate: "Flexible Start",
    location: "Online",
  },
];

export default function Courses() {
  const typeOptions = useMemo(() => {
    const options = Array.from(new Set(courses.map((course) => course.type)));
    return [
      { value: "all", label: "All Types" },
      ...options.map((type) => ({
        value: type,
        label: type === "group" ? "Group Courses" : "Individual Courses",
      })),
    ];
  }, []);

  const locationOptions = useMemo(() => {
    const options = Array.from(new Set(courses.map((course) => course.location)));
    return [{ value: "all", label: "All Locations" }, ...options.map((location) => ({ value: location, label: location }))];
  }, []);

  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const filteredCourses = courses.filter((course) => {
    const matchesType = selectedType === "all" || course.type === selectedType;
    const matchesLocation = selectedLocation === "all" || course.location === selectedLocation;
    return matchesType && matchesLocation;
  });

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
        <div className="courses-catalog-grid">
          {filteredCourses.map((course) => (
            <CourseCatalogCard key={course.id} level={course.level} title={course.title} description={course.description} weeks={course.weeks} startDate={course.startDate} location={course.location} type={course.type} />
          ))}
        </div>
      </section>

      <section className="courses-empty-state" aria-live="polite">
        {filteredCourses.length === 0 ? <p>No courses found for the selected filters.</p> : null}
      </section>
    </div>
  );
}
