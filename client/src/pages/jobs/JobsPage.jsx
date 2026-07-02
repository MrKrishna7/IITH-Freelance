import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ category: "" });

  const categories = [
    "Web Dev",
    "Design",
    "ML",
    "Sketch",
    "Video Editing",
    "Game Dev",
    "Other",
  ];

  const fetchJobs = useCallback(async () => {
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      const res = await api.get("/v1/jobs", { params });
      setJobs(res.data.data);
    } catch {
      setError("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    Promise.resolve().then(fetchJobs);
  }, [fetchJobs]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-white px-6 py-7 shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              IITH Freelance
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">
              Find campus talent for the work you need done.
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              Browse student-friendly projects across development, design,
              editing, ML, and more.
            </p>
          </div>

          <div className="min-w-48">
            <label
              htmlFor="category"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Category
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                setFilters({
                  ...filters,
                  category: filters.category === category ? "" : category,
                })
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filters.category === category
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Browse Jobs</h2>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? "Checking the latest listings..."
              : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} available`}
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-1/3 rounded bg-gray-100" />
              <div className="mt-4 h-3 w-5/6 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
              <div className="mt-5 flex gap-3">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-3 w-32 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && jobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
          <h3 className="text-base font-semibold text-gray-900">
            No jobs found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try a different category or check back later.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <Link
            key={job._id}
            to={`/jobs/${job._id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900">
                  {job.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {job.description.slice(0, 100)}...
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                {job.category}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span>Posted by {job.postedBy?.fullName}</span>
              <span>
                Deadline: {new Date(job.deadline).toLocaleDateString()}
              </span>
              {job.tags?.length > 0 && <span>{job.tags.join(", ")}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
