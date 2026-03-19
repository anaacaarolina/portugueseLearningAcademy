import { Link, useNavigate } from "react-router-dom";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

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
            <label htmlFor="register-fullname">Full name</label>
            <input id="register-fullname" name="fullName" type="text" required />

            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" required />

            <label htmlFor="register-password">Password</label>
            <input id="register-password" name="password" type="password" required />

            <label htmlFor="register-confirm-password">Confirm password</label>
            <input id="register-confirm-password" name="confirmPassword" type="password" required />

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
