import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import "./Login.css";

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
}
export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleRedirectHome = () => {
    navigate("/");
  };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);

        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: formData.get("email"),
                password: formData.get("password"),
            }),
        });

        const user = await res.json();

        localStorage.setItem("user", JSON.stringify(user));

        navigate("/");
    };;

    

  return (
    <section className="login">
      <div className="login-card">
        <div className="login-card__social-side">
          <SocialAuthPanel title="Welcome back!" subtitle="Sign in to continue your learning" onProviderClick={handleRedirectHome} />
        </div>

        <div className="login-card__form-side">
          <div className="login-divider" aria-hidden="true">
            <span>Or continue with email</span>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" placeholder="youremail@example.com" required />

            <label htmlFor="login-password">Password</label>
            <div className="login-password-input-wrapper">
              <input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="**********" required />
              <button type="button" className="login-password-toggle-btn" onClick={() => setShowPassword((prev) => !prev)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                {showPassword ? <EyeClosed size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="login-checkbox-password-reset">
              <label className="login-form__checkbox" htmlFor="login-terms">
                <input id="login-terms" name="terms" type="checkbox" required />
                <span className="login-form__checkmark" aria-hidden="true"></span>
                <span className="login-form__checkbox-text">Remember Me</span>
              </label>
              <p className="login-password-reset">Forgot your password?</p>
            </div>

            <button type="submit" className="login-form__submit-btn">
              Sign in
            </button>
          </form>

          <p className="login-form__register-text">
            Don&apos;t have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
