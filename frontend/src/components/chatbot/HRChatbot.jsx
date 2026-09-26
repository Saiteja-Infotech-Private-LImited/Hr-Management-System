'use client';

import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import './HRChatbot.css';
import {
  Bot,
  X,
  Minus,
  RefreshCw,
  ShieldCheck,
  Send,
  Loader2,
  Calendar,
  Clock,
  TrendingUp,
  Briefcase,
  GraduationCap,
  DollarSign,
  Users,
  ChevronRight,
  Award,
  MapPin,
  Building2,
  Timer,
  CheckCircle2,
  User,
  Video,
  Link2,
  Wallet,
  CalendarClock,
  ClipboardList,
  Undo2,
} from "lucide-react";
import api from "@/lib/axios";

/* ============================================================
   HR ASSISTANT — CHAT WIDGET (single file, role-aware)
   Renders against the hr-chatbot-* stylesheet supplied by the
   HRMS design system. Reads the logged-in user from the Redux
   auth slice itself (same shape as Navbar.jsx: state.auth.user),
   and picks its quick-action shortcuts based on role — Admin/HR
   get org-wide shortcuts (employee count, the shared pending
   leave/cancellation queue, recruitment overview), everyone else
   gets personal shortcuts (leave balance, attendance, payslip,
   training, open jobs). This mirrors the isHrOrAdmin() gates in
   ChatbotService on the backend.

   Talks to the backend through the shared axios instance at
   '@/lib/axios' (same one employeeApi/adminApi use), so auth +
   base URL + session-expiry handling are already wired up:
     POST /api/chatbot/message
     POST /api/chatbot/actions/leave/apply

   Usage:  <HRChatbot />   (no props needed — drop it in Navbar)
   ============================================================ */

const EMPLOYEE_QUICK_ACTIONS = [
  { icon: Calendar, label: "Leave balance", prompt: "What is my leave balance?" },
  { icon: Clock, label: "Today's attendance", prompt: "What is my attendance today?" },
  { icon: TrendingUp, label: "This week's attendance", prompt: "Show my attendance this week" },
  { icon: Wallet, label: "Latest payslip", prompt: "Show my latest payslip" },
  { icon: GraduationCap, label: "My training", prompt: "Show my training" },
  { icon: Briefcase, label: "Open jobs", prompt: "Show open job openings" },
];

const ADMIN_QUICK_ACTIONS = [
  { icon: Users, label: "Employee count", prompt: "How many employees do we have?" },
  { icon: ClipboardList, label: "Pending leaves", prompt: "Show pending leave requests" },
  { icon: Undo2, label: "Cancellation requests", prompt: "Show pending cancellation requests" },
  { icon: Briefcase, label: "Recruitment overview", prompt: "Show recruitment overview" },
  { icon: CalendarClock, label: "Jobs closing soon", prompt: "Show jobs closing soon" },
  { icon: Award, label: "Shortlisted candidates", prompt: "How many shortlisted candidates?" },
];

function formatClock(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

/** Turns **bold** markdown-lite text (as produced by the backend) into
 *  React nodes, preserving line breaks and simple bullet lines. */
function RichText({ text }) {
  if (!text) return null;
  const lines = String(text).split("\n");

  const renderInline = (line, key) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
      <React.Fragment key={key}>
        {parts.map((part, i) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      {lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {renderInline(line, idx)}
          {idx < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

/* ---------------------------------------------------------- */
/* LEAVE BALANCE CARDS                                         */
/* ---------------------------------------------------------- */

function LeaveBalanceCards({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="hr-chatbot-leave-cards">
      {items.map((item, i) => {
        const isUnlimited = item.remaining === "Unlimited";
        return (
          <div className="hr-chatbot-leave-card" key={i}>
            <div className="hr-chatbot-leave-card-top">
              <span>{item.leaveType}</span>
              <Calendar size={14} />
            </div>
            <div className="hr-chatbot-leave-card-number">
              {isUnlimited ? "∞" : item.remaining}
            </div>
            <div className="hr-chatbot-leave-card-label">
              {isUnlimited ? "unlimited" : "day(s) left"}
            </div>
            {!isUnlimited && (
              <div className="hr-chatbot-leave-card-meta">
                Used {item.used} of {item.total}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* TRAINING CARDS                                              */
/* ---------------------------------------------------------- */

function statusSlug(status) {
  return (status || "").toLowerCase().replace(/_/g, "-");
}

function TrainingCards({ items }) {
  if (!items) return null;

  if (items.length === 0) {
    return (
      <div className="hr-chatbot-training-empty">
        <GraduationCap size={18} />
        <div>
          <strong>No training records found</strong>
          <span>Nothing matches that filter yet — check back later.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-chatbot-training-cards">
      {items.map((t) => (
        <div className="hr-chatbot-training-card" key={t.enrollmentId}>
          <div className="hr-chatbot-training-card-header">
            <div className="hr-chatbot-training-icon">
              <GraduationCap size={16} />
            </div>
            <div className="hr-chatbot-training-title-wrap">
              <div className="hr-chatbot-training-title">{t.title}</div>
              <div className="hr-chatbot-training-category">{t.category || "General"}</div>
            </div>
            <span className={`hr-chatbot-training-status status-${statusSlug(t.trainingStatus)}`}>
              {t.trainingStatus}
            </span>
          </div>

          {t.description && (
            <div className="hr-chatbot-training-description">{t.description}</div>
          )}

          <div className="hr-chatbot-training-details">
            <div className="hr-chatbot-training-detail">
              <span className="hr-chatbot-training-detail-icon">
                <User size={12} />
              </span>
              <div>
                <small>Trainer</small>
                <strong>{t.trainer || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-training-detail">
              <span className="hr-chatbot-training-detail-icon">
                <Timer size={12} />
              </span>
              <div>
                <small>Duration</small>
                <strong>{t.durationHours ? `${t.durationHours}h` : "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-training-detail">
              <span className="hr-chatbot-training-detail-icon">
                <MapPin size={12} />
              </span>
              <div>
                <small>Venue</small>
                <strong>{t.venue || t.mode || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-training-detail">
              <span className="hr-chatbot-training-detail-icon">
                <Users size={12} />
              </span>
              <div>
                <small>Enrolled</small>
                <strong>
                  {t.enrolledCount != null ? t.enrolledCount : "—"}
                  {t.maxParticipants ? ` / ${t.maxParticipants}` : ""}
                </strong>
              </div>
            </div>
          </div>

          <div className="hr-chatbot-training-dates">
            <div className="hr-chatbot-training-date">
              <Calendar size={13} />
              <div>
                <small>Starts</small>
                <strong>{t.startDate || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-training-date-divider" />
            <div className="hr-chatbot-training-date">
              <Calendar size={13} />
              <div>
                <small>Ends</small>
                <strong>{t.endDate || "—"}</strong>
              </div>
            </div>
          </div>

          <div className="hr-chatbot-training-footer">
            {t.completed ? (
              <span className="hr-chatbot-training-completed">
                <CheckCircle2 size={14} /> Completed
              </span>
            ) : (
              <span className="hr-chatbot-training-enrollment">
                <Award size={14} /> {t.enrollmentStatus || "Enrolled"}
              </span>
            )}
            {t.score != null && (
              <span className="hr-chatbot-training-score">
                <Award size={12} /> <strong>{t.score}</strong>/100
              </span>
            )}
          </div>

          {t.completedAt && (
            <div className="hr-chatbot-training-completed-date">
              <CheckCircle2 size={13} /> Completed on {String(t.completedAt).slice(0, 10)}
            </div>
          )}

          {t.feedback && (
            <div className="hr-chatbot-training-feedback">
              <strong>Feedback</strong>
              <span>{t.feedback}</span>
            </div>
          )}

          {t.meetingLink && (
            <a
              className="hr-chatbot-training-link"
              href={t.meetingLink}
              target="_blank"
              rel="noreferrer"
            >
              <Video size={14} /> Join session
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* RECRUITMENT / JOB CARDS                                     */
/* ---------------------------------------------------------- */

function JobCards({ items }) {
  if (!items) return null;

  if (items.length === 0) {
    return (
      <div className="hr-chatbot-recruitment-empty">
        <Briefcase size={18} />
        <div>
          <strong>No matching openings</strong>
          <span>Try a broader search, like "show open jobs".</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-chatbot-recruitment-cards">
      {items.map((job) => (
        <div className="hr-chatbot-recruitment-card" key={job.id}>
          <div className="hr-chatbot-recruitment-card-header">
            <div className="hr-chatbot-recruitment-icon">
              <Briefcase size={16} />
            </div>
            <div className="hr-chatbot-recruitment-title-wrap">
              <div className="hr-chatbot-recruitment-title">{job.title}</div>
              <div className="hr-chatbot-recruitment-department">{job.department}</div>
            </div>
            <span className={`hr-chatbot-recruitment-status status-${statusSlug(job.status)}`}>
              {job.status}
            </span>
          </div>

          <div className="hr-chatbot-recruitment-meta-grid">
            <div className="hr-chatbot-recruitment-meta">
              <MapPin size={13} />
              <div>
                <small>Location</small>
                <strong>{job.location || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-recruitment-meta">
              <Building2 size={13} />
              <div>
                <small>Type</small>
                <strong>{job.employmentType || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-recruitment-meta">
              <Award size={13} />
              <div>
                <small>Experience</small>
                <strong>{job.experienceRequired || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-recruitment-meta">
              <DollarSign size={13} />
              <div>
                <small>Salary</small>
                <strong>{job.salaryRange || "—"}</strong>
              </div>
            </div>
          </div>

          {job.applicationDeadline && (
            <div className="hr-chatbot-recruitment-deadline">
              <CalendarClock size={14} />
              Apply by <span>{job.applicationDeadline}</span>
            </div>
          )}

          {job.description && (
            <div className="hr-chatbot-recruitment-section">
              <small>Description</small>
              <p>{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <div className="hr-chatbot-recruitment-section">
              <small>Requirements</small>
              <p>{job.requirements}</p>
            </div>
          )}

          <div className="hr-chatbot-recruitment-footer">
            <span>Applications received</span>
            <strong>{job.applicationCount ?? 0}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* REFERRAL / APPLICANT CARDS                                  */
/* ---------------------------------------------------------- */

function ReferralCards({ items }) {
  if (!items) return null;

  if (items.length === 0) {
    return (
      <div className="hr-chatbot-recruitment-empty">
        <Users size={18} />
        <div>
          <strong>No referrals yet</strong>
          <span>Candidates you refer will show up here.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-chatbot-referral-cards">
      {items.map((r) => (
        <div className="hr-chatbot-referral-card" key={r.id}>
          <div className="hr-chatbot-referral-header">
            <div className="hr-chatbot-referral-avatar">
              <User size={15} />
            </div>
            <div className="hr-chatbot-referral-title-wrap">
              <div className="hr-chatbot-referral-name">{r.candidateName}</div>
              <div className="hr-chatbot-referral-position">{r.jobTitle}</div>
            </div>
            <span className="hr-chatbot-referral-status">{r.status}</span>
          </div>

          <div className="hr-chatbot-referral-details">
            <div className="hr-chatbot-referral-detail">
              <Building2 size={12} />
              <div>
                <small>Department</small>
                <strong>{r.department || "—"}</strong>
              </div>
            </div>
            <div className="hr-chatbot-referral-detail">
              <Award size={12} />
              <div>
                <small>Experience</small>
                <strong>
                  {r.experienceYears || 0}y {r.experienceMonths || 0}m
                </strong>
              </div>
            </div>
            {r.interviewDate && (
              <div className="hr-chatbot-referral-detail">
                <Calendar size={12} />
                <div>
                  <small>Interview</small>
                  <strong>{r.interviewDate}</strong>
                </div>
              </div>
            )}
            {r.interviewerName && (
              <div className="hr-chatbot-referral-detail">
                <User size={12} />
                <div>
                  <small>Interviewer</small>
                  <strong>{r.interviewerName}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="hr-chatbot-referral-footer">
            <Link2 size={12} />
            Applied {r.appliedAt ? String(r.appliedAt).slice(0, 10) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* MESSAGE BUBBLE                                               */
/* ---------------------------------------------------------- */

function bubbleClassFor(type) {
  switch (type) {
    case "LEAVE_BALANCE":
      return "leave-balance";
    case "TRAINING":
      return "training-message";
    case "RECRUITMENT":
      return "recruitment-message";
    default:
      return "";
  }
}

function BotMessage({ message }) {
  const data = message.data || {};
  const extraClass = bubbleClassFor(data.type);

  return (
    <div className="hr-chatbot-message-row bot">
      <div className="hr-chatbot-message-avatar">
        <Bot size={14} />
      </div>
      <div className="hr-chatbot-message-content">
        <div className={`hr-chatbot-bubble ${extraClass}`.trim()}>
          <RichText text={message.text} />

          {data.type === "LEAVE_BALANCE" && <LeaveBalanceCards items={data.leaveBalances} />}
          {data.type === "TRAINING" && <TrainingCards items={data.trainings} />}
          {data.type === "RECRUITMENT" && data.jobs && <JobCards items={data.jobs} />}
          {data.type === "RECRUITMENT" && data.recruitmentApplications && (
            <ReferralCards items={data.recruitmentApplications} />
          )}
        </div>
        <div className="hr-chatbot-message-time">{formatClock(message.timestamp)}</div>
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="hr-chatbot-message-row user">
      <div className="hr-chatbot-user-avatar">YOU</div>
      <div className="hr-chatbot-message-content">
        <div className="hr-chatbot-bubble">{message.text}</div>
        <div className="hr-chatbot-message-time">{formatClock(message.timestamp)}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="hr-chatbot-message-row bot">
      <div className="hr-chatbot-message-avatar">
        <Bot size={14} />
      </div>
      <div className="hr-chatbot-typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

/* ============================================================
   MAIN WIDGET
   ============================================================ */

export default function HRChatbot({
  defaultOpen = false,
  defaultTheme = "light",
}) {
  // Reads the same auth slice Navbar.jsx uses, so this component is
  // fully self-contained — just drop <HRChatbot /> in, no props needed.
  const { user } = useSelector((state) => state.auth);

  const role = (user?.role || "EMPLOYEE").toUpperCase();
  const isAdmin = role === "ADMIN" || role === "HR";
  const employeeName = user?.name?.split(" ")[0] || "there";

  const quickActions = isAdmin ? ADMIN_QUICK_ACTIONS : EMPLOYEE_QUICK_ACTIONS;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [theme, setTheme] = useState(defaultTheme);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const hasGreeted = useRef(false);

  const roleLabel = role;
  const roleClass = `role-${roleLabel.toLowerCase()}`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isOpen]);

  // Uses the shared axios instance (lib/axios.js): it already injects the
  // JWT from sessionStorage, points at NEXT_PUBLIC_API_BASE_URL, and hands
  // 401s off to the app's existing session-expiry handling.
  //
  // These are plain functions rather than manually useCallback-wrapped:
  // the project has the React Compiler enabled, which auto-memoizes
  // function values itself and errors on hand-written dependency arrays
  // it can't reconcile with what it infers (react-hooks/preserve-manual-
  // memoization). Letting the compiler handle memoization avoids that.
  const callChatbot = async (text) => {
    const res = await api.post("/api/chatbot/message", { message: text });
    const payload = res.data;
    // Backend wraps the MessageResponse in an ApiResponse envelope.
    return payload && payload.data ? payload.data : payload;
  };

  const pushBotMessage = (data) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}-${Math.random()}`,
        sender: "bot",
        text: data?.reply || "Sorry, I couldn't process that.",
        data,
        timestamp: new Date(),
      },
    ]);
  };

  const sendToBot = async (text) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callChatbot(text);
      pushBotMessage(data);
    } catch (err) {
      const status = err?.response?.status;

      // A 401 is already handled globally by the axios response
      // interceptor (session-expired toast + redirect to login),
      // so avoid piling on a second, confusing error here.
      if (status !== 401) {
        setError("The HR Assistant is unreachable right now. Please try again.");
        pushBotMessage({
          reply: "I'm having trouble reaching the HR system right now. Please try again in a moment.",
          type: "TEXT",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Greet once, the first time the window is opened.
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      sendToBot("hi");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Clears the conversation and re-greets, as a fresh session.
  const handleRefresh = () => {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendToBot("hi");
  };

  const handleSend = (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendToBot(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  };

  /* ------------------------------------------------------ */
  /* CLOSED — LAUNCHER PILL                                  */
  /* ------------------------------------------------------ */

  if (!isOpen) {
    return (
      <button
        type="button"
        className={`hr-chatbot-launcher ${theme === "dark" ? "dark" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open HR Assistant"
      >
        <span className="hr-chatbot-launcher-glow" />
        <span className="hr-chatbot-launcher-icon">
          <Bot size={17} />
          <span className="hr-chatbot-online-dot" />
        </span>
        <span className="hr-chatbot-launcher-text">Ask HR Assistant</span>
      </button>
    );
  }

  /* ------------------------------------------------------ */
  /* OPEN — WINDOW                                            */
  /* ------------------------------------------------------ */

  return (
    <div
      className={`hr-chatbot-wrapper ${theme === "dark" ? "dark" : ""} ${roleClass} ${
        isMinimized ? "minimized" : ""
      }`}
    >
      <style>{`
        .hr-chatbot-spin { animation: hrc-spin 0.8s linear infinite; }
        @keyframes hrc-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="hr-chatbot-window">
        {/* ---------- header ---------- */}
        <div className="hr-chatbot-header">
          <div className="hr-chatbot-header-left">
            <div className="hr-chatbot-avatar">
              <Bot size={18} />
              <span className="hr-chatbot-avatar-status" />
            </div>
            <div className="hr-chatbot-header-info">
              <div className="hr-chatbot-title-row">
                <h3>HR Assistant</h3>
                <span className="hr-chatbot-ai-badge">AI</span>
              </div>
              <p>Online · answers in seconds</p>
            </div>
          </div>

          <div className="hr-chatbot-header-actions">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              aria-label="Refresh conversation"
              title="Refresh conversation"
            >
              <RefreshCw size={16} className={loading ? "hr-chatbot-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized((m) => !m)}
              aria-label={isMinimized ? "Expand" : "Minimize"}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* ---------- security strip ---------- */}
            <div className="hr-chatbot-security-strip">
              <span className="hr-chatbot-security-icon">
                <ShieldCheck size={14} />
              </span>
              <span>Answers use your own HRMS records only</span>
              <span className="hr-chatbot-role-pill">{roleLabel}</span>
            </div>

            {/* ---------- messages ---------- */}
            <div className="hr-chatbot-messages" ref={scrollRef}>
              {messages.length === 0 && !loading && (
                <div className="hr-chatbot-welcome-name">Hi {employeeName} 👋</div>
              )}

              {messages.map((m) =>
                m.sender === "bot" ? (
                  <BotMessage key={m.id} message={m} />
                ) : (
                  <UserMessage key={m.id} message={m} />
                )
              )}

              {loading && <TypingIndicator />}
            </div>

            {/* ---------- quick actions ---------- */}
            {messages.filter((m) => m.sender === "user").length === 0 && (
              <div className="hr-chatbot-quick-section">
                <div className="hr-chatbot-section-label">
                  <span>Quick actions</span>
                </div>
                <div className="hr-chatbot-quick-grid">
                  {quickActions.map((qa, i) => {
                    const Icon = qa.icon || MessageCircleFallback;
                    return (
                      <button
                        key={i}
                        type="button"
                        className="hr-chatbot-quick-card"
                        disabled={loading}
                        onClick={() => handleSend(qa.prompt)}
                      >
                        <span className="hr-chatbot-quick-icon">
                          <Icon size={14} />
                        </span>
                        <span>{qa.label}</span>
                        <ChevronRight size={14} className="hr-chatbot-quick-arrow" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------- input ---------- */}
            <div className="hr-chatbot-input-area">
              <div className="hr-chatbot-input-box">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask about leave, attendance, payroll…"
                  value={input}
                  disabled={loading}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="hr-chatbot-send-button"
                  disabled={loading || !input.trim()}
                  onClick={() => handleSend()}
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2 size={15} className="hr-chatbot-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
              <div className="hr-chatbot-input-footer">
                <span>{error ? error : "Enter to send · Shift+Enter for a new line"}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Fallback icon in case a custom quick action omits one.
function MessageCircleFallback(props) {
  return <Bot {...props} />;
}