import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import HourPackageCard from "../../../../components/Enrollment/HourPackageCard/HourPackageCard";
import "./Enrollment.css";

const euroFormatter = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return euroFormatter.format(0);
  }

  return euroFormatter.format(amount);
}

function formatHours(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "0";
  }

  if (Number.isInteger(amount)) {
    return String(amount);
  }

  return amount.toFixed(1);
}

function getClassTypeLabel(type) {
  return type === "individual" ? "Individual Class" : "Group Class";
}

export default function Enrollment() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [hourPackages, setHourPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedClassType, setSelectedClassType] = useState("group");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedPackageId, setSelectedPackageId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadEnrollmentData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [coursesResponse, hourPackagesResponse] = await Promise.all([fetch(`${apiBaseUrl}/courses`), fetch(`${apiBaseUrl}/hour-packages`)]);

        if (!coursesResponse.ok || !hourPackagesResponse.ok) {
          throw new Error("Unable to load enrollment data");
        }

        const [coursesData, hourPackagesData] = await Promise.all([coursesResponse.json(), hourPackagesResponse.json()]);
        if (!isMounted) {
          return;
        }

        const safeCoursesRaw = Array.isArray(coursesData) ? coursesData : Array.isArray(coursesData?.courses) ? coursesData.courses : [];
        const activeCourses = safeCoursesRaw.filter((course) => course?.status === "active");
        const safeCourses = (activeCourses.length > 0 ? activeCourses : safeCoursesRaw).sort((a, b) => {
          const aType = a?.type ?? "";
          const bType = b?.type ?? "";
          const aTitle = a?.title ?? "";
          const bTitle = b?.title ?? "";

          return `${aType}-${aTitle}`.localeCompare(`${bType}-${bTitle}`);
        });

        const safePackagesRaw = Array.isArray(hourPackagesData) ? hourPackagesData : [];
        const activePackages = safePackagesRaw.filter((hourPackage) => hourPackage?.is_active !== false);
        const safeHourPackages = (activePackages.length > 0 ? activePackages : safePackagesRaw).sort((a, b) => {
          const aHours = Number(a?.hours) || 0;
          const bHours = Number(b?.hours) || 0;
          return aHours - bHours;
        });

        const availableTypes = Array.from(new Set(safeCourses.map((course) => course?.type).filter((type) => Boolean(type))));
        const defaultType = availableTypes.includes("group") ? "group" : availableTypes[0] || "group";
        const firstCourseForType = safeCourses.find((course) => course?.type === defaultType) || safeCourses[0] || null;
        const firstPackage = safeHourPackages[0] || null;

        setCourses(safeCourses);
        setHourPackages(safeHourPackages);
        setSelectedClassType(defaultType);
        setSelectedCourseId(firstCourseForType?.id ?? null);
        setSelectedPackageId(firstPackage?.id ?? null);
      } catch {
        if (isMounted) {
          setCourses([]);
          setHourPackages([]);
          setSelectedCourseId(null);
          setSelectedPackageId(null);
          setErrorMessage("Could not load enrollment options from the API.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadEnrollmentData();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const classTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(new Set(courses.map((course) => course?.type).filter((type) => Boolean(type))));
    return uniqueTypes.map((type) => ({
      value: type,
      label: getClassTypeLabel(type),
    }));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => course?.type === selectedClassType);
  }, [courses, selectedClassType]);

  const courseOptions = useMemo(() => {
    return filteredCourses.map((course) => {
      const level = course?.level ? ` (${course.level})` : "";
      const title = course?.title || "Untitled course";

      return {
        value: course.id,
        label: `${title}${level}`,
      };
    });
  }, [filteredCourses]);

  useEffect(() => {
    if (courseOptions.length === 0) {
      setSelectedCourseId(null);
      return;
    }

    const selectedStillValid = courseOptions.some((option) => option.value === selectedCourseId);
    if (!selectedStillValid) {
      setSelectedCourseId(courseOptions[0].value);
    }
  }, [courseOptions, selectedCourseId]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || null;
  const selectedHourPackage = hourPackages.find((hourPackage) => hourPackage.id === selectedPackageId) || null;

  const handleBuy = (event) => {
    event.preventDefault();
    if (!selectedCourse || !selectedHourPackage) {
      return;
    }

    navigate("/payment", {
      state: {
        selectedCourse,
        selectedClassType,
        selectedHourPackage,
      },
    });
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
            <Select inputId="enrollment-select-course" className="enrollment-select" classNamePrefix="react-select" value={courseOptions.find((option) => option.value === selectedCourseId) || null} onChange={(option) => setSelectedCourseId(option?.value ?? null)} options={courseOptions} isSearchable={false} isDisabled={isLoading || courseOptions.length === 0} placeholder={isLoading ? "Loading courses..." : "No courses available"} />
          </div>

          <div className="enrollment-select-field">
            <label className="enrollment-select-label" htmlFor="enrollment-select-class-type">
              Class Type
            </label>
            <Select inputId="enrollment-select-class-type" className="enrollment-select" classNamePrefix="react-select" value={classTypeOptions.find((option) => option.value === selectedClassType) || null} onChange={(option) => setSelectedClassType(option?.value ?? "group")} options={classTypeOptions} isSearchable={false} isDisabled={isLoading || classTypeOptions.length === 0} placeholder={isLoading ? "Loading class types..." : "No class types available"} />
          </div>

          <div className="enrollment-hour-packages-grid">
            {isLoading ? <p className="enrollment-status-message">Loading plans...</p> : null}
            {!isLoading && errorMessage ? <p className="enrollment-status-message">{errorMessage}</p> : null}
            {!isLoading && !errorMessage && hourPackages.length === 0 ? <p className="enrollment-status-message">No hour packages available right now.</p> : null}
            {hourPackages.map((hourPackage) => (
              <HourPackageCard key={hourPackage.id} totalHours={formatHours(hourPackage.hours)} totalPrice={formatCurrency(hourPackage.price)} pricePerHour={formatCurrency(Number(hourPackage.hours) > 0 ? Number(hourPackage.price) / Number(hourPackage.hours) : 0)} isPopular={Boolean(hourPackage.is_popular)} isSelected={selectedPackageId === hourPackage.id} onSelect={() => setSelectedPackageId(hourPackage.id)} />
            ))}
          </div>

          <button type="button" className="enrollment-buy-button" onClick={handleBuy} disabled={isLoading || Boolean(errorMessage) || !selectedCourseId || !selectedPackageId}>
            Buy Now
          </button>
        </div>
      </section>
    </div>
  );
}
