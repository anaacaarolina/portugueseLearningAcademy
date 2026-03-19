import { createElement } from "react";
import "./CourseDetailCard.css";

export default function CourseDetailCard({ icon, title, text }) {
  return (
    <article className="course-detail-card">
      <span className="course-detail-card-icon-circle">
        {createElement(icon, { className: "course-detail-card-icon" })}
      </span>
      <h3 className="course-detail-card-title">{title}</h3>
      <p className="course-detail-card-text">{text}</p>
    </article>
  );
}
