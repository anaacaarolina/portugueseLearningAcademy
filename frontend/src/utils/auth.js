const AUTH_KEYS = ["access_token", "token_type", "auth_role", "has_active_enrollment"];

export function getStoredAuth() {
  const sessionToken = sessionStorage.getItem("access_token");
  const localToken = localStorage.getItem("access_token");

  const storage = sessionToken ? sessionStorage : localToken ? localStorage : null;
  if (!storage) {
    return { isAuthenticated: false, role: null, hasActiveEnrollment: false };
  }

  const role = storage.getItem("auth_role") || "student";
  const hasActiveEnrollment = storage.getItem("has_active_enrollment") === "true";

  return {
    isAuthenticated: true,
    role,
    hasActiveEnrollment,
  };
}

export function clearStoredAuth() {
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

export function getDashboardPathByRole(role) {
  if (role === "admin") {
    return "/admin-dashboard";
  }

  if (role === "student" || role === "unrolled_student") {
    return "/student-dashboard";
  }

  if (role) {
    return "/student-dashboard";
  }

  return null;
}
