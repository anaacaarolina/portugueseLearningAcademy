import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./FunFactCatalogCard.css";

export default function FunFactCatalogCard({ image, imageAlt, category, title, excerpt, to = "/fun-facts" }) {
  return (
    <article className="fun-fact-catalog-card">
      <img src={image} alt={imageAlt || title || "Fun fact image"} className="fun-fact-catalog-card-image" />

      <div className="fun-fact-catalog-card-content">
        <p className="fun-fact-catalog-card-category">{category}</p>
        <h3>{title}</h3>
        <p className="fun-fact-catalog-card-excerpt">{excerpt}</p>

        <Link to={to} className="fun-fact-catalog-card-read-more">
          Read More
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
