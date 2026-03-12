import "./Header.css";
import logo from "../../assets/logo.webp";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import "../Button/Button.css";

export default function Header() {
  return (
    <div className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand">
          <img src={logo} className="navbar-icon" />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/courses" className="nav-link" aria-current="page">
                Courses
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/fun-facts" className="nav-link">
                Fun Facts
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="nav-link">
                <User className="nav-icon" size="1em" aria-hidden="true" />
                <span>Login</span>
              </Link>
            </li>
            <Link to="/enrollment" className="button nav-item-button">
              Get Started
            </Link>
          </ul>
        </div>
      </div>
    </div>
  );
}
