import "./Button.css";

export default function Button({ text, className = "" }) {
  return <a className={`button ${className}`}>{text}</a>;
}
