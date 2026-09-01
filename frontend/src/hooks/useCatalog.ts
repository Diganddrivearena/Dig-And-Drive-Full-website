import { useQuery } from "@tanstack/react-query";
import { api, type ApiProduct, type ApiBanner } from "@/lib/api";
import staticProducts from "@/data/products.json";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await api<ApiProduct[]>("/products");
      } catch {
        return staticProducts as ApiProduct[];
      }
    },
    staleTime: 60_000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) return null;
      try {
        return await api<ApiProduct>(`/products/${slug}`);
      } catch {
        return (
          (staticProducts as ApiProduct[]).find((p) => p.slug === slug) ?? null
        );
      }
    },
  });
}

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: () => api<ApiBanner[]>("/banners"),
    staleTime: 60_000,
  });
}
