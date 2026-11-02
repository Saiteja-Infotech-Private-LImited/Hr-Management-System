"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://hrms.saitejainfotechprivatelimited.com";

/* ---------- constants ---------- */

const roleTitle = {
  ADMIN: "Administrator",
  HR: "HR Manager",
  MANAGER: "Manager",
  TEAM_LEAD: "Team Leader",
  EMPLOYEE: "Employee",
};

const avatarColor = {
  ADMIN: "bg-slate-700",
  HR: "bg-blue-600",
  MANAGER: "bg-violet-500",
  TEAM_LEAD: "bg-sky-500",
  EMPLOYEE: "bg-emerald-500",
};

// What each role manages (used for the expandable section label)
const childLabel = {
  ADMIN: "HR Managers",
  HR: "Managers",
  MANAGER: "Team Leaders",
  TEAM_LEAD: "Employees",
};

const childIcon = {
  ADMIN: "🛡️",
  HR: "🧑‍💼",
  MANAGER: "👥",
  TEAM_LEAD: "🧑‍💻",
};

/* ---------- helpers ---------- */

const fullName = (p) =>
  [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Unknown";

const getInitials = (p) =>
  fullName(p)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

const byName = (a, b) => fullName(a).localeCompare(fullName(b));

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
};

const matches = (p, q) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return [fullName(p), p.email, p.employeeId, p.department]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(s));
};

// Direct reports of a person, based on the role levels
function childrenOf(person, members) {
  return members
    .filter((c) => {
      if (c.id === person.id) return false;
      switch (person.role) {
        case "ADMIN":
          return c.role === "HR";
        case "HR":
          return c.role === "MANAGER" && c.hrId === person.id;
        case "MANAGER":
          return c.role === "TEAM_LEAD" && c.managerId === person.id;
        case "TEAM_LEAD":
          return c.role === "EMPLOYEE" && c.teamLeaderId === person.id;
        default:
          return false;
      }
    })
    .sort(byName);
}

function descendantsOf(person, members, seen = new Set()) {
  if (seen.has(person.id)) return [];
  seen.add(person.id);
  const kids = childrenOf(person, members);
  return kids.flatMap((k) => [k, ...descendantsOf(k, members, seen)]);
}

/* ---------- small components ---------- */

function EmailActions({ email, teamEmails = [] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const btn =
    "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {email && (
        <>
          <a href={`mailto:${email}`} className={btn}>
            Send email
          </a>
          <button type="button" onClick={copy} className={btn}>
            {copied ? "Copied" : "Copy email"}
          </button>
        </>
      )}
      {teamEmails.length > 0 && (
        <a
          href={`mailto:${teamEmails.join(",")}`}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Email whole team ({teamEmails.length})
        </a>
      )}
    </div>
  );
}

function PersonCard({ person, ctx, ancestors = [] }) {
  const { members, expandedIds, toggleExpanded, currentEmail, query, visibleIds } = ctx;

  const kids = childrenOf(person, members).filter(
    (k) => !query || visibleIds.has(k.id)
  );
  const allKids = childrenOf(person, members);
  const label = childLabel[person.role];
  const looping = ancestors.includes(person.id);
  const isYou = Boolean(currentEmail) && person.email?.toLowerCase() === currentEmail;

  // While searching, open every branch that leads to a match
  const isExpanded = expandedIds.has(person.id) || (Boolean(query) && kids.length > 0);

  const teamEmails = useMemo(
    () =>
      label
        ? descendantsOf(person, members)
          .map((d) => d.email)
          .filter(Boolean)
        : [],
    [person, members, label]
  );

  return (
    <div className="relative">
      <div
        className={`rounded-2xl border p-4 transition-all duration-200 ${isYou
            ? "border-blue-300 bg-blue-50/70 shadow-sm"
            : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
          }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor[person.role] || "bg-slate-500"
                }`}
              aria-hidden="true"
            >
              {getInitials(person)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-800">{fullName(person)}</p>
                {isYou && (
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    You
                  </span>
                )}
              </div>

              <p className="mt-1 break-all text-xs text-slate-500">
                {person.employeeId || "—"} · {person.email || "—"}
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

        {!isYou && <EmailActions email={person.email} teamEmails={teamEmails} />}

        {looping && (
          <p className="mt-3 text-xs font-medium text-red-600">
            Circular reporting relationship detected.
          </p>
        )}

        {!looping && label && (
          <button
            type="button"
            onClick={() => toggleExpanded(person.id)}
            aria-expanded={isExpanded}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-left text-sm font-semibold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{childIcon[person.role]}</span>
              {label} ({allKids.length})
            </span>
            <span className="text-lg leading-none">{isExpanded ? "−" : "+"}</span>
          </button>
        )}
      </div>

      {!looping && label && isExpanded && (
        <div className="ml-6 mt-3 space-y-3 border-l-2 border-blue-100 pl-4 sm:ml-10">
          {kids.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              No {label.toLowerCase()} assigned.
            </p>
          ) : (
            kids.map((child) => (
              <PersonCard
                key={child.id}
                person={child}
                ctx={ctx}
                ancestors={[...ancestors, person.id]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [currentEmail, setCurrentEmail] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const stored = sessionStorage.getItem("user");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            setSessionUser(user);
            setCurrentEmail((user.email || user.username || "").toLowerCase());
          } catch {
            /* ignore invalid stored user */
          }
        }

        const token = sessionStorage.getItem("accessToken");

        const res = await fetch(`${API_URL}/api/my-team`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Unable to load organization (HTTP ${res.status}).`);

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error("Invalid response received from server.");

        setMembers(data);
        // Admin and HR levels start open so the first view is useful
        setExpandedIds(
          new Set(data.filter((m) => m.role === "ADMIN" || m.role === "HR").map((m) => m.id))
        );
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Unable to load organization.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const toggleExpanded = (id) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const count = (role) => members.filter((m) => m.role === role).length;

  const admins = members.filter((m) => m.role === "ADMIN");
  const hrList = members.filter((m) => m.role === "HR").sort(byName);

  // Top of the tree: admin(s) if the API returns them, otherwise the HR managers
  const roots = admins.length > 0 ? admins : hrList;

  // People whose manager / team leader / HR is missing or not in the list
  const ids = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const unassigned = useMemo(
    () =>
      members
        .filter((m) => {
          if (m.role === "MANAGER") return !m.hrId || !ids.has(m.hrId);
          if (m.role === "TEAM_LEAD") return !m.managerId || !ids.has(m.managerId);
          if (m.role === "EMPLOYEE") return !m.teamLeaderId || !ids.has(m.teamLeaderId);
          return false;
        })
        .sort(byName),
    [members, ids]
  );

  // While searching, keep only branches that contain a match
  const visibleIds = useMemo(() => {
    const set = new Set();
    if (!query) return set;

    const walk = (person, seen) => {
      if (seen.has(person.id)) return false;
      const nextSeen = new Set(seen).add(person.id);
      let keep = matches(person, query);
      for (const kid of childrenOf(person, members)) {
        if (walk(kid, nextSeen)) keep = true;
      }
      if (keep) set.add(person.id);
      return keep;
    };

    roots.forEach((r) => walk(r, new Set()));
    return set;
  }, [query, members, roots]);

  const currentUser =
    members.find((m) => currentEmail && m.email?.toLowerCase() === currentEmail) ||
    admins[0] ||
    null;

  // The admin may not be in the team list, so fall back to the stored login info
  const profile = currentUser || sessionUser || {};

  const ctx = { members, expandedIds, toggleExpanded, currentEmail, query, visibleIds };

  const visibleRoots = query ? roots.filter((r) => visibleIds.has(r.id)) : roots;
  const visibleUnassigned = unassigned.filter((m) => matches(m, query));

  const expandAll = () => {
    const allIds = members.filter((m) => childLabel[m.role]).map((m) => m.id);
    const allOpen = allIds.every((id) => expandedIds.has(id));
    setExpandedIds(allOpen ? new Set() : new Set(allIds));
  };

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const stats = [
    { label: "Total Members", value: members.length, icon: "👥", note: "Whole organization", card: "border-emerald-100 from-emerald-50 to-teal-50", iconBg: "bg-emerald-500", noteColor: "text-emerald-700" },
    { label: "HR Managers", value: count("HR"), icon: "🧑‍💼", note: "People operations", card: "border-blue-100 from-blue-50 to-sky-50", iconBg: "bg-blue-500", noteColor: "text-blue-700" },
    { label: "Managers", value: count("MANAGER"), icon: "👤", note: "Management team", card: "border-orange-100 from-orange-50 to-amber-50", iconBg: "bg-orange-500", noteColor: "text-orange-700" },
    { label: "Team Leads", value: count("TEAM_LEAD"), icon: "👥", note: "Team leadership", card: "border-violet-100 from-violet-50 to-indigo-50", iconBg: "bg-violet-500", noteColor: "text-violet-700" },
    { label: "Employees", value: count("EMPLOYEE"), icon: "👤", note: "Employee directory", card: "border-purple-100 from-purple-50 to-fuchsia-50", iconBg: "bg-purple-500", noteColor: "text-purple-700" },
  ];

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading organization hierarchy...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-slate-800">Unable to load the organization</h1>
        <p className="text-center text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F5F8FD] p-4 font-sans text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        {/* Welcome banner */}
        <section className="relative flex min-h-[120px] flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-100 px-5 py-5 shadow-sm sm:px-7">
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
              👋
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                {greeting()}, {profile.firstName ? fullName(profile) : "Admin"}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Here&apos;s the full picture of your organization today.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3">
            <span className="text-2xl" aria-hidden="true">📅</span>
            <div>
              <p className="text-xs text-slate-500">Today</p>
              <p className="text-sm font-bold text-slate-800">{today}</p>
            </div>
          </div>

          <div className="pointer-events-none absolute right-40 top-0 hidden h-full items-center text-6xl opacity-20 xl:flex">
            🏢
          </div>
        </section>

        {/* Profile card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xl font-bold text-white shadow-md sm:h-20 sm:w-20 sm:text-2xl">
                {profile.firstName ? getInitials(profile) : "AD"}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                    {profile.firstName ? fullName(profile) : "Administrator"}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {roleTitle[profile.role] || "Administrator"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{profile.employeeId || "—"}</p>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:w-auto lg:min-w-[460px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">✉</span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                    {profile.email || profile.username || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">🏢</span>
                <div>
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {profile.department || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${s.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{s.label}</p>
                  <h3 className="mt-3 text-3xl font-extrabold text-slate-900">
                    {String(s.value).padStart(2, "0")}
                  </h3>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xl text-white shadow-sm ${s.iconBg}`}>
                  {s.icon}
                </span>
              </div>
              <p className={`mt-3 text-xs font-medium ${s.noteColor}`}>{s.note}</p>
            </div>
          ))}
        </section>

        {/* Unassigned warning, only when there is something to fix */}
        {unassigned.length > 0 && !query && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p className="font-semibold">
              {unassigned.length} {unassigned.length === 1 ? "person has" : "people have"} no reporting line
            </p>
            <p className="mt-1 text-xs text-amber-800">
              They are listed at the bottom of the organization tree. Assign their HR, manager or team leader so they appear in the right team.
            </p>
          </section>
        )}

        {/* Organization tree */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl">🌳</span>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                  Organization Hierarchy
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Administrator, HR, managers, team leaders and employees
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Directory ({members.length})
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <label className="relative min-w-[220px] flex-1 sm:flex-none">
                <span className="sr-only">Search the organization</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email or ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                />
              </label>

              <button
                type="button"
                onClick={expandAll}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Expand / Collapse All
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {visibleRoots.length === 0 && visibleUnassigned.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {query ? `No one matches “${query}”.` : "No organization records found."}
                </p>
                {!query && (
                  <p className="mt-2 text-xs text-slate-500">
                    Check that employees have roles assigned and that the API returns data.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRoots.map((person) => (
                  <PersonCard key={person.id} person={person} ctx={ctx} ancestors={[]} />
                ))}

                {visibleUnassigned.length > 0 && (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Not assigned to a team ({visibleUnassigned.length})
                    </h3>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      {visibleUnassigned.map((person) => (
                        <div key={person.id} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor[person.role] || "bg-slate-500"}`}
                              aria-hidden="true"
                            >
                              {getInitials(person)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800">{fullName(person)}</p>
                              <p className="mt-0.5 break-all text-xs text-slate-500">
                                {person.employeeId || "—"} · {person.email || "—"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {roleTitle[person.role] || person.role}
                              </p>
                            </div>
                          </div>
                          <EmailActions email={person.email} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}