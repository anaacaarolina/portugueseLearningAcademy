import "./Homepage.css";
import { useEffect, useState } from "react";
import PortugueseFlag from "../../../assets/portuguese_flag.webp";
import Button from "../../../components/Button/Button";
import HomepageCourseCard from "../../../components/Homepage/HomepageCourseCard/HomepageCourseCard";
import HomepageFeatureCard from "../../../components/Homepage/HomepageFeatureCard/HomepageFeatureCard";
import { Users, Award, Clock, Target } from "lucide-react";
import HomepageTestimonailCard from "../../../components/Homepage/HomepageTestimonialCard/HomepageTestimonialCard";
import Select from "react-select";

export default function Homepage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [courseType, setCourseType] = useState("group");
  const [courses, setCourses] = useState([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState("");

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

    const loadCourses = async () => {
      setIsCoursesLoading(true);
      setCoursesError("");

      try {
        const response = await fetch(`${apiBaseUrl}/api/courses`);
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
          setCourses([]);
          setCoursesError("Could not load courses from the API.");
        }
      } finally {
        if (isMounted) {
          setIsCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    let isMounted = true;

    const formatRelativeDate = (dateString) => {
      if (!dateString) {
        return "Recently";
      }

      const createdAt = new Date(dateString);
      if (Number.isNaN(createdAt.getTime())) {
        return "Recently";
      }

      const now = new Date();
      const diffInMs = createdAt.getTime() - now.getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

      if (Math.abs(diffInDays) < 1) {
        return "Today";
      }

      if (Math.abs(diffInDays) < 30) {
        return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) === 1 ? "" : "s"} ago`;
      }

      const diffInMonths = Math.round(Math.abs(diffInDays) / 30);
      return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    };

    const loadComments = async () => {
      setIsTestimonialsLoading(true);
      setTestimonialsError("");

      try {
        const response = await fetch(`${apiBaseUrl}/comments`);

        if (!response.ok) {
          throw new Error("Unable to load comments");
        }

        const commentsData = await response.json();
        if (!isMounted) {
          return;
        }

        const safeComments = Array.isArray(commentsData) ? commentsData : [];
        const publishedComments = safeComments
          .filter((comment) => comment?.status === "published")
          .sort((a, b) => {
            const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
            const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
            return bTime - aTime;
          })
          .slice(0, 3)
          .map((comment) => ({
            id: comment.id,
            rating: comment.rating,
            comment: comment.body,
            name: comment.author,
            date: formatRelativeDate(comment.created_at),
          }));

        setTestimonials(publishedComments);
      } catch {
        if (isMounted) {
          setTestimonials([]);
          setTestimonialsError("Could not load testimonials from the API.");
        }
      } finally {
        if (isMounted) {
          setIsTestimonialsLoading(false);
        }
      }
    };

    loadComments();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const courseOptions = [
    { value: "group", label: "Group Courses" },
    { value: "individual", label: "Individual Courses" },
  ];

  const filteredCourses = courses.filter((course) => course.type === courseType);

  const features = [
    {
      id: 1,
      icon: Users,
      title: "Student Approach",
      text: "You want to learn the language and you want your case to be treated closely by everyone. You need to find a school where everyone follows your profess and advises you according to that progress",
    },
    {
      id: 2,
      icon: Award,
      title: "Qualified Teachers",
      text: "Our experienced instructors are native speakers with professional certifications, dedicated to helpint you achive fluency through proven teaching methods",
    },
    {
      id: 3,
      icon: Clock,
      title: "Flexible Schedule",
      text: "We offer classes at various times troughout the day and week, making it easy to fit language learning into your busy lifestyle",
    },
    {
      id: 4,
      icon: Target,
      title: "Goal-Oriented Learning",
      text: "Whether you're learning for travel, work, or personal enrichment, we tailor out approach to help you reach your specific language goals.",
    },
  ];

  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-content">
          <p className="section-tag">Achieve your goals</p>
          <h1>Learn Portuguese with Confidence</h1>
          <p>Learn Portuguese with Confidence</p>
          <Button text="Get Started" className="hero-button" to="/courses"></Button>
        </div>
        <div className="hero-image-wrapper">
          <img src={PortugueseFlag} alt="The portuguese flag" />
        </div>
      </section>

      <section className="courses-section">
        <div className="section-heading-row">
          <h2>Our Courses</h2>
          <p>Besides the grammar, you will practice all the aspects of the conversational part of the language in the classroom alongside people with the same language goals as yours.</p>
        </div>
        <Select className="course-type-select" classNamePrefix="react-select" value={courseOptions.find((option) => option.value === courseType)} onChange={(option) => setCourseType(option.value)} options={courseOptions} isSearchable={false} />

        <div className="course-cards-grid">
          {isCoursesLoading ? <p>Loading courses...</p> : null}
          {!isCoursesLoading && coursesError ? <p>{coursesError}</p> : null}
          {!isCoursesLoading && !coursesError && filteredCourses.length === 0 ? <p>No courses available right now.</p> : null}
          {filteredCourses.map((course) => (
            <HomepageCourseCard key={course.id} title={course.title || "Untitled Course"} level={course.level || "All Levels"} summary={course.description || "Course details coming soon."} to={`/courses/${toSlug(course.title)}`} />
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-cards-grid">
          {features.map((feature) => (
            <HomepageFeatureCard key={feature.id} icon={feature.icon} title={feature.title} text={feature.text} />
          ))}
        </div>
      </section>

      <section className="map-section">
        <h2>Come Visit Us</h2>
        <p>Our map integration will be available soon. Meanwhile, here is a placeholder for the upcoming location view.</p>
        <img src="https://staticmapmaker.com/img/google-placeholder.png" alt="Google Maps Placeholder" className="map-placeholder" />
      </section>

      <section className="testimonials-section">
        <h2>What Our Students Say</h2>
        <div className="testimonial-cards-grid">
          {isTestimonialsLoading ? <p>Loading testimonials...</p> : null}
          {!isTestimonialsLoading && testimonialsError ? <p>{testimonialsError}</p> : null}
          {!isTestimonialsLoading && !testimonialsError && testimonials.length === 0 ? <p>No published testimonials yet.</p> : null}
          {!isTestimonialsLoading && !testimonialsError ? testimonials.map((testimonial) => <HomepageTestimonailCard key={testimonial.id} rating={testimonial.rating} comment={testimonial.comment} name={testimonial.name} date={testimonial.date} />) : null}
        </div>
      </section>
    </div>
  );
}
