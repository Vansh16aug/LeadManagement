import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useGetMyLeadsQuery } from "../../redux/api/usersApiSlice";

// Function to transform raw leads data into user-specific data
const transformData = (leads) => {
  const userMap = {};

  leads.forEach((lead) => {
    const userId = lead.userId._id;
    const username = lead.userId.username;
    const email = lead.userId.email;

    if (!userMap[userId]) {
      userMap[userId] = {
        userId,
        username,
        email,
        buys: 0,
        views: 0,
        cartAdds: 0,
        totalActions: 0,
        weightedScore: 0,
      };
    }

    switch (lead.action) {
      case "buy":
        userMap[userId].buys += lead.purchases;
        break;
      case "viewed":
        userMap[userId].views += lead.views;
        break;
      case "added_to_cart":
        userMap[userId].cartAdds += lead.cartAdds;
        break;
      default:
        break;
    }

    userMap[userId].totalActions =
      userMap[userId].buys + userMap[userId].views + userMap[userId].cartAdds;

    // Calculate weighted score
    userMap[userId].weightedScore =
      userMap[userId].buys * 3 +
      userMap[userId].cartAdds * 2 +
      userMap[userId].views * 1;
  });

  return Object.values(userMap);
};

// Function to rank users based on their weighted score
const rankUsers = (users) => {
  return users.sort((a, b) => b.weightedScore - a.weightedScore);
};

const Analytics = () => {
  const { data: leads, isLoading, isError } = useGetMyLeadsQuery();
  const [rankedUsers, setRankedUsers] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);

  // Transform and rank data when leads are fetched
  useEffect(() => {
    if (leads && Array.isArray(leads)) {
      const transformedData = transformData(leads);
      const rankedData = rankUsers(transformedData);
      setRankedUsers(rankedData);
    }
  }, [leads]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-900 border-l-4 border-red-500 p-4 rounded shadow-md my-6 mx-auto max-w-2xl">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-200">
              Failed to fetch leads data. Please try again later or contact
              support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get the most important user
  const mostImportantUser = rankedUsers[0];

  return (
    <div className="bg-gray-900 min-h-screen text-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white text-center">
              Lead Analytics Dashboard
            </h1>
            <p className="mt-2 text-center text-gray-400">
              Track and analyze user engagement metrics
            </p>
          </div>
        </header>

        {/* Scoring Parameters Section - NEW */}
        <div className="bg-gray-800 shadow-lg rounded-lg mb-8 border border-gray-700">
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-purple-900 to-blue-900">
            <h2 className="text-lg leading-6 font-medium text-white">
              Scoring Parameters
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-blue-200">
              How users are ranked in this dashboard
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg border border-indigo-800">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-indigo-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-2 text-lg font-semibold text-white">
                    Purchases
                  </h3>
                </div>
                <p className="text-gray-300">
                  Each purchase is worth{" "}
                  <span className="text-indigo-300 font-bold">3 points</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Highest value action showing completed conversion
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-amber-800">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-amber-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-2 text-lg font-semibold text-white">
                    Cart Additions
                  </h3>
                </div>
                <p className="text-gray-300">
                  Each cart addition is worth{" "}
                  <span className="text-amber-300 font-bold">2 points</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Medium value action showing strong purchase intent
                </p>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-green-800">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-green-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="ml-2 text-lg font-semibold text-white">
                    Views
                  </h3>
                </div>
                <p className="text-gray-300">
                  Each product view is worth{" "}
                  <span className="text-green-300 font-bold">1 point</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Base level action showing initial interest
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-800">
              <p className="text-sm text-blue-200">
                <span className="font-bold">Total Score</span> = (Purchases × 3)
                + (Cart Additions × 2) + (Views × 1)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overview Cards */}
          <div className="bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">
                Total Users
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-white">
                {rankedUsers.length}
              </dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">
                Total Purchases
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-white">
                {rankedUsers.reduce((sum, user) => sum + user.buys, 0)}
              </dd>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow-lg rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-400 truncate">
                Total Views
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-white">
                {rankedUsers.reduce((sum, user) => sum + user.views, 0)}
              </dd>
            </div>
          </div>
        </div>

        {/* Most Important User Section */}
        {mostImportantUser && (
          <div className="bg-gray-800 shadow-lg overflow-hidden rounded-lg mb-8 border border-gray-700">
            <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-900 to-purple-900">
              <h2 className="text-lg leading-6 font-medium text-white">
                Top Performing User
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-blue-200">
                User with highest weighted engagement score
              </p>
            </div>
            <div className="border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <div>
                  <div className="flex items-center">
                    <div className="bg-gray-700 rounded-full p-3">
                      <svg
                        className="h-6 w-6 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">
                        Username
                      </p>
                      <p className="text-lg font-bold text-white">
                        {mostImportantUser.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-400">Email</p>
                    <p className="text-gray-300">{mostImportantUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Purchases
                    </p>
                    <p className="mt-1 text-xl font-semibold text-indigo-400">
                      {mostImportantUser.buys}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Views</p>
                    <p className="mt-1 text-xl font-semibold text-green-400">
                      {mostImportantUser.views}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      Cart Adds
                    </p>
                    <p className="mt-1 text-xl font-semibold text-amber-400">
                      {mostImportantUser.cartAdds}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-xl font-medium bg-blue-900 text-blue-200">
                    Score: {mostImportantUser.weightedScore}
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    Weighted Engagement Score
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bar Chart for User Actions */}
        {rankedUsers.length > 0 ? (
          <>
            <div className="bg-gray-800 p-6 shadow-lg rounded-lg mb-8 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                User Actions Overview
              </h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rankedUsers.slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="username"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12, fill: "#9CA3AF" }}
                      stroke="#4B5563"
                    />
                    <YAxis tick={{ fill: "#9CA3AF" }} stroke="#4B5563" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                        color: "#E5E7EB",
                        border: "1px solid #374151",
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#E5E7EB" }} />
                    <Bar dataKey="buys" name="Purchases" fill="#818CF8" />
                    <Bar dataKey="views" name="Views" fill="#34D399" />
                    <Bar
                      dataKey="cartAdds"
                      name="Cart Additions"
                      fill="#FBBF24"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table for Detailed User Scores */}
            <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden border border-gray-700">
              <div className="px-4 py-5 border-b border-gray-700 sm:px-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">
                    User Rankings
                  </h2>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <select
                      className="bg-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-10 py-2 text-base border-gray-600 rounded-md text-white"
                      value={displayCount}
                      onChange={(e) => setDisplayCount(Number(e.target.value))}
                    >
                      <option value={5}>Show 5</option>
                      <option value={10}>Show 10</option>
                      <option value={20}>Show 20</option>
                      <option value={rankedUsers.length}>Show All</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Rank
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Purchases
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Views
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Cart Adds
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {rankedUsers.slice(0, displayCount).map((user, index) => (
                      <tr
                        key={user.userId}
                        className={
                          index === 0 ? "bg-blue-900 bg-opacity-20" : ""
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                              index === 0
                                ? "bg-blue-900 text-blue-200"
                                : index === 1
                                ? "bg-gray-700 text-gray-200"
                                : index === 2
                                ? "bg-amber-900 text-amber-200"
                                : "bg-gray-800 text-gray-300"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-gray-300 font-medium">
                                {user.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-900 text-indigo-200">
                            {user.buys}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                            {user.views}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-900 text-amber-200">
                            {user.cartAdds}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="font-bold text-white">
                            {user.weightedScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-200">
                  No data available
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  No leads data has been collected yet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
