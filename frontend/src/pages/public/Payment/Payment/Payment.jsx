import "./Payment.css";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Select from "react-select";
import countryList from "react-select-country-list";
import { CreditCard } from "lucide-react";
import { FaPaypal } from "react-icons/fa";

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
  const location = useLocation();
  const checkoutState = location.state || {};
  const selectedCourse = checkoutState.selectedCourse || null;
  const selectedClassType = checkoutState.selectedClassType || selectedCourse?.type || null;
  const selectedHourPackage = checkoutState.selectedHourPackage || null;
  const countryOptions = useMemo(() => countryList().getData(), []);

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [billingData, setBillingData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });
  const [cardData, setCardData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = Number(selectedHourPackage?.price) || 0;
  const tax = subtotal * 0.23;
  const total = subtotal + tax;

  const handleBillingChange = (event) => {
    const { name, value } = event.target;
    setBillingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    setCardData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <section className="payment">
      <header className="payment-header">
        <h1>Checkout & Payment</h1>
      </header>

      <div className="payment-layout">
        <div className="payment-left-column">
          <section className="payment-panel">
            <h2>Payment Method</h2>
            <div className="payment-method-grid">
              <button type="button" className={`payment-method-card ${paymentMethod === "card" ? "is-selected" : ""}`} onClick={() => setPaymentMethod("card")} aria-pressed={paymentMethod === "card"}>
                <div className="payment-method-icon-title-text">
                  <CreditCard className="payment-method-icon" />
                  <div className="payment-method-title-text">
                    <span className="payment-method-title">Credit / Debit Card</span>
                    <span className="payment-method-text">Visa, MasterCard, Amex</span>
                  </div>
                </div>
              </button>

              <button type="button" className={`payment-method-card ${paymentMethod === "paypal" ? "is-selected" : ""}`} onClick={() => setPaymentMethod("paypal")} aria-pressed={paymentMethod === "paypal"}>
                <div className="payment-method-icon-title-text">
                  <FaPaypal className="payment-method-icon" />{" "}
                  <div className="payment-method-title-text">
                    <span className="payment-method-title">PayPal</span>
                    <span className="payment-method-text">Fast & Secure.</span>{" "}
                  </div>
                </div>
              </button>
            </div>
          </section>

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

          {paymentMethod === "card" ? (
            <section className="payment-panel">
              <h2>Card Details</h2>
              <form className="payment-form" onSubmit={(event) => event.preventDefault()}>
                <label>
                  Cardholder Name
                  <input type="text" name="cardholderName" value={cardData.cardholderName} onChange={handleCardChange} placeholder="Name on Card" aria-label="Cardholder Name" />
                </label>

                <label>
                  Card Number
                  <input type="text" name="cardNumber" value={cardData.cardNumber} onChange={handleCardChange} placeholder="1234 5678 9012 3456" aria-label="Card Number" />
                </label>

                <div className="payment-form-row">
                  <label>
                    Expiry Date
                    <input type="month" name="expiryDate" value={cardData.expiryDate} onChange={handleCardChange} aria-label="Expiry Date" />
                  </label>

                  <label>
                    CVV
                    <input type="password" name="cvv" value={cardData.cvv} onChange={handleCardChange} placeholder="123" maxLength={4} aria-label="CVV" />
                  </label>
                </div>
              </form>
            </section>
          ) : null}
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

          <div className="payment-summary-item">
            <p className="payment-summary-item-field">Price</p>
            <p className="payment-summary-item-option">{formatCurrency(subtotal)}</p>
          </div>

          <hr />

          <div className="payment-total-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          <div className="payment-total-row">
            <span>Tax (23%)</span>
            <strong>{formatCurrency(tax)}</strong>
          </div>

          <hr />

          <div className="payment-total-row payment-grand-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <button type="button" className="payment-complete-button">
            Complete Purchase
          </button>
        </aside>
      </div>
    </section>
  );
}
