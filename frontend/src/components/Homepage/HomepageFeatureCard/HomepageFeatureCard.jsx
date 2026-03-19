import "./HomepageFeatureCard.css";

export default function HomepageFeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="feature-card">
      <Icon className="feature-card-icon" />
      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-text">{text}</p>
    </div>
  );
}
