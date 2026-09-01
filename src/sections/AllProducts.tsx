import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import categories from "@/data/categories.json";
import { ProductCard } from "@/components/ProductCard";
import { fuzzyMatch } from "@/lib/utils";
import { useProducts } from "@/hooks/useCatalog";
import type { ApiProduct } from "@/lib/api";

type Collection = "all" | "featured" | "latest" | "bestsellers";

const COLLECTIONS: { id: Collection; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "latest", label: "Latest Arrivals" },
  { id: "bestsellers", label: "Best Sellers" },
];

function applyCollection(list: ApiProduct[], collection: Collection) {
  if (collection === "featured") {
    const featured = list.filter((p) => p.featured);
    return featured.length ? featured : list.slice(0, 8);
  }
  if (collection === "latest") {
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return tb - ta;
    });
  }
  if (collection === "bestsellers") {
    const bestsellers = list.filter((p) => p.bestSeller);
    return bestsellers.length ? bestsellers : list.slice(0, 8);
  }
  return list;
}

export function AllProducts() {
  const { data: products = [], isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const collectionParam = (searchParams.get("collection") as Collection) || "all";
  const [cat, setCat] = useState<string>(categoryParam || "All");
  const [collection, setCollection] = useState<Collection>(
    COLLECTIONS.some((c) => c.id === collectionParam) ? collectionParam : "all",
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "1",
  );

  useEffect(() => {
    setCat(categoryParam || "All");
  }, [categoryParam]);

  useEffect(() => {
    if (COLLECTIONS.some((c) => c.id === collectionParam)) {
      setCollection(collectionParam);
    }
  }, [collectionParam]);

  const handleCatChange = (newCat: string) => {
    setCat(newCat);
    if (newCat === "All") searchParams.delete("category");
    else searchParams.set("category", newCat);
    setSearchParams(searchParams);
  };

  const handleCollection = (id: Collection) => {
    setCollection(id);
    if (id === "all") searchParams.delete("collection");
    else searchParams.set("collection", id);
    setSearchParams(searchParams);
  };

  const handleInStock = (checked: boolean) => {
    setInStockOnly(checked);
    if (checked) searchParams.set("inStock", "1");
    else searchParams.delete("inStock");
    setSearchParams(searchParams);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  const cats = useMemo(() => {
    const sortedCategories = [...categories].sort((a, b) => {
      const aCount = products.filter((p) => p.category === a.name).length;
      const bCount = products.filter((p) => p.category === b.name).length;
      if (aCount > 0 && bCount === 0) return -1;
      if (aCount === 0 && bCount > 0) return 1;
      return 0;
    });
    return ["All", ...sortedCategories.map((c) => c.name)];
  }, [products]);

  const highestPrice = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.price)) : 0),
    [products],
  );
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);
  const [maxPrice, setMaxPrice] = useState<number>(highestPrice);

  useEffect(() => {
    if (highestPrice > 0) setMaxPrice(highestPrice);
  }, [highestPrice]);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let list = applyCollection(products, collection);
    return list.filter((p) => {
      const matchesCat = cat === "All" || p.category === cat;
      const fullText = `${p.name} ${p.description || ""} ${p.category}`;
      const matchesSearch = query === "" || fuzzyMatch(query, fullText);
      const matchesPrice = p.price <= maxPrice;
      const matchesStock = !inStockOnly || p.inStock !== false;
      return matchesCat && matchesSearch && matchesPrice && matchesStock;
    });
  }, [products, cat, searchQuery, maxPrice, collection, inStockOnly]);

  if (isLoading) {
    return (
      <section className="section-pad bg-brand-black text-white">
        <div className="container-x grid place-items-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="section-pad bg-brand-black text-white">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="chip">Shop</span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">
              Premium products. Built tough.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Browse featured picks, latest arrivals, and best sellers — filter by stock anytime.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {COLLECTIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCollection(c.id)}
              className={`rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                collection === c.id
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-white/15 bg-white/5 text-white/75 hover:border-white/40 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
          <label
            className={`ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              inStockOnly
                ? "border-brand-yellow bg-brand-yellow text-brand-black"
                : "border-white/15 bg-white/5 text-white/75 hover:border-white/40"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={inStockOnly}
              onChange={(e) => handleInStock(e.target.checked)}
            />
            In-Stock only
          </label>
        </div>

        <div className="mb-10 flex items-center gap-3">
          <button
            onClick={() => scroll("left")}
            className="shrink-0 bg-brand-black text-white border border-white/20 p-2 rounded-full hover:bg-brand-yellow hover:text-brand-black transition-colors hidden md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div ref={scrollRef} className="flex-1 flex overflow-x-auto scrollbar-hide">
            <div className="flex w-max gap-2 px-1 py-1">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => handleCatChange(c)}
                  className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                    cat === c
                      ? "border-brand-yellow bg-brand-yellow text-brand-black shadow-[0_0_15px_rgba(244,178,26,0.3)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => scroll("right")}
            className="shrink-0 bg-brand-black text-white border border-white/20 p-2 rounded-full hover:bg-brand-yellow hover:text-brand-black transition-colors hidden md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10">
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              placeholder="Search products by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-full px-5 py-3 text-white placeholder-white/40 focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>
          <div className="w-full md:w-1/2 flex items-center gap-4 px-2 md:px-4">
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">
                <span>Filter by Price</span>
                <span className="text-brand-yellow font-bold">
                  Max: ₹{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={highestPrice}
                step={100}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer range-square-knob"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
            <h3 className="font-display text-4xl md:text-6xl tracking-wider uppercase">
              <span className="text-brand-yellow">No Products</span>{" "}
              <span className="text-white">Found.</span>
            </h3>
            <p className="mt-4 text-white/50">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
