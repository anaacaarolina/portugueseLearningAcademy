import { CircleX } from "lucide-react";
import { Link } from "react-router-dom";
import "./PaymentCancelled.css";

export default function PaymentCancelled() {
  return (
    <section className="payment-result payment-result-cancelled">
      <div className="payment-result-card">
        <CircleX className="payment-result-icon-cancelled" />
        <h1>Payment Cancelled</h1>
        <p>No charge was made. You can return to checkout whenever you are ready.</p>

        <div className="payment-result-actions">
          <Link to="/enrollment" className="payment-result-button">
            Try Again
          </Link>
          <Link to="/enrollment" className="payment-result-button payment-result-button-secondary">
            Back to Enrollment
          </Link>
        </div>
      </div>
    </section>
  );
}
