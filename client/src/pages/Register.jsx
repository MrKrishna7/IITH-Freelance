import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    emailID: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailID = form.emailID.trim().toLowerCase();
    if (!emailID.endsWith("@iith.ac.in")) {
      setError("Only @iith.ac.in emails are allowed");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("fullName", form.fullName.trim());
    formData.append("username", form.username.trim().toLowerCase());
    formData.append("emailID", emailID);
    formData.append("password", form.password);
    if (avatar) formData.append("avatar", avatar);

    try {
      await api.post("/v1/users/register", formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold text-emerald-900 mb-6">
          Create account
        </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Full name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              IITH email
            </label>
            <input
              name="emailID"
              type="email"
              value={form.emailID}
              onChange={handleChange}
              required
              placeholder="yourroll@iith.ac.in"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Avatar (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files[0])}
              className="w-full text-sm text-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
