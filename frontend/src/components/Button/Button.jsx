import "./Button.css";
import { Link } from "react-router-dom";

export default function Button({ text, className = "", to, href = "#" }) {
  if (to) {
    return (
      <Link to={to} className={`button ${className}`.trim()}>
        {text}
      </Link>
    );
  }

  return <a href={href} className={`button ${className}`.trim()}>{text}</a>;
}
