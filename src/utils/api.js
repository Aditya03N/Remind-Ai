export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const fetchWithAuth = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // If token is invalid or expired, remove it so subsequent requests don't fail
  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("token");
  }

  return response;
};
