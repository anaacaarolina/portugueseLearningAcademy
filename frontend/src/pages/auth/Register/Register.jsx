import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRedirectHome = () => {
    navigate("/");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
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
              <span className="register-form__checkbox-text">I agree to the terms and conditions and privacy policy</span>
            </label>

            <button type="submit" className="register-form__submit-btn">
              Sign up
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
