import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useCatalog";
import type { ApiProduct } from "@/lib/api";

type Tab = "featured" | "latest" | "bestsellers";

const TABS: { id: Tab; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "latest", label: "Latest Arrivals" },
  { id: "bestsellers", label: "Best Sellers" },
];

function pick(list: ApiProduct[], tab: Tab) {
  if (tab === "featured") {
    const featured = list.filter((p) => p.featured);
    return (featured.length ? featured : list).slice(0, 8);
  }
  if (tab === "bestsellers") {
    const bestsellers = list.filter((p) => p.bestSeller);
    return (bestsellers.length ? bestsellers : list).slice(0, 8);
  }
  return [...list]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return tb - ta;
    })
    .slice(0, 8);
}

export function HomeProducts() {
  const { data: products = [], isLoading } = useProducts();
  const [tab, setTab] = useState<Tab>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const displayProducts = useMemo(() => {
    let list = pick(products, tab);
    if (inStockOnly) list = list.filter((p) => p.inStock !== false);
    return list;
  }, [products, tab, inStockOnly]);

  return (
    <section className="section-pad bg-brand-black text-white">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="chip">Featured arsenal</span>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">
              Premium products. Built tough.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Switch between Featured, Latest Arrivals, and Best Sellers.
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                tab === t.id
                  ? "border-brand-orange bg-brand-orange text-white"
                  : "border-white/15 bg-white/5 text-white/75 hover:border-white/40"
              }`}
            >
              {t.label}
            </button>
          ))}
          <label
            className={`ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
              inStockOnly
                ? "border-brand-yellow bg-brand-yellow text-brand-black"
                : "border-white/15 bg-white/5 text-white/75"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In-Stock
          </label>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to={`/products?collection=${tab === "bestsellers" ? "bestsellers" : tab}${
              inStockOnly ? "&inStock=1" : ""
            }`}
            className="btn-yellow px-10 py-4 text-lg"
          >
            Show More Products
          </Link>
        </div>
      </div>
    </section>
  );
}
