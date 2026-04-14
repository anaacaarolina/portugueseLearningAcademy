import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeClosed } from "lucide-react";
import { useState } from "react";
import SocialAuthPanel from "../../../components/Auth/SocialAuthPanel/SocialAuthPanel";
import { getDashboardPathByRole } from "../../../utils/auth";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRedirectHome = () => {
    navigate("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const rememberMe = formData.get("terms") === "on";

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const payload = new URLSearchParams({
        username: email,
        password,
      });

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      if (!response.ok) {
        let backendMessage = "Unable to sign in. Please check your credentials.";

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

      const data = await response.json();
      const storage = rememberMe ? localStorage : sessionStorage;

      localStorage.removeItem("access_token");
      localStorage.removeItem("token_type");
      localStorage.removeItem("auth_role");
      localStorage.removeItem("has_active_enrollment");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("token_type");
      sessionStorage.removeItem("auth_role");
      sessionStorage.removeItem("has_active_enrollment");

      storage.setItem("access_token", data.access_token);
      storage.setItem("token_type", data.token_type);
      storage.setItem("auth_role", data.user_role || "student");
      storage.setItem("has_active_enrollment", String(Boolean(data.has_active_enrollment)));

      const dashboardPath = getDashboardPathByRole(data.user_role || "student") || "/";
      navigate(dashboardPath);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {errorMessage ? <p className="login-form__error-msg">{errorMessage}</p> : null}

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
                <input id="login-terms" name="terms" type="checkbox" />
                <span className="login-form__checkmark" aria-hidden="true"></span>
                <span className="login-form__checkbox-text">Remember Me</span>
              </label>
              <p className="login-password-reset">Forgot your password?</p>
            </div>

            <button type="submit" className="login-form__submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
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
