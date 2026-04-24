import "./HomepageCourseCard.css";
import { Link } from "react-router-dom";

export default function HomepageCourseCard({ title, level, summary, to = "/courses" }) {
  return (
    <Link to={to} className="course-card-link">
      <div className="course-card">
        <h3 className="course-card-title">{title}</h3>
        <p className="course-card-level"> {level}</p>
        <p className="course-card-summary">{summary}</p>
      </div>
    </Link>
  );
}
