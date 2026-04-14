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
  const [testimonials, setTestimonials] = useState([]);
  const [isTestimonialsLoading, setIsTestimonialsLoading] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState("");

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

  const courses = [
    {
      id: 1,
      type: "group",
      title: "Beginner",
      level: "A1-A2",
      summary: "Start your Portuguese Journey",
    },
    {
      id: 2,
      type: "group",
      title: "Intermediate",
      level: "B1-B2",
      summary: "Build on your knowledge",
    },
    {
      id: 3,
      type: "group",
      title: "Advanced",
      level: "C1-C2",
      summary: "Master the language.",
    },
    {
      id: 4,
      type: "group",
      title: "Business Portuguese",
      level: "A2-B2",
      summary: "Learn vocabulary for real workplace use.",
    },
    {
      id: 5,
      type: "individual",
      title: "Beginner",
      level: "A1",
      summary: "Start your Portuguese Journey",
    },
    {
      id: 6,
      type: "individual",
      title: "Beginner",
      level: "A2",
      summary: "Continue the journey",
    },
    {
      id: 7,
      type: "individual",
      title: "Intermediate",
      level: "B1",
      summary: "Build on your knowledge",
    },
    {
      id: 8,
      type: "individual",
      title: "Intermediate",
      level: "B2",
      summary: "Advance your vocabulary",
    },
    {
      id: 9,
      type: "individual",
      title: "Advanced",
      level: "C1-C2",
      summary: "Master the language",
    },
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
          <Button text="Get Started" className="hero-button"></Button>
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
          {filteredCourses.map((course) => (
            <HomepageCourseCard key={course.id} title={course.title} level={course.level} summary={course.summary} to={"/course"} />
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
