
"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://hrms.saitejainfotechprivatelimited.com";

/* Reusable employee card */
function PersonCard({
  person,
  isYou,
  title,
  membersContent = [],
  expandable = false,
  expanded = {},
  onToggle,
}) {
  const you = isYou(person);
  const isOpen = Boolean(expanded[person.id]);

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        you
          ? "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950"
          : "border-blue-200 bg-blue-50 dark:border-slate-600 dark:bg-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {[person?.firstName, person?.lastName]
                .filter(Boolean)
                .join(" ") || "Unknown"}
            </h3>

            {you && (
              <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                You
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {person.employeeId || "—"} · {person.email || "—"}
          </p>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {person.department || "—"}
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-800 dark:bg-slate-700 dark:text-gray-100">
          {person.role?.replaceAll("_", " ") || "—"}
        </span>
      </div>

      {expandable && (
        <button
          type="button"
          onClick={() => onToggle(person.id)}
          aria-expanded={isOpen}
          className="mt-4 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-800 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-700"
        >
          <span>
            {title} ({membersContent.length})
          </span>

          <span aria-hidden="true">
            {isOpen ? "▲" : "▼"}
          </span>
        </button>
      )}

      {expandable && isOpen && (
        <div className="ml-2 mt-4 space-y-4 border-l-2 border-gray-200 pl-4 dark:border-slate-600">
          {membersContent.length > 0 ? (
            membersContent
          ) : (
            <p className="py-2 text-sm text-gray-500 dark:text-gray-400">
              No assigned members.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      Loading your team...
    </main>
  );
}

function ErrorView({ error }) {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
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

export default function MyTeamPage() {
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTeam() {
      try {
        const token = sessionStorage.getItem("accessToken");
        const storedUser = sessionStorage.getItem("user");

        try {
          setCurrentUser(JSON.parse(storedUser || "{}"));
        } catch {
          setCurrentUser({});
        }

        const response = await fetch(`${API_URL}/api/my-team`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        if (!response.ok) {
          throw new Error(
            `Unable to load your team (HTTP ${response.status}).`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid team response from server.");
        }

        if (!controller.signal.aborted) {
          setMembers(data);
        }
      } catch (err) {
        if (!controller.signal.aborted && err.name !== "AbortError") {
          setError(err.message || "Unable to load your team.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchTeam();

    return () => controller.abort();
  }, []);

  const byId = useMemo(
    () => new Map(members.map((person) => [String(person.id), person])),
    [members]
  );

  const currentEmail = String(currentUser.email || "").toLowerCase();
  const currentDatabaseId = currentUser.id ?? currentUser.userId;
  const currentEmployeeId = currentUser.employeeId;
  const currentCode =
    currentUser.employeeCode ?? currentUser.employeeNumber;

  function isYou(person) {
    if (!person) return false;

    if (currentEmail && person.email) {
      return person.email.toLowerCase() === currentEmail;
    }

    if (
      currentDatabaseId != null &&
      String(person.id) === String(currentDatabaseId)
    ) {
      return true;
    }

    if (
      currentEmployeeId &&
      String(person.employeeId) === String(currentEmployeeId)
    ) {
      return true;
    }

    return Boolean(
      currentCode &&
        person.employeeId &&
        String(person.employeeId).toLowerCase() ===
          String(currentCode).toLowerCase()
    );
  }

  const me = members.find(isYou);

  const role = String(me?.role || currentUser.role || "")
    .replace(/^ROLE_/, "")
    .toUpperCase();

  const getParent = (id) =>
    id == null ? null : byId.get(String(id)) || null;

  const getManager = (person) => getParent(person?.managerId);
  const getTeamLeader = (person) => getParent(person?.teamLeaderId);
  const getHR = (person) => getParent(person?.hrId);

  function fullName(person) {
    return (
      [person?.firstName, person?.lastName]
        .filter(Boolean)
        .join(" ") || "Unknown"
    );
  }

  function toggle(id) {
    setExpanded((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  }

  function card(person, title, membersContent = [], expandable = false) {
    if (!person) return null;

    return (
      <PersonCard
        key={person.id}
        person={person}
        isYou={isYou}
        title={title}
        membersContent={membersContent}
        expandable={expandable}
        expanded={expanded}
        onToggle={toggle}
      />
    );
  }

  function getEmployees(leader) {
    return members
      .filter(
        (person) =>
          String(person.role || "").replace(/^ROLE_/, "").toUpperCase() ===
            "EMPLOYEE" &&
          String(person.teamLeaderId) === String(leader.id)
      )
      .sort((a, b) => {
        // Logged-in employee appears first.
        const aIsYou = isYou(a);
        const bIsYou = isYou(b);

        if (aIsYou && !bIsYou) return -1;
        if (!aIsYou && bIsYou) return 1;

        return fullName(a).localeCompare(fullName(b));
      });
  }

  function getLeaders(manager) {
    return members
      .filter(
        (person) =>
          String(person.role || "").replace(/^ROLE_/, "").toUpperCase() ===
            "TEAM_LEADER" &&
          String(person.managerId) === String(manager.id)
      )
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }

  function getManagers(hr) {
    return members
      .filter(
        (person) =>
          String(person.role || "").replace(/^ROLE_/, "").toUpperCase() ===
            "MANAGER" &&
          String(person.hrId) === String(hr.id)
      )
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }

  function renderEmployee(employee) {
    return card(employee);
  }

  function renderLeader(leader) {
    return card(
      leader,
      "Employees",
      getEmployees(leader).map(renderEmployee),
      true
    );
  }

  function renderManager(manager) {
    return card(
      manager,
      "Team Leaders",
      getLeaders(manager).map(renderLeader),
      true
    );
  }

  function renderHR(hr) {
    return card(
      hr,
      "Managers",
      getManagers(hr).map(renderManager),
      true
    );
  }

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  if (!me) {
    return (
      <main className="min-h-screen bg-gray-50 p-8 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <h1 className="text-2xl font-bold">My Team</h1>
        <p className="mt-4 text-amber-700 dark:text-amber-300">
          Your logged-in account could not be matched with the team response.
          Check the user details saved during login.
        </p>
      </main>
    );
  }

  const manager = getManager(me);
  const teamLeader = getTeamLeader(me);
  const hr = getHR(me);

  let hierarchy = null;

  if (role === "HR") {
    hierarchy = renderHR(me);
  } else if (role === "MANAGER") {
    hierarchy = hr ? renderHR(hr) : renderManager(me);
  } else if (role === "TEAM_LEADER") {
    hierarchy = manager
      ? card(
          manager,
          "Team Leaders",
          [
            card(
              me,
              "Employees",
              getEmployees(me).map(renderEmployee),
              true
            ),
          ],
          true
        )
      : card(
          me,
          "Employees",
          getEmployees(me).map(renderEmployee),
          true
        );
  } else if (role === "EMPLOYEE") {
    const employeeManager = teamLeader
      ? getManager(teamLeader)
      : null;

    const employeeCard = card(me);

    const leaderCard = teamLeader
      ? card(
          teamLeader,
          "Employees",
          getEmployees(teamLeader).map(renderEmployee),
          true
        )
      : null;

    hierarchy =
      employeeManager && leaderCard
        ? card(employeeManager, "Team Leaders", [leaderCard], true)
        : leaderCard || employeeCard;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100 md:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mt-2 text-3xl font-bold">
          Organization Hierarchy
        </h1>

        <p className="mb-6 mt-2 text-gray-600 dark:text-gray-300">
          View your reporting structure and assigned team members.
        </p>

        <section className="space-y-5 rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-900 dark:bg-slate-800 md:p-6">
          {hierarchy || (
            <p className="text-amber-700 dark:text-amber-300">
              No hierarchy could be displayed for role {role || "unknown"}.
              Check that the assigned Manager and Team Leader are included in
              the API response.
            </p>
          )}

          {role === "EMPLOYEE" && !teamLeader && (
            <p className="text-amber-700 dark:text-amber-300">
              No Team Leader is assigned to your account. Please contact HR.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
