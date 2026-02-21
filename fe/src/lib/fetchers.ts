import type { Product, Customer } from "@/data/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ProductFilters = {
  search?: string;
  sku?: string;
  category?: string;
  segment?: string;
  brand?: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchProducts(filters?: ProductFilters): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
  }
  const query = params.toString();
  return fetchJson<Product[]>(`/products${query ? `?${query}` : ""}`);
}

export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  return fetchJson<Customer[]>(`/customers${params}`);
}

export async function fetchSegments(): Promise<string[]> {
  return fetchJson<string[]>("/segments");
}

export async function fetchBrands(): Promise<string[]> {
  return fetchJson<string[]>("/brands");
}

export async function createPricingProfile(data: unknown): Promise<unknown> {
  const response = await fetch(`${API_URL}/pricing-profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }
  return response.json();
}
