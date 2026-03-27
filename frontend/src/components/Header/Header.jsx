import "./Header.css";
import logo from "../../assets/logo.webp";
import { User } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import "../Button/Button.css";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <img src={logo} className="navbar-icon" alt="Portuguese Learning Academy logo" />
        </Link>
        <button className={`navbar-toggler ${isMenuOpen ? "is-open" : ""}`} type="button" aria-controls="navbarSupportedContent" aria-expanded={isMenuOpen} aria-label="Toggle navigation" onClick={handleToggleMenu}>
          <span className="navbar-toggler-lines" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <div className={`navbar-menu navbar-collapse ${isMenuOpen ? "is-open" : ""}`} id="navbarSupportedContent">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/courses" className="nav-link" aria-current="page" onClick={closeMenu}>
                Courses
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/fun-facts" className="nav-link" onClick={closeMenu}>
                Fun Facts
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/admin-dashboard" className="nav-link" onClick={closeMenu}>
                Admin
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className="nav-link" onClick={closeMenu}>
                <User className="nav-icon" size="1em" aria-hidden="true" />
                <span>Login</span>
              </Link>
            </li>
            <Link to="/register" className="button nav-item-button" onClick={closeMenu}>
              Get Started
            </Link>
          </ul>
        </div>
      </div>
    </div>
  );
}
