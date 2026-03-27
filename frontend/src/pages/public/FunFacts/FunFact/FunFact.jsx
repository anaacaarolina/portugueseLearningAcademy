import "./FunFact.css";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function FunFact() {
  const keyPoints = ["The word bica is commonly used in Lisbon for a small espresso-style coffee.", "Coffee culture in Portugal is social and fast, often enjoyed standing at the counter.", "A bica is usually stronger and shorter than the average filter coffee.", "Ordering coffee like a local helps learners connect with daily language habits."];

  const relatedFacts = [
    {
      id: 1,
      title: "Fado Is More Than Music",
      to: "/fun-fact",
    },
    {
      id: 2,
      title: "Portuguese Festivals Fill the Streets Every Summer",
      to: "/fun-fact",
    },
  ];

  return (
    <div className="fun-fact-page">
      <section className="fun-fact-hero-section">
        <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80" alt="Portuguese espresso on a table" className="fun-fact-hero-image" />
        <div className="fun-fact-hero-overlay" />
        <div className="fun-fact-hero-content">
          <p className="fun-fact-hero-pill">Culture</p>
          <h1>Coffee in Portugal Is Usually Called Bica</h1>
        </div>
      </section>

      <section className="fun-fact-back-link-section">
        <Link to="/fun-facts" className="fun-fact-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Fun Facts
        </Link>
      </section>
      <div className="fun-fact-info-sections">
        <section className="fun-fact-content-section">
          <p>In many Portuguese cafes, especially in Lisbon, people do not usually ask for an espresso. Instead, they ask for a bica. It is a small, strong coffee that is part of daily rhythm, from early mornings to short breaks during the afternoon.</p>
          <p>Coffee moments in Portugal are also cultural moments. Friends meet for a quick bica before work, colleagues pause for one between tasks, and families often end meals with coffee and conversation. Learning this word is not only vocabulary, it is a direct path into everyday local habits.</p>
        </section>

        <section className="fun-fact-key-points-section">
          <h2>
            <BookOpen size={20} aria-hidden="true" />
            Key Points
          </h2>
          <ul className="fun-fact-key-points-list">
            {keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="fun-fact-did-you-know-section">
          <h2>Did you know?</h2>
          <p>The popular saying that explains bica as an acronym for "Beba Isto Com Acucar" is famous, but historians still debate if that is the true origin. Either way, everyone recognizes the word today.</p>
        </section>

        <section className="fun-fact-related-section">
          <h2>Related Fun Facts</h2>
          <div className="fun-fact-related-grid">
            {relatedFacts.map((fact) => (
              <Link key={fact.id} to={fact.to} className="fun-fact-related-card-button">
                <h3>{fact.title}</h3>
                <span className="fun-fact-catalog-card-read-more">
                  Read More
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
