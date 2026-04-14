import { useEffect, useMemo, useState } from "react";

const emptyHourPackage = {
  name: "",
  hours: "",
  price: "",
  is_trial: false,
  is_active: true,
  is_popular: false,
};

function normalizeHourPackage(hourPackage) {
  return {
    ...emptyHourPackage,
    ...(hourPackage ?? {}),
    is_trial: hourPackage?.is_trial ?? hourPackage?.isTrial ?? false,
    is_active: hourPackage?.is_active ?? hourPackage?.isActive ?? true,
    is_popular: hourPackage?.is_popular ?? hourPackage?.isPopular ?? false,
  };
}

export default function HourPackageForm({ hourPackage, onSubmit }) {
  const draftHourPackage = useMemo(() => normalizeHourPackage(hourPackage), [hourPackage]);
  const [nameValue, setNameValue] = useState(draftHourPackage.name);
  const [hoursValue, setHoursValue] = useState(draftHourPackage.hours);
  const [priceValue, setPriceValue] = useState(draftHourPackage.price);
  const [isTrialValue, setIsTrialValue] = useState(Boolean(draftHourPackage.is_trial));
  const [isActiveValue, setIsActiveValue] = useState(Boolean(draftHourPackage.is_active));
  const [isPopularValue, setIsPopularValue] = useState(Boolean(draftHourPackage.is_popular));

  useEffect(() => {
    setNameValue(draftHourPackage.name);
    setHoursValue(draftHourPackage.hours);
    setPriceValue(draftHourPackage.price);
    setIsTrialValue(Boolean(draftHourPackage.is_trial));
    setIsActiveValue(Boolean(draftHourPackage.is_active));
    setIsPopularValue(Boolean(draftHourPackage.is_popular));
  }, [draftHourPackage]);

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: nameValue.trim(),
      hours: Number(hoursValue),
      price: Number(priceValue),
      is_trial: isTrialValue,
      is_active: isActiveValue,
      is_popular: isPopularValue,
    };

    onSubmit?.(payload);
  }

  return (
    <form id="admin-hour-package-form" onSubmit={handleSubmit}>
      <div className="admin-content-form-section-title">Package Information</div>
      <div className="admin-content-form-grid two-columns">
        <div className="span-two-columns">
          <label htmlFor="admin-hour-package-name">Name</label>
          <input id="admin-hour-package-name" type="text" value={nameValue} required onChange={(event) => setNameValue(event.target.value)} placeholder="Starter Pack" />
        </div>

        <div>
          <label htmlFor="admin-hour-package-hours">Hours</label>
          <input id="admin-hour-package-hours" type="number" min="0" step="0.1" value={hoursValue} required onChange={(event) => setHoursValue(event.target.value)} />
        </div>

        <div>
          <label htmlFor="admin-hour-package-price">Price (EUR)</label>
          <input id="admin-hour-package-price" type="number" min="0" step="0.01" value={priceValue} required onChange={(event) => setPriceValue(event.target.value)} />
        </div>

        <div className="span-two-columns">
          <label className="admin-content-checkbox" htmlFor="admin-hour-package-is-trial">
            <input id="admin-hour-package-is-trial" type="checkbox" checked={isTrialValue} onChange={(event) => setIsTrialValue(event.target.checked)} />
            <span className="admin-content-checkbox-checkmark" aria-hidden="true"></span>
            <span className="admin-content-checkbox-text">Trial package</span>
          </label>
        </div>

        <div className="span-two-columns">
          <label className="admin-content-checkbox" htmlFor="admin-hour-package-is-popular">
            <input id="admin-hour-package-is-popular" type="checkbox" checked={isPopularValue} onChange={(event) => setIsPopularValue(event.target.checked)} />
            <span className="admin-content-checkbox-checkmark" aria-hidden="true"></span>
            <span className="admin-content-checkbox-text">Most popular</span>
          </label>
        </div>

        <div className="span-two-columns">
          <label className="admin-content-checkbox" htmlFor="admin-hour-package-is-active">
            <input id="admin-hour-package-is-active" type="checkbox" checked={isActiveValue} onChange={(event) => setIsActiveValue(event.target.checked)} />
            <span className="admin-content-checkbox-checkmark" aria-hidden="true"></span>
            <span className="admin-content-checkbox-text">Active</span>
          </label>
        </div>
      </div>
    </form>
  );
}
