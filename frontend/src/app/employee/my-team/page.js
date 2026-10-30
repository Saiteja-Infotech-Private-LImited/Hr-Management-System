
"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://hrms.saitejainfotechprivatelimited.com";
 
const roleTitle = {
  ADMIN: "Administrator",
  HR: "HR Manager",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Leader",
  EMPLOYEE: "Employee",
};
 
export default function MyTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [currentEmail, setCurrentEmail] = useState("");
 
  // Fetch existing team data from the backend
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
            // Continue loading team data if stored user data is invalid.
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
          setError(err.message || "Unable to load team hierarchy.");
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
 
  // Helper functions
  const fullName = (person) =>
    [person?.firstName, person?.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown";
 
  const getInitials = (person) =>
    fullName(person)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
 
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
            candidate.role === "TEAM_LEAD" &&
            candidate.managerId === person.id
          );
        }
 
        if (person.role === "TEAM_LEAD") {
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
 
  // Dynamic statistics from the existing API data
  const totalMembersCount = members.length;
 
  const managersCount = members.filter(
    (member) => member.role === "MANAGER"
  ).length;
 
  const teamLeadsCount = members.filter(
    (member) => member.role === "TEAM_LEAD"
  ).length;
 
  const employeesCount = members.filter(
    (member) => member.role === "EMPLOYEE"
  ).length;
 
  const topLevelPeople = members.filter(
    (member) =>
      member.role === "HR" ||
      (!member.hrId &&
        !member.managerId &&
        !member.teamLeaderId)
  );
 
  const currentUser =
    members.find(
      (member) =>
        currentEmail &&
        member.email?.toLowerCase() === currentEmail
    ) ||
    members.find((member) => member.role === "HR") ||
    topLevelPeople[0];
 
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
 
  const expandAll = () => {
    const ids = members
      .filter(
        (member) =>
          member.role === "MANAGER" ||
          member.role === "TEAM_LEAD"
      )
      .map((member) => member.id);
 
    const allExpanded = ids.every((id) => expandedIds.has(id));
 
    setExpandedIds(allExpanded ? new Set() : new Set(ids));
  };
 
  // Reusable organization hierarchy card
  function PersonCard({ person, ancestors = [] }) {
    const children = getChildren(person);
    const isExpanded = expandedIds.has(person.id);
    const alreadyVisited = ancestors.includes(person.id);
 
    const isCurrentUser =
      Boolean(currentEmail) &&
      person.email?.toLowerCase() === currentEmail;
 
    const childLabel = {
      MANAGER: "Team Leaders",
      TEAM_LEAD: "Employees",
    }[person.role];
 
    return (
      <div className="relative">
        <div
          className={`rounded-2xl border p-4 transition-all duration-200 ${
            isCurrentUser
              ? "border-blue-300 bg-blue-50/70 shadow-sm"
              : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                  person.role === "HR"
                    ? "bg-blue-600"
                    : person.role === "MANAGER"
                    ? "bg-violet-500"
                    : person.role === "TEAM_LEAD"
                    ? "bg-sky-500"
                    : "bg-emerald-500"
                }`}
              >
                {getInitials(person)}
              </div>
 
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {fullName(person)}
                  </p>
 
                  {isCurrentUser && (
                    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      You
                    </span>
                  )}
                </div>
 
                <p className="mt-1 break-all text-xs text-slate-500">
                  {person.employeeId || "—"}{" "}
                  <span className="text-slate-300">·</span>{" "}
                  {person.email || "—"}
                </p>
 
                <p className="mt-1 text-xs text-slate-500">
                  {person.department || "No department"}
                </p>
              </div>
            </div>
 
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {roleTitle[person.role] || person.role}
            </span>
          </div>
 
          {alreadyVisited && (
            <p className="mt-3 text-xs font-medium text-red-600">
              Circular reporting relationship detected.
            </p>
          )}
 
          {!alreadyVisited && childLabel && (
            <button
              type="button"
              onClick={() => toggleExpanded(person.id)}
              aria-expanded={isExpanded}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-left text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">
                  {person.role === "MANAGER" ? "👥" : "🧑‍💻"}
                </span>
                {childLabel} ({children.length})
              </span>
 
              <span className="text-lg">
                {isExpanded ? "−" : "+"}
              </span>
            </button>
          )}
        </div>
 
        {!alreadyVisited &&
          person.role === "HR" &&
          children.length > 0 && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-blue-100 pl-4 sm:ml-10">
              {children.map((child) => (
                <PersonCard
                  key={child.id}
                  person={child}
                  ancestors={[...ancestors, person.id]}
                />
              ))}
            </div>
          )}
 
        {!alreadyVisited &&
          childLabel &&
          isExpanded &&
          person.role !== "HR" && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-blue-100 pl-4 sm:ml-10">
              {children.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                  No {childLabel.toLowerCase()} assigned.
                </p>
              ) : (
                children.map((child) => (
                  <PersonCard
                    key={child.id}
                    person={child}
                    ancestors={[...ancestors, person.id]}
                  />
                ))
              )}
            </div>
          )}
      </div>
    );
  }
 
  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">
            Loading organization hierarchy...
          </p>
        </div>
      </main>
    );
  }
 
 // Error state
  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <div className="text-4xl">⚠️</div>
 
        <h1 className="text-xl font-bold text-slate-800">
          Unable to load My Team
        </h1>
 
        <p className="text-center text-sm text-red-600">{error}</p>
 
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </main>
    );
  }
 
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F5F8FD] p-4 font-sans text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
 
        {/* Welcome Banner */}
        <section className="relative flex min-h-[120px] flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-100 px-5 py-5 shadow-sm sm:px-7">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              👋
            </div>
 
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                Good Morning, {currentUser?.role === "HR" ? "HR Manager" : fullName(currentUser || {})}
              </h1>
 
              <p className="mt-1 text-sm text-slate-600">
                Here&apos;s what&apos;s happening with your team today.
              </p>
            </div>
          </div>
 
          <div className="relative z-10 flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3">
            <span className="text-2xl" aria-hidden="true">
              📅
            </span>
 
            <div>
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-sm font-bold text-slate-800">
                {today}
              </p>
            </div>
          </div>
 
          <div className="pointer-events-none absolute right-40 top-0 hidden h-full items-center text-6xl opacity-20 xl:flex">
            👥
          </div>
        </section>
 
        {/* Profile Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-2xl">
                {currentUser ? getInitials(currentUser) : "HR"}
              </div>
 
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                     {"Mude Nava keerthi"}
                  </h2>
 
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {currentUser
                      ? roleTitle[currentUser.role] || currentUser.role
                      : "HR"}
                  </span>
                </div>
 
                <p className="mt-1 text-sm text-slate-500">
                  {"EMP0004"}
                </p>
              </div>
            </div>
 
            <div className="grid w-full grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:w-auto lg:min-w-[460px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
                  ✉
                </span>
 
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {"mudekeerthi10@gmail.com"}
                  </p>
                </div>
              </div>
 
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                  🏢
                </span>
 
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {currentUser?.department || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
 
        {/* Statistics Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
 
          <div className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Members
                </p>
 
                <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {String(totalMembersCount).padStart(2, "0")}
                </h3>
              </div>
 
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white shadow-sm">
                👥
              </span>
            </div>
 
            <p className="mt-3 text-xs font-medium text-emerald-700">
              Team overview
            </p>
          </div>
 
          <div className="group rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Managers
                </p>
 
                <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {String(managersCount).padStart(2, "0")}
                </h3>
              </div>
 
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-xl text-white shadow-sm">
                👤
              </span>
            </div>
 
            <p className="mt-3 text-xs font-medium text-orange-700">
              Management team
            </p>
          </div>
 
          <div className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Team Leads
                </p>
 
                <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {String(teamLeadsCount).padStart(2, "0")}
                </h3>
              </div>
 
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-xl text-white shadow-sm">
                👥
              </span>
            </div>
 
            <p className="mt-3 text-xs font-medium text-blue-700">
              Team leadership
            </p>
          </div>
 
          <div className="group rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Employees
                </p>
 
                <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                  {String(employeesCount).padStart(2, "0")}
                </h3>
              </div>
 
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500 text-xl text-white shadow-sm">
                👤
              </span>
            </div>
 
            <p className="mt-3 text-xs font-medium text-purple-700">
              Employee directory
            </p>
          </div>
        </section>
 
        {/* Organization Hierarchy */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                🌳
              </span>
 
              <div>
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                  Organization Hierarchy
                </h2>
 
                <p className="mt-1 text-xs text-slate-500">
                  Reporting structure and team members
                </p>
              </div>
 
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Directory ({totalMembersCount})
              </span>
            </div>
 
            <button
              type="button"
              onClick={expandAll}
              className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Expand / Collapse All
            </button>
          </div>
 
          <div className="p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="text-blue-600">↳</span>
              Organization Tree
            </div>
 
            {topLevelPeople.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No organization members found.
                </p>
 
                <p className="mt-2 text-xs text-slate-500">
                  Check whether your account has team members assigned.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {topLevelPeople.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    ancestors={[]}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
 
      </div>
    </main>
  );
} 
 