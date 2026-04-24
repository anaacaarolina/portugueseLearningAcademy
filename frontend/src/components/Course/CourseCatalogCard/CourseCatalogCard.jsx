import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./CourseCatalogCard.css";

const typeLabelMap = {
  group: "Group",
  individual: "Individual",
};

export default function CourseCatalogCard({ slug, level, title, description, weeks, startDate, location, type }) {
  const courseTypeLabel = typeLabelMap[type] ?? type;
  const detailsUrl = slug ? `/courses/${slug}` : "/courses";

  return (
    <article className="course-catalog-card">
      <header className="course-catalog-card-header">
        <p className="course-catalog-card-level">{level}</p>
        <h3>{title}</h3>
      </header>

      <div className="course-catalog-card-body">
        <p className="course-catalog-card-description">{description}</p>

        <ul className="course-catalog-card-meta-list">
          {weeks ? (
            <li>
              <Clock3 size={18} aria-hidden="true" />
              <span>{weeks}</span>
            </li>
          ) : null}
          <li>
            <CalendarDays size={18} aria-hidden="true" />
            <span>{startDate}</span>
          </li>
          <li>
            <MapPin size={18} aria-hidden="true" />
            <span>{location}</span>
          </li>
          <li>
            <UsersRound size={18} aria-hidden="true" />
            <span>{courseTypeLabel}</span>
          </li>
        </ul>

        <Link to={detailsUrl} className="button course-catalog-card-button">
          Learn More
        </Link>
      </div>
    </article>
  );
}
