import "./Payment.css";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Select from "react-select";
import countryList from "react-select-country-list";
import { CreditCard } from "lucide-react";
import { FaPaypal } from "react-icons/fa";
import { getStoredAccessToken } from "../../../../utils/auth";

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
  if (type === "individual") {
    return "Private Classes";
  }

  if (type === "group") {
    return "Group Classes";
  }

  return "Not selected";
}

export default function Payment() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const location = useLocation();
  const checkoutState = location.state || {};
  const selectedCourse = checkoutState.selectedCourse || null;
  const selectedClassType = checkoutState.selectedClassType || selectedCourse?.type || null;
  const selectedHourPackage = checkoutState.selectedHourPackage || null;
  const countryOptions = useMemo(() => countryList().getData(), []);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [billingData, setBillingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const total = Number(selectedHourPackage?.price) || 0;

  const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setBillingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 

  const getAuthenticatedUserId = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const profile = await response.json();
      const id = Number(profile?.id);
      return Number.isFinite(id) ? id : null;
    } catch {
      return null;
    }
  };

  const handleCompletePurchase = async () => {
    if (!selectedHourPackage?.id) {
      setErrorMessage("Please select an hour package before continuing.");
      return;
    }

    if (!selectedCourse?.id) {
      setErrorMessage("Please select a course before continuing.");
      return;
    }

   

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const userId = await getAuthenticatedUserId();
      const response = await fetch(`${apiBaseUrl}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package_id: selectedHourPackage.id,
          course_id: selectedCourse.id,
          user_id: userId,
          email: billingData.email || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = typeof errorData?.detail === "string" ? errorData.detail : "Failed to initiate checkout.";
        throw new Error(detail);
      }

      const data = await response.json();
      if (!data?.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.assign(data.url);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to initiate checkout.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="payment">
      <header className="payment-header">
        <h1>Checkout & Payment</h1>
      </header>

      <div className="payment-layout">
        <div className="payment-left-column">

          <section className="payment-panel">
            <h2>Billing Information</h2>
            <form className="payment-form" onSubmit={(event) => event.preventDefault()}>
              <label>
                Full Name
                <input type="text" name="fullName" value={billingData.fullName} onChange={handleBillingChange} placeholder="John Doe" aria-label="Full Name" />
              </label>

              <label>
                Email
                <input type="email" name="email" value={billingData.email} onChange={handleBillingChange} placeholder="john@example.com" aria-label="Email" />
              </label>

              <label>
                Phone
                <input type="tel" name="phone" value={billingData.phone} onChange={handleBillingChange} placeholder="+351 123 456 789" aria-label="Phone" />
              </label>

              <label>
                Address
                <input type="text" name="address" value={billingData.address} onChange={handleBillingChange} placeholder="Street Address" aria-label="Address" />
              </label>

              <div className="payment-form-row">
                <label>
                  City
                  <input type="text" name="city" value={billingData.city} onChange={handleBillingChange} placeholder="Vila Nova de Gaia" aria-label="City" />
                </label>

                <label>
                  Postal Code
                  <input type="text" name="postalCode" value={billingData.postalCode} onChange={handleBillingChange} placeholder="1000-001" aria-label="Postal Code" />
                </label>
              </div>

              <label className="payment-country-field">
                Country
                <Select options={countryOptions} value={selectedCountry} onChange={setSelectedCountry} classNamePrefix="payment-country-select" placeholder="Select a country" menuPortalTarget={document.body} menuPosition="fixed" />
              </label>
            </form>
          </section>

        
        </div>

        <aside className="payment-summary">
          <h2>Purchase Summary</h2>

          <div className="payment-summary-item">
            <p className="payment-summary-item-field">Selected Course</p>
            <p className="payment-summary-item-option">{selectedCourse?.title || "Not selected"}</p>
          </div>

          <div className="payment-summary-item">
            <p className="payment-summary-item-field">Class Type</p>
            <p className="payment-summary-item-option">{getClassTypeLabel(selectedClassType)}</p>
          </div>

          <div className="payment-summary-item">
            <p className="payment-summary-item-field">Hour Package</p>
            <p className="payment-summary-item-option">{selectedHourPackage ? `${formatHours(selectedHourPackage.hours)} Hours` : "Not selected"}</p>
          </div>
          <hr />
          <div className="payment-total-row payment-grand-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {errorMessage ? <p className="payment-error-message">{errorMessage}</p> : null}

          <button type="button" className="payment-complete-button" onClick={handleCompletePurchase} disabled={isSubmitting || !selectedHourPackage || !selectedCourse}>
            {isSubmitting ? "Redirecting to Stripe..." : "Complete Purchase"}
          </button>
        </aside>
      </div>
    </section>
  );
}
