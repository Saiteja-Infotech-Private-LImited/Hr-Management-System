
"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://hrms.saitejainfotechprivatelimited.com";

export default function MyTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeam() {
      try {
        const storedUser = sessionStorage.getItem("user");

        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setCurrentEmail(
              (user.email || user.username || "").toLowerCase()
            );
          } catch {
            // Continue if stored user data is invalid.
          }
        }

        const token = sessionStorage.getItem("accessToken");

        const response = await fetch(`${API_URL}/api/my-team`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load team (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response received from server.");
        }

        setMembers(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load hierarchy.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadTeam();

    return () => controller.abort();
  }, []);

  const fullName = (person) =>
    [person.firstName, person.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown";

  const getChildren = (person) =>
    members
      .filter((candidate) => {
        if (candidate.id === person.id) return false;

        if (person.role === "HR") {
          return (
            candidate.role === "MANAGER" &&
            candidate.hrId === person.id
          );
        }

        if (person.role === "MANAGER") {
          return (
            candidate.role === "TEAM_LEADER" &&
            candidate.managerId === person.id
          );
        }

        if (person.role === "TEAM_LEADER") {
          return (
            candidate.role === "EMPLOYEE" &&
            candidate.teamLeaderId === person.id
          );
        }

        return false;
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  const toggleExpanded = (id) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const colors = {
    ADMIN:
      "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
    HR:
      "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950",
    MANAGER:
      "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    TEAM_LEADER:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950",
    EMPLOYEE:
      "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
  };

  const roleTitle = {
    ADMIN: "Administrator",
    HR: "HR",
    MANAGER: "Manager",
    TEAM_LEADER: "Team Leader",
    EMPLOYEE: "Employee",
  };

  function PersonCard({ person, level = 0, ancestors = [] }) {
    const children = getChildren(person);
    const isExpanded = expandedIds.has(person.id);
    const alreadyVisited = ancestors.includes(person.id);

    const isCurrentUser =
      Boolean(currentEmail) &&
      person.email?.toLowerCase() === currentEmail;

    const childLabel = {
      MANAGER: "Team Leaders",
      TEAM_LEADER: "Employees",
    }[person.role];

    return (
      <div
        className={`mb-4 rounded-xl border p-4 shadow-sm ${
          colors[person.role] || colors.EMPLOYEE
        }`}
        style={{
          marginLeft: `${Math.min(level, 4) * 20}px`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {fullName(person)}
              </span>

              {isCurrentUser && (
                <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                  You
                </span>
              )}
            </div>

            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {person.employeeId || "—"} · {person.email || "—"}
            </div>

            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {person.department || "No department"}
            </div>
          </div>

          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            {roleTitle[person.role] || person.role}
          </span>
        </div>

        {alreadyVisited ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Circular reporting relationship detected.
          </p>
        ) : person.role === "HR" ? (
          <div className="mt-4 border-l-2 border-gray-300 pl-3 dark:border-gray-700">
            {children.length === 0 ? (
              <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
                No managers assigned.
              </p>
            ) : (
              children.map((child) => (
                <PersonCard
                  key={child.id}
                  person={child}
                  level={level + 1}
                  ancestors={[...ancestors, person.id]}
                />
              ))
            )}
          </div>
        ) : childLabel ? (
          <>
            <button
              type="button"
              onClick={() => toggleExpanded(person.id)}
              aria-expanded={isExpanded}
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <span>
                {childLabel} ({children.length})
              </span>

              <span aria-hidden="true">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            {isExpanded && (
              <div className="mt-4 border-l-2 border-gray-300 pl-3 dark:border-gray-700">
                {children.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    No {childLabel.toLowerCase()} assigned.
                  </p>
                ) : (
                  children.map((child) => (
                    <PersonCard
                      key={child.id}
                      person={child}
                      level={level + 1}
                      ancestors={[...ancestors, person.id]}
                    />
                  ))
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        Loading organization hierarchy...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <h1 className="text-2xl font-bold">My Team</h1>

        <p className="mt-4 text-red-600 dark:text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </main>
    );
  }

  const roots = members.filter(
    (person) =>
      person.role === "HR" &&
      !members.some(
        (candidate) =>
          candidate.role === "HR" &&
          candidate.id !== person.id &&
          candidate.hrId === person.id
      )
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Organization Hierarchy
        </h1>

        <p className="mb-6 mt-2 text-gray-600 dark:text-gray-300">
          View your reporting structure and assigned team members.
        </p>

        {roots.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-5 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            No HR records found. Check employee roles and API data.
          </p>
        ) : (
          roots.map((root) => (
            <PersonCard key={root.id} person={root} />
          ))
        )}
      </div>
    </main>
  );
}
