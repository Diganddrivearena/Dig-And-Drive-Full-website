const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = { ...(options.headers ?? {}) };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !(headers as Record<string, string>)["Content-Type"]) {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
    signal: options.signal ?? AbortSignal.timeout(20000),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError(
        res.ok ? "Invalid server response" : "Request failed",
        res.status,
        text.slice(0, 200),
      );
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? typeof data.error === "string"
          ? data.error
          : "Request failed"
        : "Request failed") || "Request failed";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export async function uploadBannerImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await api<{ url: string }>("/admin/banners/upload", {
    method: "POST",
    body,
  });
  return res.url;
}

export async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await api<{ url: string }>("/admin/products/upload", {
    method: "POST",
    body,
  });
  return res.url;
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const res = await api<{ url: string }>("/admin/categories/upload", {
    method: "POST",
    body,
  });
  return res.url;
}

export type ApiProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  featured: boolean;
};

export type ApiReview = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  userId: string;
};

export type ApiOrder = {
  id: number;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  couponCode: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    imageKey?: string;
    image?: string;
  }[];
};

export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  description: string;
  specs: string[];
  active?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  inStock?: boolean;
  createdAt?: string;
  sortOrder?: number;
};

export type ApiBanner = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
};

export type ApiCoupon = {
  id: number;
  code: string;
  type: string;
  value: string;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

export type ApiBannerAdmin = ApiBanner & {
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};
