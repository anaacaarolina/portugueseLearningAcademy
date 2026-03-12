import "./Footer.css";
import footer_logo from "../../assets/footer_logo.webp";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="container-footer">
      <div className="container-fluid">
        <footer className="site-footer">
          <div className="row footer-row">
            <div className="footer-col logo-col mb-3">
              <Link to="/">
                <img src={footer_logo} alt="Portuguese Academy logo" />
              </Link>
            </div>

            <div className="footer-col social-col mb-3">
              <h4>Follow Us</h4>
              <ul className="nav flex">
                <li className="nav-item mb-2">
                  <a href="https://facebook.com" className="nav-link" aria-label="Facebook">
                    <FaFacebook />
                  </a>
                </li>
                <li className="nav-item mb-2">
                  <a href="https://instagram.com" className="nav-link" aria-label="Instagram">
                    <FaInstagram />
                  </a>
                </li>
                <li className="nav-item mb-2">
                  <a href="https://x.com" className="nav-link" aria-label="X">
                    <FaXTwitter />
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-col contact-col mb-3">
              <ul className="nav flex-column contact-list">
                <li className="nav-item mb-2">
                  <MapPin />
                  <p className="nav-info">R. Diogo Macedo 166 3D, 4400-107 Vila Nova de Gaia</p>
                </li>
                <li className="nav-item mb-2">
                  <Phone />
                  <p className="nav-info">+912 345 678</p>
                </li>
                <li className="nav-item mb-2">
                  <Mail />
                  <p className="nav-info">email@email.com</p>
                </li>
              </ul>
            </div>
          </div>

          <hr />
          <p className="copyright">© 2026 Portuguese Academy. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
