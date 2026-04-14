import "./FunFact.css";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80";
const FALLBACK_DESCRIPTION = "Learn more about Portuguese language and culture.";

function toParagraphHtml(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return "";
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  return lines.map((line) => `<p>${line}</p>`).join("");
}

function toListHtml(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    return "";
  }

  const items = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return "";
  }

  return `<ul>${items.map((item) => `${item}`).join("")}</ul>`;
}

function SafeHtml({ html, className }) {
  if (!html) return null;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "blockquote"],
          ALLOWED_ATTR: [],
        }),
      }}
    />
  );
}
export default function FunFact() {
  const { slug } = useParams();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [facts, setFacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadFunFactData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [tagsResponse, factsResponse] = await Promise.all([fetch(`${apiBaseUrl}/fun-fact-tags`), fetch(`${apiBaseUrl}/fun-facts`)]);

        if (!tagsResponse.ok || !factsResponse.ok) {
          throw new Error("Unable to load fun fact");
        }

        const [tagsData, factsData] = await Promise.all([tagsResponse.json(), factsResponse.json()]);

        if (!isMounted) {
          return;
        }

        setTags(Array.isArray(tagsData) ? tagsData : []);
        setFacts(Array.isArray(factsData) ? factsData.filter((fact) => Boolean(fact?.is_published)) : []);
      } catch {
        if (isMounted) {
          setTags([]);
          setFacts([]);
          setErrorMessage("Could not load fun fact from the API.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFunFactData();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const tagNameById = useMemo(() => {
    return tags.reduce((acc, tag) => {
      if (typeof tag?.id === "number" && typeof tag?.name === "string") {
        acc[tag.id] = tag.name;
      }
      return acc;
    }, {});
  }, [tags]);

  const sortedFacts = useMemo(() => {
    return [...facts].sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [facts]);

  const fact = useMemo(() => {
    if (!slug) {
      return sortedFacts[0] ?? null;
    }

    return sortedFacts.find((item) => item?.slug === slug) ?? null;
  }, [slug, sortedFacts]);

  const relatedFacts = useMemo(() => {
    if (!fact) {
      return [];
    }

    const sameTag = sortedFacts.filter((item) => item.id !== fact.id && item.tag_id === fact.tag_id).slice(0, 2);
    if (sameTag.length >= 2) {
      return sameTag;
    }

    const fallback = sortedFacts.filter((item) => item.id !== fact.id && item.tag_id !== fact.tag_id).slice(0, 2 - sameTag.length);
    return [...sameTag, ...fallback];
  }, [fact, sortedFacts]);

  const factCategory = fact ? tagNameById[fact.tag_id] || "General" : "General";
  const bodyHtml = fact ? toParagraphHtml(fact.body) : "";
  const keyPointsHtml = fact ? toListHtml(fact.key_points) : "";

  const didYouKnowText = fact?.did_you_know || FALLBACK_DESCRIPTION;
  const heroImage = fact?.image_url || FALLBACK_IMAGE;
  const heroTitle = fact?.title || "Fun Fact";

  return (
    <div className="fun-fact-page">
      {isLoading ? <p className="fun-fact-status-message">Loading fun fact...</p> : null}
      {!isLoading && errorMessage ? <p className="fun-fact-status-message">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && !fact ? <p className="fun-fact-status-message">Fun fact not found.</p> : null}

      <section className="fun-fact-hero-section">
        <img src={heroImage} alt={heroTitle} className="fun-fact-hero-image" />
        <div className="fun-fact-hero-overlay" />
        <div className="fun-fact-hero-content">
          <p className="fun-fact-hero-pill">{factCategory}</p>
          <h1>{heroTitle}</h1>
        </div>
      </section>

      <section className="fun-fact-back-link-section">
        <Link to="/fun-facts" className="fun-fact-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Fun Facts
        </Link>
      </section>
      {!isLoading && !errorMessage && fact ? (
        <div className="fun-fact-info-sections">
          <section className="fun-fact-content-section">
            <SafeHtml html={bodyHtml} />
          </section>

          <section className="fun-fact-key-points-section">
            <h2>
              <BookOpen size={20} aria-hidden="true" />
              Key Points
            </h2>

            <SafeHtml html={keyPointsHtml} className="fun-fact-key-points-list" />
          </section>

          <section className="fun-fact-did-you-know-section">
            <h2>Did you know?</h2>
            <p>{didYouKnowText}</p>
          </section>

          <section className="fun-fact-related-section">
            <h2>Related Fun Facts</h2>
            <div className="fun-fact-related-grid">
              {relatedFacts.map((item) => (
                <Link key={item.id} to={item?.slug ? `/fun-facts/${item.slug}` : "/fun-facts"} className="fun-fact-related-card-button">
                  <h3>{item.title}</h3>
                  <span className="fun-fact-catalog-card-read-more">
                    Read More
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
