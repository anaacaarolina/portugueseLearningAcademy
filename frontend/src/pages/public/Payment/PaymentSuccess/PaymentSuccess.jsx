import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import "./PaymentSuccess.css";

export default function PaymentSuccess() {
  return (
    <section className="payment-result payment-result-success">
      <div className="payment-result-card">
        <CheckCircle2 className="payment-result-icon" />
        <h1>Payment Successful</h1>
        <p>Your payment was confirmed. Your package will be available shortly.</p>

        <div className="payment-result-actions">
          <Link to="/student-dashboard" className="payment-result-button">
            Go to Dashboard
          </Link>
          <Link to="/courses" className="payment-result-button payment-result-button-secondary">
            Browse Courses
          </Link>
        </div>
      </div>
    </section>
  );
}
