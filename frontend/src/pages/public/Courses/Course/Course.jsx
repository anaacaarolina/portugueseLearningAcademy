import "./Course.css";
import { Link } from "react-router-dom";
import { Calendar, Clock, Award, BookOpen, UsersRound } from "lucide-react";
import CourseDetailCard from "../../../../components/Course/CourseDetailCard/CourseDetailCard";

export default function Course() {
  const details = [
    {
      id: 1,
      icon: Clock,
      title: "Duration",
      text: "12 weeks with two sessions per week.",
    },
    {
      id: 2,
      icon: Award,
      title: "Level",
      text: "Intermediate (B1-B2).",
    },
    {
      id: 3,
      icon: UsersRound,
      title: "Class Size",
      text: "Small groups with up to 10 students.",
    },
    {
      id: 4,
      icon: BookOpen,
      title: "Model",
      text: "Live online classes with practical activities.",
    },
    {
      id: 5,
      icon: Calendar,
      title: "Start Date",
      text: "April 8, 2026.",
    },
    {
      id: 6,
      icon: Calendar,
      title: "End Date",
      text: "June 30, 2026.",
    },
  ];

  const learningPoints = ["Master intermediate Portuguese grammar structures and verb conjugations", "Engage in conversations about everyday topics with confidence", "Understand and use idiomatic expressions in context", "Read and comprehend Portuguese texts, articles, and short stories", "Write coherent paragraphs and emails in Portuguese", "Discuss Portuguese culture, traditions, and current events", "Develop listening skills through authentic audio materials", "Build vocabulary for travel, work, and social situations"];

  return (
    <div className="course-page">
      <section className="course-intro-section">
        <p className="course-subtitle">Intermediate Course</p>
        <h1 className="course-title">Portuguese B1 - Group Course</h1>
        <p className="course-description">Take your Portuguese to the next level with our comprehensive intermediate course. Perfect for students who have completed A2 or have basic conversation skills.</p>
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

      <section className="course-teacher-section">
        <h2>Meet Your Teacher</h2>
        <article className="teacher-card">
          <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80" alt="Teacher Sofia Almeida" className="teacher-card-image" />
          <div className="teacher-card-content">
            <h3>Professor Sofia Rodrigues</h3>
            <p className="teacher-card-subtitle">Portuguese Language Specialist</p>
            <p className="teacher-card-bio">
              Sofia has been teaching Portuguese for over 12 years and holds a Master's degree in Portuguese Linguistics from the University of Lisbon. She specializes in communicative teaching methods and has helped hundreds of students achieve fluency. <br />
              Born and raised in Porto, Sofia brings authentic cultural insights to every class. Her passion for teaching and patient approach make even the most challenging grammar concepts accessible and enjoyable
            </p>
          </div>
        </article>
      </section>

      <section className="course-cta-section">
        <h2>Ready to Join This Course?</h2>
        <p>Secure your spot now and start learning Portuguese with a clear path and expert guidance.</p>
        <Link to="/enrollment" className="button course-cta-button">
          Enroll Now
        </Link>
      </section>
    </div>
  );
}
