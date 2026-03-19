import "./Homepage.css";
import { useState } from "react";
import PortugueseFlag from "../../../assets/portuguese_flag.webp";
import Button from "../../../components/Button/Button";
import HomepageCourseCard from "../../../components/Homepage/HomepageCourseCard/HomepageCourseCard";
import HomepageFeatureCard from "../../../components/Homepage/HomepageFeatureCard/HomepageFeatureCard";
import { Users, Award, Clock, Target } from "lucide-react";
import HomepageTestimonailCard from "../../../components/Homepage/HomepageTestimonialCard/HomepageTestimonialCard";
import Select from "react-select";

export default function Homepage() {
  const [courseType, setCourseType] = useState("group");

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

  const testimonials = [
    {
      id: 1,
      rating: 4,
      comment: "Great location and flexible schedyles. The group classes are fun and very effective for learning",
      name: "Ana Costa",
      date: "3 weeks ago",
    },
    {
      id: 2,
      rating: 5,
      comment: "The personalized approach really made a differce. The teachers genuinely care about your progress",
      name: "João Santos",
      date: "1 month ago",
    },
    {
      id: 3,
      rating: 5,
      comment: "Excellent teachers and a welcoming environment! I improved my Portuguese significantly in just a few months.",
      name: "Maria Silva",
      date: "2 months ago",
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
          {testimonials.map((testimonial) => (
            <HomepageTestimonailCard key={testimonial.id} rating={testimonial.rating} comment={testimonial.comment} name={testimonial.name} date={testimonial.date} />
          ))}
        </div>
      </section>
    </div>
  );
}
