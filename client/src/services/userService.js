import { api } from "./apiClient";

export function getUser(token, id) {
  return api.get(`/api/users/${id}`, { token });
}

export function getMe(token) {
  return api.get("/api/users/me", { token });
}

export function updateMe(token, updates) {
  return api.patch("/api/users/me", updates, { token });
}

export function changePassword(token, { currentPassword, newPassword }) {
  return api.patch("/api/users/me/password", { currentPassword, newPassword }, { token });
}
