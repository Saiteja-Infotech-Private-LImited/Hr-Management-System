"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://hrms.saitejainfotechprivatelimited.com/";

/* ---------- constants ---------- */

const ROLE = {
  ADMIN: { label: "Administrator", avatar: "bg-slate-600", badge: "bg-slate-100 text-slate-700" },
  HR: { label: "HR Manager", avatar: "bg-blue-600", badge: "bg-blue-50 text-blue-700" },
  MANAGER: { label: "Manager", avatar: "bg-violet-500", badge: "bg-violet-50 text-violet-700" },
  TEAM_LEAD: { label: "Team Leader", avatar: "bg-sky-500", badge: "bg-sky-50 text-sky-700" },
  EMPLOYEE: { label: "Employee", avatar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
};

const roleOf = (role) =>
  ROLE[role] || { label: role || "Member", avatar: "bg-slate-500", badge: "bg-slate-100 text-slate-700" };

/* ---------- helpers ---------- */

const fullName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(" ") || "Unknown";

const initials = (p) =>
  fullName(p)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const matches = (p, q) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return [fullName(p), p.email, p.employeeId, p.department]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(s));
};

const byName = (a, b) => fullName(a).localeCompare(fullName(b));

/* ---------- small components ---------- */

function Avatar({ person, size = "h-11 w-11 text-sm" }) {
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full font-bold text-white ${roleOf(person?.role).avatar}`}
      aria-hidden="true"
    >
      {initials(person)}
    </div>
  );
}

function RoleBadge({ role }) {
  const r = roleOf(role);
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.badge}`}>{r.label}</span>
  );
}

function CopyEmail({ email }) {
  const [copied, setCopied] = useState(false);
  if (!email) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex gap-2">
      <a
        href={`mailto:${email}`}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Send email
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {copied ? "Copied" : "Copy email"}
      </button>
    </div>
  );
}

function MemberCard({ person, isYou = false }) {
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border p-4 ${isYou ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-white"
        }`}
    >
      <div className="flex items-start gap-3">
        <Avatar person={person} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{fullName(person)}</h3>
            {isYou && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                You
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{person.employeeId || "No employee ID"}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500" title={person.email}>
            {person.email || "No email"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{person.department || "No department"}</span>
        <RoleBadge role={person.role} />
      </div>

      {!isYou && <CopyEmail email={person.email} />}
    </article>
  );
}

/* Vertical path from the top of the organisation down to the signed-in user */
function ReportingLine({ chain, meId }) {
  return (
    <ol className="relative">
      {chain.map((person, i) => {
        const isYou = person.id === meId;
        const isLast = i === chain.length - 1;

        return (
          <li key={person.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[21px] top-11 h-[calc(100%-2.75rem)] w-0.5 bg-blue-100"
                aria-hidden="true"
              />
            )}

            <Avatar person={person} />

            <div
              className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${isYou ? "border-blue-300 bg-blue-50/60" : "border-slate-200 bg-white"
                }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{fullName(person)}</p>
                  {isYou && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      You
                    </span>
                  )}
                </div>
                <RoleBadge role={person.role} />
              </div>

              <p className="mt-1 break-all text-xs text-slate-500">
                {person.email || "No email"}
              </p>

              {!isYou && person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Send email
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* Manager view: a team leader with their employees underneath */
function TeamLeadGroup({ lead, employees, query }) {
  const [open, setOpen] = useState(false);
  const visible = employees.filter((e) => matches(e, query));
  const forceOpen = Boolean(query) && visible.length > 0;
  const isOpen = open || forceOpen;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar person={lead} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{fullName(lead)}</p>
            <p className="truncate text-xs text-slate-500">{lead.email || "No email"}</p>
          </div>
        </div>
        <RoleBadge role={lead.role} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyEmail email={lead.email} />
        {employees.some((e) => e.email) && (
          <a
            href={`mailto:${[lead.email, ...employees.map((e) => e.email)]
              .filter(Boolean)
              .join(",")}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Email whole team
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={isOpen}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-left text-sm font-semibold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span>Employees ({employees.length})</span>
        <span className="text-lg leading-none">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="mt-3 grid gap-3 border-l-2 border-blue-100 pl-4 sm:grid-cols-2">
          {visible.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500 sm:col-span-2">
              No employees assigned yet.
            </p>
          ) : (
            visible.map((e) => <MemberCard key={e.id} person={e} />)
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <main className="min-h-screen bg-[#F5F8FD] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] animate-pulse space-y-5">
        <div className="h-28 rounded-2xl bg-slate-200/70" />
        <div className="h-36 rounded-2xl bg-slate-200/70" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-200/70" />
      </div>
    </main>
  );
}

/* ---------- page ---------- */

export default function MyTeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadTeam() {
      try {
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setCurrentEmail((user.email || user.username || "").toLowerCase());
          } catch {
            /* ignore invalid stored user */
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

        if (!response.ok) throw new Error(`Unable to load your team (HTTP ${response.status}).`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("The server sent an unexpected response.");

        setMembers(data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Unable to load your team.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTeam();
    return () => controller.abort();
  }, []);

  /* Everything the page shows is derived from the signed-in person */
  const view = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m]));
    const me = members.find((m) => currentEmail && m.email?.toLowerCase() === currentEmail) || null;

    if (!me) return { me: null };

    const teamLead = me.role === "EMPLOYEE" ? byId.get(me.teamLeaderId) : null;
    const manager =
      me.role === "MANAGER" || me.role === "HR"
        ? null
        : byId.get(me.managerId) || (teamLead && byId.get(teamLead.managerId)) || null;
    const hr =
      me.role === "HR"
        ? null
        : byId.get(me.hrId) || (manager && byId.get(manager.hrId)) || null;

    // Top-down path ending with the signed-in person
    const chain = [];
    [hr, manager, teamLead, me].forEach((p) => {
      if (p && !chain.some((c) => c.id === p.id)) chain.push(p);
    });

    let peers = [];
    let reports = [];
    let totalBelow = 0;

    if (me.role === "EMPLOYEE") {
      peers = members
        .filter(
          (m) =>
            m.id !== me.id &&
            m.role === "EMPLOYEE" &&
            (me.teamLeaderId ? m.teamLeaderId === me.teamLeaderId : m.managerId === me.managerId)
        )
        .sort(byName);
    } else if (me.role === "TEAM_LEAD") {
      reports = members
        .filter((m) => m.role === "EMPLOYEE" && m.teamLeaderId === me.id)
        .sort(byName);
      totalBelow = reports.length;
      peers = members
        .filter((m) => m.id !== me.id && m.role === "TEAM_LEAD" && m.managerId === me.managerId)
        .sort(byName);
    } else if (me.role === "MANAGER") {
      reports = members
        .filter((m) => m.role === "TEAM_LEAD" && m.managerId === me.id)
        .sort(byName);
      totalBelow = members.filter(
        (m) => m.role === "EMPLOYEE" && reports.some((l) => l.id === m.teamLeaderId)
      ).length;
    }

    return { me, teamLead, manager, hr, chain, peers, reports, totalBelow, byId };
  }, [members, currentEmail]);

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-slate-50 p-8">
        <h1 className="text-xl font-bold text-slate-800">We couldn’t load your team</h1>
        <p className="max-w-md text-center text-sm text-red-600">{error}</p>
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

  const { me, teamLead, manager, chain, peers, reports, totalBelow } = view;

  if (!me) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-slate-50 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-800">We couldn’t find your profile</h1>
        <p className="max-w-md text-sm text-slate-500">
          Your account isn’t in the team list yet. Sign out and sign in again, or ask HR to check
          your reporting details.
        </p>
      </main>
    );
  }

  const isEmployee = me.role === "EMPLOYEE";
  const isLead = me.role === "TEAM_LEAD";
  const isManager = me.role === "MANAGER";

  // Stat cards change with the role of the person who is signed in
  const stats = isEmployee
    ? [
      { label: "Teammates", value: peers.length, hint: "Same team leader", tone: "emerald" },
      { label: "Team leader", value: teamLead ? fullName(teamLead) : "Not assigned", hint: "Your first point of contact", tone: "sky", text: true },
      { label: "Manager", value: manager ? fullName(manager) : "Not assigned", hint: "Your department head", tone: "violet", text: true },
      { label: "Department", value: me.department || "Not set", hint: "Where you work", tone: "orange", text: true },
    ]
    : isLead
      ? [
        { label: "Direct reports", value: reports.length, hint: "Employees in your team", tone: "emerald" },
        { label: "Fellow team leaders", value: peers.length, hint: "Under the same manager", tone: "sky" },
        { label: "Manager", value: manager ? fullName(manager) : "Not assigned", hint: "You report to", tone: "violet", text: true },
        { label: "Department", value: me.department || "Not set", hint: "Where you work", tone: "orange", text: true },
      ]
      : [
        { label: "Team leaders", value: reports.length, hint: "Report to you", tone: "sky" },
        { label: "Employees", value: totalBelow, hint: "Across all your teams", tone: "emerald" },
        { label: "Total team", value: reports.length + totalBelow, hint: "Everyone under you", tone: "violet" },
        { label: "Department", value: me.department || "Not set", hint: "Where you work", tone: "orange", text: true },
      ];

  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    sky: "border-sky-100 bg-sky-50/60 text-sky-700",
    violet: "border-violet-100 bg-violet-50/60 text-violet-700",
    orange: "border-orange-100 bg-orange-50/60 text-orange-700",
  };

  const listTitle = isEmployee ? "My teammates" : isLead ? "My team" : "My teams";
  const listSubtitle = isEmployee
    ? "People who work with the same team leader as you"
    : isLead
      ? "Employees who report to you"
      : "Team leaders who report to you, with their employees";

  const filteredPeers = peers.filter((p) => matches(p, query));
  const filteredReports = reports.filter((r) =>
    isManager
      ? matches(r, query) ||
      members.some((e) => e.teamLeaderId === r.id && matches(e, query))
      : matches(r, query)
  );

  const flatList = isEmployee ? filteredPeers : isLead ? filteredReports : [];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F5F8FD] p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        {/* Greeting */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {greeting()}, {me.firstName || fullName(me)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEmployee
                ? "See who you report to and who you work with."
                : isLead
                  ? "See who you report to and who is on your team."
                  : "See your teams and who you report to."}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-2.5 text-right">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-sm font-bold text-slate-800">{today}</p>
          </div>
        </section>

        {/* Profile */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar person={me} size="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">{fullName(me)}</h2>
                  <RoleBadge role={me.role} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{me.employeeId || "No employee ID"}</p>
              </div>
            </div>

            <dl className="grid w-full grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:w-auto lg:min-w-[460px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div className="min-w-0">
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-sm font-semibold text-slate-800">{me.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Department</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-800">{me.department || "—"}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-2xl border p-5 ${tones[s.tone]}`}>
              <p className="text-sm font-medium text-slate-600">{s.label}</p>
              <p
                className={`mt-3 font-extrabold text-slate-900 ${s.text ? "truncate text-lg" : "text-3xl"
                  }`}
                title={s.text ? String(s.value) : undefined}
              >
                {s.text ? s.value : String(s.value).padStart(2, "0")}
              </p>
              <p className="mt-2 text-xs font-medium">{s.hint}</p>
            </div>
          ))}
        </section>

        {/* Main content: reporting line + team */}
        <section className="grid gap-5 lg:grid-cols-[minmax(300px,380px)_1fr]">
          {/* Reporting line */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-extrabold text-slate-900">Who I report to</h2>
            <p className="mb-5 mt-1 text-xs text-slate-500">
              Your reporting line, from the top down to you
            </p>

            {chain.length <= 1 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-xs text-slate-500">
                No reporting line is set up for you yet. Ask HR to assign your team leader and manager.
              </p>
            ) : (
              <ReportingLine chain={chain} meId={me.id} />
            )}
          </div>

          {/* Team */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{listTitle}</h2>
                <p className="mt-1 text-xs text-slate-500">{listSubtitle}</p>
              </div>

              <label className="relative w-full sm:w-64">
                <span className="sr-only">Search team members</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email or ID"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                />
              </label>
            </div>

            <div className="mt-5 space-y-3">
              {/* Employee / team lead: card grid */}
              {!isManager &&
                (flatList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    {query
                      ? `No one matches “${query}”.`
                      : isEmployee
                        ? "You don’t have any teammates assigned yet."
                        : "No employees are assigned to you yet."}
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {flatList.map((p) => (
                      <MemberCard key={p.id} person={p} />
                    ))}
                  </div>
                ))}

              {/* Manager: team leaders, each expandable */}
              {isManager &&
                (filteredReports.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                    {query ? `No one matches “${query}”.` : "No team leaders are assigned to you yet."}
                  </p>
                ) : (
                  filteredReports.map((lead) => (
                    <TeamLeadGroup
                      key={lead.id}
                      lead={lead}
                      query={query}
                      employees={members
                        .filter((m) => m.role === "EMPLOYEE" && m.teamLeaderId === lead.id)
                        .sort(byName)}
                    />
                  ))
                ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}