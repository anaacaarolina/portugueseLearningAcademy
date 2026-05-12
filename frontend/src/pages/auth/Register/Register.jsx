import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, X } from "lucide-react";
import { useMemo, useState } from "react";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [formError, setFormError] = useState("");
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
    []
  );

  const handleRedirectHome = () => {
    navigate("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.target);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const termsAccepted = formData.get("terms") === "on";

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setFormError("You must accept the terms and privacy policy to continue.");
      return;
    }

    const response = await fetch(`${apiBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        termsAccepted,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setFormError(payload?.detail || "Registration failed. Please try again.");
      return;
    }

    navigate("/");
  };

  return (
    <section className="register">
      <div className="register-card">
        <div className="register-card__social-side">
          <SocialAuthPanel title="Welcome aboard!" subtitle="Sign up to begin this journey" onProviderClick={handleRedirectHome} />
        </div>

        <div className="register-card__form-side">
          <div className="register-divider" aria-hidden="true">
            <span>Or continue with email</span>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <label htmlFor="register-fullname">
              Full name <span className="register-required-star">*</span>
            </label>
            <input id="register-fullname" name="fullName" type="text" placeholder="John Doe" required />

            <label htmlFor="register-email">
              Email <span className="register-required-star">*</span>
            </label>
            <input id="register-email" name="email" type="email" placeholder="you@example.com" required />

            <label htmlFor="register-password">
              Password <span className="register-required-star">*</span>
            </label>
            <div className="register-password-input-wrapper">
              <input id="register-password" name="password" type={showPassword ? "text" : "password"} placeholder="**********" required />
              <button type="button" className="register-password-toggle-btn" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label htmlFor="register-confirm-password">
              Confirm password <span className="register-required-star">*</span>
            </label>
            <div className="register-password-input-wrapper">
              <input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="**********" required />
              <button type="button" className="register-password-toggle-btn" onClick={() => setShowConfirmPassword((prev) => !prev)} aria-label={showConfirmPassword ? "Hide password" : "Show password"} aria-pressed={showConfirmPassword}>
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="register-form__checkbox" htmlFor="register-terms">
              <input id="register-terms" name="terms" type="checkbox" required />
              <span className="register-form__checkmark" aria-hidden="true"></span>
              <p className="register-form__checkbox-text">
                I agree to the{" "}
                <button
                  type="button"
                  className="register-form__checkbox-text-link"
                  onClick={() => setActiveModal("terms")}
                >
                  terms and conditions
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  className="register-form__checkbox-text-link"
                  onClick={() => setActiveModal("privacy")}
                >
                  privacy policy
                </button>
              </p>
            </label>

            {formError ? <p className="register-form__error">{formError}</p> : null}

            <button type="submit" className="register-form__submit-btn">
              Sign up
            </button>
          </form>

          <p className="register-form__signin-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      {activeModal ? (
        <div className="register-modal" role="dialog" aria-modal="true" aria-labelledby="register-modal-title">
          <div className="register-modal__backdrop" onClick={() => setActiveModal(null)} />
          <div className="register-modal__content">
            <button
              type="button"
              className="register-modal__close"
              aria-label="Close"
              onClick={() => setActiveModal(null)}
            >
              <X size={18} />
            </button>

            {activeModal === "terms" ? (
              <div className="register-modal__body">
                <h2 id="register-modal-title">Terms and Conditions (Portugal)</h2>
                <p className="register-modal__disclaimer">
                  Disclaimer: This is a placeholder summary for review by legal counsel and should not be treated as
                  legal advice.
                </p>
                <h3>1. About this service</h3>
                <p>
                  Portuguese Learning Academy provides online and in-person Portuguese language courses, trial lessons,
                  and related learning materials ("Services"). By creating an account, you agree to these terms.
                </p>
                <h3>2. Eligibility and accounts</h3>
                <p>
                  You must be at least 16 years old to create an account. You are responsible for keeping your
                  credentials secure and for all activity on your account.
                </p>
                <h3>3. Enrollments and payments</h3>
                <p>
                  Course availability, schedules, and pricing are shown before purchase. Payments are required in
                  advance unless otherwise stated. If a class is cancelled by us, we will reschedule or refund
                  according to our cancellation policy.
                </p>
                <h3>4. Cancellations and rescheduling</h3>
                <p>
                  You may reschedule or cancel lessons within the limits shown at booking. Late cancellations may be
                  treated as a used lesson. We will notify you of policy changes in advance.
                </p>
                <h3>5. Acceptable use</h3>
                <p>
                  Do not misuse the Services, interfere with other users, or upload unlawful or harmful content. We may
                  suspend or terminate accounts that violate these rules.
                </p>
                <h3>6. Intellectual property</h3>
                <p>
                  All course materials and site content are owned by Portuguese Learning Academy or its licensors. You
                  may use materials only for personal learning and not for redistribution.
                </p>
                <h3>7. Liability and warranties</h3>
                <p>
                  The Services are provided "as is" and "as available". To the extent permitted by Portuguese law, we
                  are not liable for indirect or consequential damages.
                </p>
                <h3>8. Governing law</h3>
                <p>
                  These terms are governed by the laws of Portugal. Any disputes are subject to the courts of Portugal.
                </p>
                <h3>9. Contact</h3>
                <p>
                  For questions, contact us at contact@portugueselearningacademy.com.
                </p>
              </div>
            ) : (
              <div className="register-modal__body">
                <h2 id="register-modal-title">Privacy Policy (Portugal)</h2>
                <p className="register-modal__disclaimer">
                  Disclaimer: This is a placeholder summary for review by legal counsel and should not be treated as
                  legal advice.
                </p>
                <h3>1. Data controller</h3>
                <p>
                  Portuguese Learning Academy is the data controller for personal data processed in connection with the
                  Services.
                </p>
                <h3>2. Data we collect</h3>
                <p>
                  We collect account data (name, email, password hash), optional profile data (phone, address), course
                  enrollments, payment records, and usage data needed to operate the Services.
                </p>
                <h3>3. Legal bases (GDPR)</h3>
                <p>
                  We process data to perform the contract (service delivery), to comply with legal obligations, for
                  legitimate interests (security and service improvement), and with your consent where required (for
                  example, marketing).
                </p>
                <h3>4. How we use data</h3>
                <p>
                  We use personal data to create your account, deliver lessons, manage payments, provide support, and
                  improve our Services.
                </p>
                <h3>5. Sharing and transfers</h3>
                <p>
                  We share data with service providers (hosting, payments, email) under data processing agreements. We
                  do not sell personal data. If data is transferred outside the EEA, we use appropriate safeguards.
                </p>
                <h3>6. Retention</h3>
                <p>
                  We retain data only as long as necessary for the purposes described or to meet legal requirements.
                </p>
                <h3>7. Your rights</h3>
                <p>
                  You have the right to access, rectify, erase, restrict, or object to processing, and to data
                  portability. You may withdraw consent at any time. You can also lodge a complaint with the CNPD.
                </p>
                <h3>8. Security</h3>
                <p>
                  We apply technical and organizational measures to protect your data, including password hashing and
                  access controls.
                </p>
                <h3>9. Contact</h3>
                <p>
                  For privacy inquiries, contact us at privacy@portugueselearningacademy.com.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
