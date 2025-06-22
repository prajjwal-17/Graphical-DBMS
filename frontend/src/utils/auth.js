// utils/auth.js
export const getUser = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user || user === "undefined") return null;

  try {
    return JSON.parse(user);
  } catch (e) {
    console.error("Invalid user JSON in localStorage:", e);
    return null;
  }
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === "admin";
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Fixed: Now properly saves both token and user data
export const saveToken = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

// Helper function to decode JWT token and extract user info
export const getUserFromToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};