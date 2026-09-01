import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import categories from "@/data/categories.json";
import { fuzzyMatch } from "@/lib/utils";
import { imageFor } from "@/lib/images";
import { useProducts } from "@/hooks/useCatalog";

export function HeaderSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: products = [] } = useProducts();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCat = cat === "All" || p.category === cat;
      const fullText = `${p.name} ${p.description || ""} ${p.category}`;
      const matchesSearch = fuzzyMatch(q, fullText);
      return matchesCat && matchesSearch;
    }).slice(0, 5);
  }, [products, query, cat]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (cat !== "All") params.set("category", cat);
    if (query.trim()) params.set("q", query.trim());
    
    navigate(`/products?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-brand-black hover:text-brand-orange transition-colors cursor-pointer"
        aria-label="Toggle search"
      >
        <Search className="h-6 w-6" />
      </button>

      {/* Search Bar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-md animate-in fade-in slide-in-from-top-2 duration-200 z-40">
          <div className="container-x py-3 relative">
            <form onSubmit={handleSearch} className="flex items-center w-full border-2 border-brand-yellow rounded-lg bg-white relative">
              
              {/* Custom Category Dropdown */}
              <div className="relative h-full flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCatOpen(!isCatOpen)}
                  className="bg-brand-yellow/10 text-brand-black px-3 md:px-4 py-2.5 text-sm font-semibold border-r border-brand-yellow/20 w-[80px] md:w-[130px] flex items-center justify-between cursor-pointer h-full rounded-l-md transition-colors hover:bg-brand-yellow/20"
                >
                  <span className="truncate flex-1 text-left">{cat}</span>
                  <ChevronDown className="h-4 w-4 ml-1 flex-shrink-0 text-brand-dark" />
                </button>
                
                {isCatOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsCatOpen(false)} 
                    />
                    <div data-lenis-prevent="true" className="absolute top-[calc(100%+4px)] left-0 w-64 max-h-52 overflow-y-auto overscroll-contain scrollbar-hide bg-white border border-border shadow-xl rounded-md z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => { setCat("All"); setIsCatOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${cat === "All" ? "font-bold text-brand-orange bg-brand-yellow/10" : "text-brand-black hover:bg-brand-gray"}`}
                      >
                        All
                      </button>
                      {categories.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setCat(c.name); setIsCatOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-t border-border/50 ${cat === c.name ? "font-bold text-brand-orange bg-brand-yellow/10" : "text-brand-black hover:bg-brand-gray"}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search Input */}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 px-3 md:px-4 py-2.5 text-sm outline-none text-brand-black bg-transparent min-w-0"
              />

              {/* Search Button */}
              <button 
                type="submit" 
                className="bg-brand-yellow text-brand-black px-4 py-2.5 hover:bg-brand-orange hover:text-white transition-colors flex items-center justify-center cursor-pointer rounded-r-md flex-shrink-0 h-full"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {query.trim() && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%-8px)] left-4 right-4 md:left-8 md:right-8 bg-white border border-border shadow-xl rounded-b-lg overflow-hidden z-50">
                {suggestions.map((p) => (
                  <Link 
                    key={p.id} 
                    to={`/products/${p.slug}`} 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-3 hover:bg-brand-gray transition-colors border-b border-border last:border-0"
                  >
                    <img src={imageFor(p.image)} alt={p.name} className="w-12 h-12 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-black truncate">{p.name}</div>
                      <div className="text-xs text-brand-dark mt-1">₹{p.price.toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
                <Link 
                  to={`/products?category=${cat !== 'All' ? cat : ''}&q=${query}`}
                  onClick={() => setIsOpen(false)}
                  className="block p-3 text-center text-xs font-bold text-brand-orange hover:bg-brand-gray transition-colors"
                >
                  View More →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
