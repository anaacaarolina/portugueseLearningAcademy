import { Clock3 } from "lucide-react";
import "./HourPackageCard.css";

export default function HourPackageCard({ totalHours, totalPrice, pricePerHour, isPopular = false, isSelected = false, onSelect }) {
  return (
    <button type="button" className={`hour-package-card ${isPopular ? "hour-package-card--popular" : ""} ${isSelected ? "hour-package-card--selected" : ""}`} onClick={onSelect} aria-pressed={isSelected}>
      {isPopular ? <span className="hour-package-card__badge">Most Popular</span> : null}
      <div className="hour-package-card-info">
        <div className="hour-package-card-hours-price">
          <div className="hour-package-card__hours-row">
            <Clock3 size={18} aria-hidden="true" />
            <p className="hour-package-card__hours">{totalHours} hours</p>
          </div>
          <p className="hour-package-card__price">{totalPrice}</p>
        </div>
        <p className="hour-package-card__per-hour">{pricePerHour} / hour</p>
      </div>
    </button>
  );
}
