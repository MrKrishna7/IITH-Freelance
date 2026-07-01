import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [jobsRes, bidsRes, ordersRes] = await Promise.all([
        api.get("/v1/jobs/my"),
        api.get("/v1/bids/my"),
        api.get("/orders"),
      ]);
      setMyJobs(jobsRes.data.data);
      setMyBids(bidsRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchAll);
  }, [fetchAll]);

  if (loading) {
    return (
      <div>
        <p className="text-gray-500 text-sm">Loading...</p>
        <p className="text-gray-500 text-sm">
          Please wait while we fetch your data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-emerald-900">
        Hey, {user?.fullName?.split(" ")[0]}! Welcome to your dashboard.
      </h1>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-emerald-900">
            Your posted jobs
          </h2>
          <Link
            to="/post-job"
            className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline"
          >
            + Post new
          </Link>
        </div>

        {myJobs.length === 0 && (
          <p className="text-sm text-gray-500">
            You haven't posted any jobs yet.
          </p>
        )}

        <div className="space-y-3">
          {myJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  {job.title}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>{job.category}</span>
                  <span>
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </span>
                  <span
                    className={
                      job.status === "pending"
                        ? "text-yellow-500"
                        : job.status === "in_progress"
                          ? "text-blue-500"
                          : "text-green-500"
                    }
                  >
                    {job.status}
                  </span>
                </div>
              </div>
              <Link
                to={`/jobs/${job._id}`}
                className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline shrink-0 ml-4"
              >
                View
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-emerald-900 mb-3">
          Your bids
        </h2>

        {myBids.length === 0 && (
          <p className="text-sm text-gray-500">
            You haven't placed any bids yet.
          </p>
        )}

        <div className="space-y-3">
          {myBids.map((bid) => (
            <div
              key={bid._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  {bid.job?.title}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>₹{bid.bidAmount}</span>
                  <span>{bid.deliveryDays} days</span>
                  <span
                    className={
                      bid.status === "pending"
                        ? "text-yellow-500"
                        : bid.status === "accepted"
                          ? "text-green-500"
                          : "text-red-500"
                    }
                  >
                    {bid.status}
                  </span>
                </div>
              </div>
              <Link
                to={`/jobs/${bid.job?._id}`}
                className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline shrink-0 ml-4"
              >
                View job
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-emerald-900 mb-3">
          Active orders
        </h2>

        {orders.length === 0 && (
          <p className="text-sm text-gray-500">No active orders.</p>
        )}

        <div className="space-y-3">
          {orders.map((order) => {
            const isBuyer = order.buyer?._id === user?._id;
            return (
              <div
                key={order._id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    {order.job?.title}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>
                      {isBuyer
                        ? `Seller: ${order.seller?.fullName}`
                        : `Buyer: ${order.buyer?.fullName}`}
                    </span>
                    <span>₹{order.bid?.bidAmount}</span>
                  </div>
                </div>
                <Link
                  to={`/orders/${order._id}`}
                  className="text-sm text-emerald-700 hover:text-emerald-600 hover:underline shrink-0 ml-4"
                >
                  View order
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
