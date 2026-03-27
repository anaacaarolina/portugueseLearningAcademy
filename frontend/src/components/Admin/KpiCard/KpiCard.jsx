import { createElement } from "react";
import "./KpiCard.css";

export default function KpiCard({ icon, value, title }) {
  return (
    <article className="admin-kpi-card">
      <span className="admin-kpi-card-icon-wrapper">{createElement(icon, { className: "admin-kpi-card-icon", "aria-hidden": "true" })}</span>
      <p className="admin-kpi-card-value">{value}</p>
      <p className="admin-kpi-card-title">{title}</p>
    </article>
  );
}
