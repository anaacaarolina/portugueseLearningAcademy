import "./FunFacts.css";
import { useMemo, useState } from "react";
import FunFactCatalogCard from "../../../../components/FunFacts/FunFactCatalogCard/FunFactCatalogCard";

const facts = [
  {
    id: 1,
    category: "Language",
    title: "Portuguese Has Words You Cannot Translate Directly",
    excerpt: "One of the most famous is saudade, a deep emotional state of longing and affection for something or someone that may never return.",
    image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Vintage Portuguese dictionary pages",
  },
  {
    id: 2,
    category: "Culture",
    title: "Coffee in Portugal Is Usually Called Bica",
    excerpt: "If you ask for coffee in many cafes, locals often order a bica, a small and strong espresso style that is part of daily life.",
    image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Portuguese espresso served on a small table",
  },
  {
    id: 3,
    category: "History",
    title: "Portugal Helped Map the Sea Routes of the World",
    excerpt: "During the Age of Discoveries, Portuguese navigators opened maritime routes to Africa, Asia, and South America.",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Historic map and navigation tools",
  },
  {
    id: 4,
    category: "Culture",
    title: "Fado Is More Than Music",
    excerpt: "Fado songs carry stories of daily life, longing, and resilience, often performed in intimate venues with emotional intensity.",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Stage with microphone and warm lights",
  },
  {
    id: 5,
    category: "Language",
    title: "Portuguese Is Spoken Across Multiple Continents",
    excerpt: "Portuguese is an official language in countries in Europe, South America, Africa, and Asia, making it a truly global language.",
    image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "World globe on a desk",
  },
  {
    id: 6,
    category: "History",
    title: "Lisbon Is One of the Oldest Cities in Western Europe",
    excerpt: "The city predates many modern capitals and has layers of Roman, Moorish, and medieval influence in its neighborhoods.",
    image: "https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Lisbon skyline with historic buildings",
  },
];

export default function FunFacts() {
  const categoryButtons = useMemo(() => {
    const categories = Array.from(new Set(facts.map((fact) => fact.category)));
    return ["All", ...categories];
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFacts = facts.filter((fact) => selectedCategory === "All" || fact.category === selectedCategory);

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
          {filteredFacts.map((fact) => (
            <FunFactCatalogCard key={fact.id} image={fact.image} imageAlt={fact.imageAlt} category={fact.category} title={fact.title} excerpt={fact.excerpt} />
          ))}
        </div>
      </section>

      <section className="fun-facts-empty-state" aria-live="polite">
        {filteredFacts.length === 0 ? <p>No fun facts found for this category.</p> : null}
      </section>
    </div>
  );
}
