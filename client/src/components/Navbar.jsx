import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/v1/users/logout");
    } catch {
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-bold text-emerald-800 hover:text-emerald-700"
        >
          IITH Freelance
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-gray-800 hover:text-gray-900">
            Browse Jobs
          </Link>

          {user ? (
            <>
              <Link
                to="/post-job"
                className="text-sm text-gray-800 hover:text-gray-900"
              >
                Post a Job
              </Link>
              <Link
                to="/dashboard"
                className="text-sm text-gray-800 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                to={`/profile/${user._id}`}
                className="text-sm text-gray-800 hover:text-gray-900"
              >
                {user.fullName}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-800 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-emerald-800 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
