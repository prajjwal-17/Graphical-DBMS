import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdmin } from "../utils/auth";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/get-started" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
