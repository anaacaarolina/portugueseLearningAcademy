import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRedirectHome = () => {
    navigate("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fullName = formData.get("fullName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      if (!response.ok) {
        let backendMessage = "Unable to create your account. Please try again.";

        try {
          const data = await response.json();
          if (typeof data?.detail === "string") {
            backendMessage = data.detail;
          }
        } catch {
          // Fall back to default message when response has no JSON body.
        }

        throw new Error(backendMessage);
      }

      navigate("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
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
            {errorMessage ? <p className="register-form__error-msg">{errorMessage}</p> : null}

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
                I agree to the <a className="register-form__checkbox-text-link">terms and conditions</a> and <a className="register-form__checkbox-text-link">privacy policy</a>
              </p>
            </label>

            <button type="submit" className="register-form__submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="register-form__signin-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
