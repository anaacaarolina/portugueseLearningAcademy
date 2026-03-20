import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import HourPackageCard from "../../../../components/Enrollment/HourPackageCard/HourPackageCard";
import "./Enrollment.css";

export default function Enrollment() {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState("beginner-group");
  const [selectedClassType, setSelectedClassType] = useState("group");
  const [selectedPackageId, setSelectedPackageId] = useState(2);

  const courseOptions = [
    { value: "beginner-group", label: "Portuguese A1-A2 - Group Course" },
    { value: "intermediate-group", label: "Portuguese B1-B2 - Group Course" },
    { value: "advanced-group", label: "Portuguese C1-C2 - Group Course" },
    { value: "business-individual", label: "Business Portuguese - Individual" },
  ];

  const classTypeOptions = [
    { value: "group", label: "Group Class" },
    { value: "individual", label: "Individual Class" },
  ];

  const hourPackages = [
    { id: 1, totalHours: 10, totalPrice: "€139.9", pricePerHour: "€13.99", isPopular: true },
    { id: 2, totalHours: 20, totalPrice: "€219.8", pricePerHour: "€10.99" },
    { id: 3, totalHours: 30, totalPrice: "€269.7", pricePerHour: "€8.99" },
    { id: 4, totalHours: 50, totalPrice: "€349.5", pricePerHour: "€6.99" },
  ];

  const handleBuy = (event) => {
    event.preventDefault();
    navigate("/payment");
  };

  return (
    <div className="enrollment-page">
      <section className="enrollment-intro-section">
        <h1 className="enrollment-title">Enroll Now</h1>
        <p className="enrollment-description">Choose your course, class type, and the perfect hour package for your learning journey.</p>
      </section>

      <section className="enrollment-plan-section">
        <div className="enrollment-plan-card">
          <h2>Choose your Plan</h2>

          <div className="enrollment-select-field">
            <label className="enrollment-select-label" htmlFor="enrollment-select-course">
              Learning Course
            </label>
            <Select inputId="enrollment-select-course" className="enrollment-select" classNamePrefix="react-select" value={courseOptions.find((option) => option.value === selectedCourse)} onChange={(option) => setSelectedCourse(option.value)} options={courseOptions} isSearchable={false} />
          </div>

          <div className="enrollment-select-field">
            <label className="enrollment-select-label" htmlFor="enrollment-select-class-type">
              Class Type
            </label>
            <Select inputId="enrollment-select-class-type" className="enrollment-select" classNamePrefix="react-select" value={classTypeOptions.find((option) => option.value === selectedClassType)} onChange={(option) => setSelectedClassType(option.value)} options={classTypeOptions} isSearchable={false} />
          </div>

          <div className="enrollment-hour-packages-grid">
            {hourPackages.map((hourPackage) => (
              <HourPackageCard key={hourPackage.id} totalHours={hourPackage.totalHours} totalPrice={hourPackage.totalPrice} pricePerHour={hourPackage.pricePerHour} isPopular={hourPackage.isPopular} isSelected={selectedPackageId === hourPackage.id} onSelect={() => setSelectedPackageId(hourPackage.id)} />
            ))}
          </div>

          <button type="button" className="enrollment-buy-button" onClick={handleBuy}>
            Buy Now
          </button>
        </div>
      </section>
    </div>
  );
}
