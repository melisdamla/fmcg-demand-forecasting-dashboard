const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export type Product = { product_id: string; product_name: string; category: string };
export type Store = { store_id: string; store_city: string };
export type Options = { products: Product[]; stores: Store[] };
