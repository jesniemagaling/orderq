import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useAuth() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    if (!token || !userRole) navigate("/");
    setRole(userRole);
  }, [token, userRole, navigate]);

  return { token, role };
}
