import "./HomepageTestimonialCard.css";

export default function HomepageTestimonailCard({ rating, comment, name, date }) {
  const renderStars = (rating) => {
    const filled = "★".repeat(rating);
    const empty = "☆".repeat(5 - rating);
    return `${filled}${empty}`;
  };
  return (
    <div className="testimonial-card">
      <p className="testimonial-rating">{renderStars(rating)}</p>
      <p className="testimonial-comment">{comment}</p>
      <div className="testimonial-commenter-info">
        <p className="testimonial-name">{name}</p>
        <p className="testimonial-date">{date}</p>
      </div>
    </div>
  );
}
