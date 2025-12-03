import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import "./LandingSection.css";

const defaultConfig = {
  backgroundColor: "#f0f9ff",
  surfaceColor: "#ffffff",
  textColor: "#0f172a",
  primaryColor: "#0ea5e9",
  secondaryColor: "#0284c7",
  heroTitle: "Expert System Manpower Solutions",
  heroSubtitle: "Your trusted partner for comprehensive workforce management and staffing excellence",
  heroCta: "Register",
  heroLogin: "Login",
  servicesTitle: "Our Services",
  contactTitle: "Ready to Build Your Team?",
  contactButton: "Contact Us Today",
};

const services = [
  {
    icon: "👥",
    title: "Workforce Management",
    text: "Comprehensive workforce planning and optimization solutions to maximize productivity.",
  },
  {
    icon: "🎯",
    title: "Technical Recruitment",
    text: "Specialized recruitment services for developers, engineers, and tech specialists.",
  },
  {
    icon: "🚀",
    title: "Project Teams",
    text: "Build complete project teams with the right mix of skills and experience.",
  },
];

const benefits = [
  "Pre-vetted technical professionals with proven expertise",
  "Rapid deployment to meet urgent project deadlines",
  "Flexible engagement models to suit your needs",
  "Ongoing support and talent management",
  "Cost-effective solutions with no compromise on quality",
];

export default function LandingSection({ config = {} }) {
  const navigate = useNavigate();
  const cfg = useMemo(
    () => ({
      ...defaultConfig,
      ...config,
    }),
    [config]
  );

  const handleMessage = (text, color) => {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${color};
      color: #fff;
      padding: 20px 40px;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      z-index: 1000;
      font-size: 1.1rem;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2600);
  };

  return (
    <div className="landing-root" style={{ backgroundColor: cfg.backgroundColor }}>
      <section
        className="landing-hero"
        style={{
          background: `linear-gradient(135deg, ${cfg.primaryColor} 0%, ${cfg.secondaryColor} 100%)`,
        }}
      >
        <div className="landing-inner">
          <div className="landing-grid">
            <div>
              <h1>{cfg.heroTitle}</h1>
              <p>{cfg.heroSubtitle}</p>
              <div className="landing-actions">
                <button
                  type="button"
                  className="landing-btn primary"
                  onClick={() => navigate("/register")}
                >
                  {cfg.heroCta}
                </button>
                <button
                  type="button"
                  className="landing-btn outline"
                  onClick={() => navigate("/login")}
                >
                  {cfg.heroLogin}
                </button>
              </div>
            </div>
            <div className="landing-illustration">
              <svg width="400" height="400" viewBox="0 0 400 400">
                <g className="person person-1">
                  <circle cx="120" cy="150" r="25" fill="#ffffff" opacity="0.9" />
                  <rect x="105" y="180" width="30" height="50" rx="15" fill="#ffffff" opacity="0.9" />
                </g>
                <g className="person person-2">
                  <circle cx="200" cy="120" r="25" fill="#ffffff" opacity="0.95" />
                  <rect x="185" y="150" width="30" height="50" rx="15" fill="#ffffff" opacity="0.95" />
                </g>
                <g className="person person-3">
                  <circle cx="280" cy="150" r="25" fill="#ffffff" opacity="0.9" />
                  <rect x="265" y="180" width="30" height="50" rx="15" fill="#ffffff" opacity="0.9" />
                </g>
                <g className="person person-4">
                  <circle cx="160" cy="230" r="25" fill="#ffffff" opacity="0.85" />
                  <rect x="145" y="260" width="30" height="50" rx="15" fill="#ffffff" opacity="0.85" />
                </g>
                <g className="person person-5">
                  <circle cx="240" cy="230" r="25" fill="#ffffff" opacity="0.85" />
                  <rect x="225" y="260" width="30" height="50" rx="15" fill="#ffffff" opacity="0.85" />
                </g>

                <line className="connection line-1" x1="200" y1="140" x2="120" y2="165" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                <line className="connection line-2" x1="200" y1="140" x2="280" y2="165" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                <line className="connection line-3" x1="200" y1="170" x2="160" y2="245" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
                <line className="connection line-4" x1="200" y1="170" x2="240" y2="245" stroke="#ffffff" strokeWidth="2" opacity="0.5" />

                <circle cx="200" cy="200" r="35" fill="#ffffff" opacity="0.3" className="hub-circle" />
                <text x="200" y="210" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="bold">
                  HUB
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-inner">
          <h2>{cfg.servicesTitle}</h2>
          <div className="service-grid">
            {services.map((service) => (
              <article
                key={service.title}
                className="service-card"
                style={{ backgroundColor: cfg.surfaceColor, color: cfg.textColor }}
              >
                <div className="service-icon">{service.icon}</div>
                <h3 style={{ color: cfg.primaryColor }}>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-inner landing-grid">
          <div>
            <h2>Why Choose Us?</h2>
            <ul className="benefit-list">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <FiCheck /> {benefit}
                </li>
              ))}
            </ul>
          </div>
          <div className="trophy-card">
            <div className="trophy">🏆</div>
            <p>Trusted by leading companies</p>
          </div>
        </div>
      </section>

      <section
        className="landing-section"
        style={{ backgroundColor: cfg.surfaceColor, color: cfg.textColor }}
      >
        <div className="landing-inner contact-card">
          <h2>{cfg.contactTitle}</h2>
          <p>Let's discuss your staffing needs and find the perfect talent for your organization.</p>
          <button
            className="landing-btn primary"
            onClick={() =>
              handleMessage("Thank you for your interest! We will contact you soon.", cfg.primaryColor)
            }
          >
            {cfg.contactButton}
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} System Manpower Solutions. Connecting talent with opportunity.
      </footer>
    </div>
  );
}

