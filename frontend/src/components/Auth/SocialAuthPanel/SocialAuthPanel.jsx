import "./SocialAuthPanel.css";
import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";

const defaultProviders = [
  { id: "google", name: "Google" },
  { id: "facebook", name: "Facebook" },
  { id: "apple", name: "Apple" },
];

const providerIcons = {
  google: FaGoogle,
  facebook: FaFacebook,
  apple: FaApple,
};

export default function SocialAuthPanel({ title, subtitle, providers = defaultProviders, onProviderClick }) {
  return (
    <section className="social-auth-panel" aria-label="Social sign up options">
      <h2 className="social-auth-panel__title">{title}</h2>
      <p className="social-auth-panel__subtitle">{subtitle}</p>

      <div className="social-auth-panel__buttons" role="group" aria-label="Social providers">
        {providers.map((provider) => {
          const ProviderIcon = provider.icon ?? providerIcons[provider.id];

          return (
            <button key={provider.id} type="button" className={`social-auth-panel__button social-auth-panel__button--${provider.id}`} onClick={() => onProviderClick(provider.id)}>
              <span className="social-auth-panel__icon" aria-hidden="true">
                {ProviderIcon ? <ProviderIcon /> : provider.initials}
              </span>
              <span className="social-auth-panel__label">Continue with {provider.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
