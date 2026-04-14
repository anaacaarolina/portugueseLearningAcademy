import "./FunFacts.css";
import { useEffect, useMemo, useState } from "react";
import FunFactCatalogCard from "../../../../components/FunFacts/FunFactCatalogCard/FunFactCatalogCard";

export default function FunFacts() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const [facts, setFacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let isMounted = true;

    const loadFunFactsData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [tagsResponse, factsResponse] = await Promise.all([fetch(`${apiBaseUrl}/fun-fact-tags`), fetch(`${apiBaseUrl}/fun-facts`)]);

        if (!tagsResponse.ok || !factsResponse.ok) {
          throw new Error("Unable to load fun facts");
        }

        const [tagsData, factsData] = await Promise.all([tagsResponse.json(), factsResponse.json()]);

        if (!isMounted) {
          return;
        }

        const safeTags = Array.isArray(tagsData) ? tagsData : [];
        const safeFacts = Array.isArray(factsData) ? factsData : [];

        setTags(safeTags);
        setFacts(
          safeFacts
            .filter((fact) => Boolean(fact?.is_published))
            .sort((a, b) => {
              const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return bTime - aTime;
            }),
        );
      } catch {
        if (isMounted) {
          setErrorMessage("Could not load fun facts from the API.");
          setTags([]);
          setFacts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFunFactsData();

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

  const categoryButtons = useMemo(() => {
    const categories = tags.map((tag) => tag?.name).filter((name) => typeof name === "string" && name.trim().length > 0);

    return ["All", ...categories];
  }, [tags]);

  useEffect(() => {
    if (!categoryButtons.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categoryButtons, selectedCategory]);

  const filteredFacts = facts.filter((fact) => {
    if (selectedCategory === "All") {
      return true;
    }

    const tagName = tagNameById[fact?.tag_id] ?? "";
    return tagName === selectedCategory;
  });

  return (
    <div className="fun-facts-page">
      <section className="fun-facts-hero-section">
        <h1>Portuguese Fun Facts</h1>
        <p>Discovery fascination facts about the Portuguese language, culture, and history.</p>
      </section>

      <section className="fun-facts-filter-section" aria-label="Fun facts category filter">
        {categoryButtons.map((category) => (
          <button key={category} type="button" className={`fun-facts-filter-button ${selectedCategory === category ? "is-active" : ""}`} onClick={() => setSelectedCategory(category)}>
            {category}
          </button>
        ))}
      </section>

      <section className="fun-facts-catalog-section">
        <div className="fun-facts-catalog-grid">
          {isLoading ? <p className="fun-facts-status-message">Loading fun facts...</p> : null}
          {!isLoading && errorMessage ? <p className="fun-facts-status-message">{errorMessage}</p> : null}
          {!isLoading && !errorMessage ? filteredFacts.map((fact) => <FunFactCatalogCard key={fact.id} image={fact.image_url || "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80"} imageAlt={fact.title || "Fun fact image"} category={tagNameById[fact?.tag_id] || "General"} title={fact.title || "Untitled fun fact"} excerpt={fact.did_you_know || fact.key_points || fact.body || "Learn more about Portuguese language and culture."} to={fact?.slug ? `/fun-facts/${fact.slug}` : "/fun-facts"} />) : null}
        </div>
      </section>

      <section className="fun-facts-empty-state" aria-live="polite">
        {!isLoading && !errorMessage && filteredFacts.length === 0 ? <p>No fun facts found for this category.</p> : null}
      </section>
    </div>
  );
}
