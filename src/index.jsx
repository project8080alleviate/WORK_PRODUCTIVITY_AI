import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  Mail, FileText, ListTodo, Search, MessageSquare, FlaskConical, History as HistoryIcon,
  Settings as SettingsIcon, ShieldCheck, Info, Menu, X, Send, Copy, RefreshCw, Trash2, Plus,
  ChevronRight, Sparkles, Clock, CheckCircle2, AlertCircle, Sun, Moon, Monitor, ArrowRight,
  Loader2, Edit3, TrendingUp, Zap, LayoutGrid, ChevronDown, Check, ArrowLeftRight
} from "lucide-react";

/* ---------------------------------------------------------------
   THEME
--------------------------------------------------------------- */
const PALETTES = {
  light: {
    bg: "#EEF0F6", surface: "#FFFFFF", surfaceSoft: "#E9EBF4", border: "#D7DAE8",
    text: "#171423", textSoft: "#4E4A66", textFaint: "#847FA0",
    ink: "#0A0714", inkSoft: "#15112A", inkBorder: "#241D42", inkText: "#ECE9F7", inkTextSoft: "#9E97C0",
    accent: "#E5583F", accentSoft: "#FBE7E2", accentText: "#B8412C", accentBorder: "#F3C3B6",
    teal: "#6B4CE0", tealSoft: "#EBE5FB", tealText: "#4E33B8",
    danger: "#C0392B", dangerSoft: "#FBEAE8", dangerText: "#9A2E22",
    success: "#1E874B", successSoft: "#E7F5EC",
  },
  dark: {
    bg: "#0A0A0F", surface: "#131218", surfaceSoft: "#1A1920", border: "#26242E",
    text: "#F4F4F6", textSoft: "#9C9AA6", textFaint: "#6A6874",
    ink: "#08070C", inkSoft: "#121017", inkBorder: "#221F2A", inkText: "#F4F4F6", inkTextSoft: "#8E8C98",
    accent: "#E8604A", accentSoft: "#2B1A16", accentText: "#F0876F", accentBorder: "#4A2A22",
    teal: "#8B6BF0", tealSoft: "#1E1A33", tealText: "#B7A4F7",
    danger: "#E0685A", dangerSoft: "#2A1614", dangerText: "#F0968A",
    success: "#4FBE81", successSoft: "#122A1C",
  },
};
const BADGE_COLORS = [
  { bg: "rgba(78,127,255,0.16)", fg: "#7C9CFF" },
  { bg: "rgba(155,107,255,0.16)", fg: "#B294FF" },
  { bg: "rgba(240,96,155,0.16)", fg: "#F58AB4" },
  { bg: "rgba(232,96,74,0.16)", fg: "#F0876F" },
];
const ThemeCtx = createContext(PALETTES.light);
const useT = () => useContext(ThemeCtx);

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');";

/* ---------------------------------------------------------------
   AI SERVICE LAYER
--------------------------------------------------------------- */
async function callAI(system, userText) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  if (!text) throw new Error("Empty AI response");
  return text;
}

async function callAIChat(system, messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
  if (!text) throw new Error("Empty AI response");
  return text;
}

function parseJSONSafe(text) {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

const RESPONSIBLE_AI_RULES =
  "RESPONSIBLE AI RULES: Never invent facts, sources, deadlines, names, or responsibilities that are not present in the provided input. If information is missing, explicitly say so rather than guessing. Identify uncertainty where it exists. Keep output professional and workplace-appropriate. Do not claim any task has been completed in the real world -- you are only producing drafted text or analysis.";

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------- */
function Panel({ children, style, ...rest }) {
  const t = useT();
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, ...style }} {...rest}>
      {children}
    </div>
  );
}

function Btn({ children, variant = "secondary", onClick, disabled, icon: Icon, style, type = "button", title }) {
  const t = useT();
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "Inter, sans-serif",
    fontSize: 13.5, fontWeight: 600, padding: "9px 15px", borderRadius: 9, cursor: disabled ? "default" : "pointer",
    border: "1px solid transparent", transition: "opacity .15s, transform .1s", opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: { background: t.accent, color: "#FFFFFF", borderColor: t.accent },
    ink: { background: t.ink, color: t.inkText, borderColor: t.ink },
    secondary: { background: t.surface, color: t.text, borderColor: t.border },
    ghost: { background: "transparent", color: t.textSoft, borderColor: "transparent" },
    danger: { background: t.dangerSoft, color: t.dangerText, borderColor: t.dangerSoft },
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
      style={{ ...base, ...variants[variant], ...style }}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  const t = useT();
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: t.textSoft, marginBottom: 6, letterSpacing: 0.2 }}>{label}</label>}
      {children}
      {hint && <div style={{ fontSize: 11.5, color: t.textFaint, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

const inputStyle = (t) => ({
  width: "100%", boxSizing: "border-box", fontFamily: "Inter, sans-serif", fontSize: 13.5,
  padding: "10px 12px", borderRadius: 9, border: `1px solid ${t.border}`, background: t.bg, color: t.text, outline: "none",
});

function TextInput(props) { const t = useT(); return <input {...props} style={{ ...inputStyle(t), ...(props.style || {}) }} />; }
function TextArea(props) { const t = useT(); return <textarea {...props} style={{ ...inputStyle(t), resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.5, ...(props.style || {}) }} />; }

function Select({ value, onChange, options }) {
  const t = useT();
  return (
    <select value={value} onChange={onChange} style={{ ...inputStyle(t), appearance: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Pill({ children, tone = "neutral" }) {
  const t = useT();
  const tones = {
    neutral: { bg: t.surfaceSoft, color: t.textSoft },
    accent: { bg: t.accentSoft, color: t.accentText },
    teal: { bg: t.tealSoft, color: t.tealText },
    danger: { bg: t.dangerSoft, color: t.dangerText },
  };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, letterSpacing: 0.3, textTransform: "uppercase", ...tones[tone] }}>{children}</span>;
}

function Disclaimer() {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: t.accentSoft, border: `1px solid ${t.accentBorder}`, borderRadius: 10, padding: "10px 13px", marginBottom: 18 }}>
      <ShieldCheck size={15} color={t.accentText} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12, color: t.accentText, lineHeight: 1.5 }}>
        AI-generated content may contain errors, omissions, or bias. Review and verify important information before using it for professional, academic, legal, financial, or other high-impact decisions.
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  const t = useT();
  return (
    <div style={{ textAlign: "center", padding: "44px 20px", color: t.textFaint }}>
      <Icon size={26} style={{ marginBottom: 10, opacity: 0.6 }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: t.textSoft, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, maxWidth: 320, margin: "0 auto" }}>{body}</div>
    </div>
  );
}

function PulseLoader({ label }) {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 4px" }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: "50%", background: t.accent,
            animation: `waiPulse 1.1s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12.5, color: t.textSoft, fontStyle: "italic" }}>{label || "AI is thinking..."}</span>
    </div>
  );
}

function Toast({ toast }) {
  const t = useT();
  if (!toast) return null;
  return (
    <div style={{
      position: "absolute", bottom: 18, right: 18, background: t.ink, color: t.inkText,
      padding: "10px 16px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, display: "flex",
      alignItems: "center", gap: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", zIndex: 60,
    }}>
      <Check size={14} /> {toast}
    </div>
  );
}

function ErrorNote({ msg, onRetry }) {
  const t = useT();
  if (!msg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: t.dangerSoft, border: `1px solid ${t.dangerSoft}`, borderRadius: 10, padding: "10px 13px", marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <AlertCircle size={15} color={t.dangerText} />
        <span style={{ fontSize: 12.5, color: t.dangerText }}>{msg}</span>
      </div>
      {onRetry && <Btn variant="ghost" onClick={onRetry} style={{ color: t.dangerText, padding: "4px 8px" }}>Retry</Btn>}
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  const t = useT();
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 27, color: t.text, margin: "0 0 4px" }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13.5, color: t.textSoft, margin: 0, maxWidth: 560 }}>{subtitle}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------
   CONSTANTS
--------------------------------------------------------------- */
const NAV = [
  { group: "Workspace", items: [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "email", label: "Email Generator", icon: Mail },
    { id: "meeting", label: "Meeting Summarizer", icon: FileText },
    { id: "tasks", label: "Task Planner", icon: ListTodo },
    { id: "research", label: "Research Assistant", icon: Search },
    { id: "chat", label: "Workplace AI", icon: MessageSquare },
  ]},
  { group: "AI Tools", items: [
    { id: "promptlab", label: "Prompt Lab", icon: FlaskConical },
    { id: "history", label: "AI History", icon: HistoryIcon },
  ]},
  { group: "Information", items: [
    { id: "responsible", label: "Responsible AI", icon: ShieldCheck },
    { id: "about", label: "About / Learning Outcomes", icon: Info },
  ]},
  { group: "System", items: [
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]},
];

const AUDIENCES = ["Client", "Manager", "Team", "Colleague", "Executive", "Supplier", "General Professional"];
const TONES = ["Formal", "Professional", "Friendly", "Informal", "Persuasive", "Apologetic", "Appreciative", "Concise"];
const LENGTHS = ["Short", "Medium", "Detailed"];
const RESEARCH_AUDIENCES = ["Beginner", "Student", "Employee", "Manager", "Professional"];
const DEPTHS = ["Quick Overview", "Standard", "Detailed"];
const PRIORITIES = ["Urgent / Important", "Important", "Urgent", "Low Priority"];
const CATEGORIES = ["General", "Client Work", "Internal", "Admin", "Planning", "Communication"];

/* ---------------------------------------------------------------
   APP SHELL
--------------------------------------------------------------- */
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [themeMode, setThemeMode] = useState("dark");
  const [systemDark, setSystemDark] = useState(false);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [profile, setProfile] = useState({ name: "Jordan Reyes", email: "jordan.reyes@company.com", role: "Operations Manager" });
  const [aiPrefs, setAiPrefs] = useState({ tone: "Professional", length: "Medium", researchDepth: "Standard", planningStyle: "Balanced" });
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [prefill, setPrefill] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (mq) { setSystemDark(mq.matches); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("workai-state", false);
        if (r && r.value) {
          const s = JSON.parse(r.value);
          if (s.profile) setProfile(s.profile);
          if (s.aiPrefs) setAiPrefs(s.aiPrefs);
          if (s.tasks) setTasks(s.tasks);
          if (s.history) setHistory(s.history);
          if (s.chatMessages) setChatMessages(s.chatMessages);
          if (s.themeMode) setThemeMode(s.themeMode);
        }
      } catch (e) { /* no saved state yet */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      window.storage.set("workai-state", JSON.stringify({ profile, aiPrefs, tasks, history, chatMessages, themeMode }), false).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [profile, aiPrefs, tasks, history, chatMessages, themeMode, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const isDark = themeMode === "dark" || (themeMode === "system" && systemDark);
  const pal = isDark ? PALETTES.dark : PALETTES.light;

  const addHistory = useCallback((tool, title, input, output) => {
    setHistory(h => [{ id: Date.now() + Math.random(), tool, title, date: new Date().toISOString(), input, output }, ...h].slice(0, 200));
  }, []);

  const goTo = (pg, pf) => { setPage(pg); setMobileNav(false); if (pf) setPrefill(pf); };

  const stats = {
    tasksCompleted: tasks.filter(x => x.completed).length,
    tasksRemaining: tasks.filter(x => !x.completed).length,
    aiGenerations: history.length,
    emailsGenerated: history.filter(h => h.tool === "Email Generator").length,
    meetingsSummarized: history.filter(h => h.tool === "Meeting Summarizer").length,
  };

  const pageProps = { goTo, addHistory, toast: setToast, tasks, setTasks, aiPrefs, profile, chatMessages, setChatMessages, prefill, setPrefill, history, setHistory, stats };

  return (
    <ThemeCtx.Provider value={pal}>
      <div style={{ fontFamily: "Inter, sans-serif", background: pal.bg, color: pal.text, minHeight: 600, display: "flex", position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${pal.border}` }}>
        <style>{`
          ${FONT_IMPORT}
          * { box-sizing: border-box; }
          ::placeholder { color: ${pal.textFaint}; }
          select { color: ${pal.text}; }
          @keyframes waiPulse { 0%,100% { opacity: .25; transform: scale(0.7);} 50% { opacity: 1; transform: scale(1);} }
          @keyframes waiFade { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
          .waiFadeIn { animation: waiFade .25s ease; }
          .waiScroll::-webkit-scrollbar { width: 8px; }
          .waiScroll::-webkit-scrollbar-thumb { background: ${pal.border}; border-radius: 8px; }
        `}</style>

        {/* Sidebar (desktop) */}
        <aside style={{
          width: 232, flexShrink: 0, background: pal.ink, borderRight: `1px solid ${pal.inkBorder}`,
          display: "flex", flexDirection: "column", padding: "18px 12px",
        }} className="waiSidebarDesktop">
          <SidebarContent page={page} goTo={goTo} pal={pal} profile={profile} />
        </aside>

        {/* Mobile drawer */}
        {mobileNav && (
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
            <div onClick={() => setMobileNav(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
            <aside style={{ position: "relative", width: 240, background: pal.ink, padding: "18px 12px", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <button onClick={() => setMobileNav(false)} style={{ background: "none", border: "none", color: pal.inkText, cursor: "pointer" }}><X size={18} /></button>
              </div>
              <SidebarContent page={page} goTo={goTo} pal={pal} profile={profile} />
            </aside>
          </div>
        )}

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${pal.border}` }} className="waiTopbarMobile">
            <button onClick={() => setMobileNav(true)} style={{ background: "none", border: "none", color: pal.text, cursor: "pointer" }}><Menu size={20} /></button>
            <span style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 15 }}>WorkAI</span>
            <div style={{ width: 20 }} />
          </div>

          <div className="waiScroll" style={{ flex: 1, overflowY: "auto", padding: "26px 30px 60px", position: "relative" }}>
            {page === "dashboard" && <Dashboard {...pageProps} />}
            {page === "email" && <EmailGenerator {...pageProps} />}
            {page === "meeting" && <MeetingSummarizer {...pageProps} />}
            {page === "tasks" && <TaskPlanner {...pageProps} />}
            {page === "research" && <ResearchAssistant {...pageProps} />}
            {page === "chat" && <WorkplaceChat {...pageProps} />}
            {page === "promptlab" && <PromptLab {...pageProps} />}
            {page === "history" && <HistoryPage {...pageProps} />}
            {page === "responsible" && <ResponsibleAI />}
            {page === "about" && <About />}
            {page === "settings" && <SettingsPage profile={profile} setProfile={setProfile} aiPrefs={aiPrefs} setAiPrefs={setAiPrefs} themeMode={themeMode} setThemeMode={setThemeMode} setHistory={setHistory} setTasks={setTasks} setChatMessages={setChatMessages} toast={setToast} />}
          </div>
          <Toast toast={toast} />
        </main>

        <style>{`
          @media (max-width: 820px) {
            .waiSidebarDesktop { display: none !important; }
            .waiTopbarMobile { display: flex !important; }
          }
        `}</style>
      </div>
    </ThemeCtx.Provider>
  );
}

function SidebarContent({ page, goTo, pal, profile }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 10px 20px" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: pal.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 16.5, color: pal.inkText, lineHeight: 1.1 }}>WorkAI</div>
          <div style={{ fontSize: 10, color: pal.inkTextSoft, letterSpacing: 0.3 }}>Workplace Productivity</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {NAV.map(g => (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: pal.inkTextSoft, letterSpacing: 1, textTransform: "uppercase", padding: "0 10px", marginBottom: 6 }}>{g.group}</div>
            {g.items.map(it => {
              const active = page === it.id;
              const Icon = it.icon;
              return (
                <button key={it.id} onClick={() => goTo(it.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
                  background: active ? pal.inkSoft : "transparent", color: active ? pal.inkText : pal.inkTextSoft,
                  fontSize: 13, fontWeight: active ? 600 : 500, fontFamily: "Inter, sans-serif",
                }}>
                  <Icon size={15} /> {it.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${pal.inkBorder}`, paddingTop: 12, display: "flex", alignItems: "center", gap: 9, padding: "12px 10px 4px" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: pal.inkSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, color: pal.inkText }}>
          {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: pal.inkText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
          <div style={{ fontSize: 10.5, color: pal.inkTextSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.role}</div>
        </div>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD
--------------------------------------------------------------- */
function Dashboard({ goTo, stats, profile, tasks }) {
  const t = useT();
  const firstName = profile.name.split(" ")[0];
  const cards = [
    { id: "email", title: "Generate an Email", body: "Turn workplace context into a professional email.", icon: Mail },
    { id: "meeting", title: "Summarize a Meeting", body: "Extract important information from meeting notes.", icon: FileText },
    { id: "tasks", title: "Plan My Tasks", body: "Create an optimized daily or weekly schedule.", icon: ListTodo },
    { id: "research", title: "Research a Topic", body: "Understand complex topics quickly.", icon: Search },
    { id: "chat", title: "Ask Workplace AI", body: "Chat with your intelligent workplace assistant.", icon: MessageSquare },
  ];
  const statCards = [
    { label: "Tasks completed", value: stats.tasksCompleted },
    { label: "Tasks remaining", value: stats.tasksRemaining },
    { label: "AI generations", value: stats.aiGenerations },
    { label: "Emails generated", value: stats.emailsGenerated },
    { label: "Meetings summarized", value: stats.meetingsSummarized },
  ];
  const topTool = (() => {
    if (!stats.aiGenerations) return null;
    return "Whichever tool you use most will appear here";
  })();

  return (
    <div className="waiFadeIn">
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: 16, padding: "34px 30px",
        background: `linear-gradient(135deg, ${t.tealSoft} 0%, ${t.surface} 45%, ${t.accentSoft} 100%)`,
        border: `1px solid ${t.border}`, marginBottom: 26,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: t.accentText, background: t.accentSoft, border: `1px solid ${t.accentBorder}`, borderRadius: 999, padding: "4px 11px", marginBottom: 14 }}>
          <Sparkles size={12} /> Powered by AI
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 30, margin: "0 0 8px", color: t.text }}>
          Good morning, {firstName}
        </h1>
        <p style={{ fontSize: 14, color: t.textSoft, margin: "0 0 20px", maxWidth: 480 }}>What would you like to accomplish today?</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="primary" icon={Mail} onClick={() => goTo("email")}>Start with Email</Btn>
          <Btn icon={MessageSquare} onClick={() => goTo("chat")}>Open AI Chat</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 30 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          const badge = BADGE_COLORS[i % BADGE_COLORS.length];
          return (
            <Panel key={c.id} style={{ padding: 18, cursor: "pointer" }} onClick={() => goTo(c.id)}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: badge.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={17} color={badge.fg} />
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: t.textSoft, lineHeight: 1.5, marginBottom: 10 }}>{c.body}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.accentText, display: "flex", alignItems: "center", gap: 4 }}>Open tool <ArrowRight size={13} /></div>
            </Panel>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: t.textSoft, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Productivity at a glance</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
        {statCards.map(s => (
          <Panel key={s.label} style={{ padding: "14px 16px", background: t.surfaceSoft, border: "none" }}>
            <div style={{ fontSize: 22, fontWeight: 600, fontFamily: "Fraunces, serif" }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: t.textSoft }}>{s.label}</div>
          </Panel>
        ))}
      </div>

      <Panel style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={16} color={t.teal} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>AI Productivity Insights</span>
        </div>
        {stats.aiGenerations === 0 ? (
          <EmptyState icon={Zap} title="No activity yet" body="Insights will appear here once you start generating emails, summaries, plans, or research." />
        ) : (
          <div style={{ fontSize: 13, color: t.textSoft, lineHeight: 1.7 }}>
            You've made <strong style={{ color: t.text }}>{stats.aiGenerations}</strong> AI generation{stats.aiGenerations !== 1 ? "s" : ""} so far,
            including {stats.emailsGenerated} email{stats.emailsGenerated !== 1 ? "s" : ""} and {stats.meetingsSummarized} meeting summary/summaries.
            You have {tasks.filter(x => !x.completed).length} open task{tasks.filter(x => !x.completed).length !== 1 ? "s" : ""} in your planner.
          </div>
        )}
      </Panel>

      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>How AI moves you from information to action</div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12.5, color: t.textSoft }}>
          {["Information", "AI Processing", "Useful Output", "Action"].map((step, i, arr) => (
            <React.Fragment key={step}>
              <Pill tone={i === 1 ? "accent" : "neutral"}>{step}</Pill>
              {i < arr.length - 1 && <ArrowRight size={13} color={t.textFaint} />}
            </React.Fragment>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   EMAIL GENERATOR
--------------------------------------------------------------- */
function EmailGenerator({ addHistory, toast, aiPrefs, prefill, setPrefill }) {
  const t = useT();
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [audience, setAudience] = useState("General Professional");
  const [tone, setTone] = useState(aiPrefs.tone);
  const [length, setLength] = useState(aiPrefs.length);
  const [outcome, setOutcome] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (prefill && prefill.tool === "email") {
      setPurpose(prefill.purpose || "");
      setContext(prefill.context || "");
      setPrefill(null);
    }
  }, [prefill]);

  const buildSystem = () => `ROLE: You are an expert professional workplace communication specialist.
OBJECTIVE: Draft a clear, well-structured professional email.
AUDIENCE: The email is addressed to a ${audience}.
CONSTRAINTS: Tone must be ${tone}. Length should be ${length.toLowerCase()} (short = ~60 words, medium = ~120 words, detailed = ~220 words). Do not invent facts, names, or commitments beyond what the user provided.
OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown fences, no commentary, in exactly this shape:
{"subject": "...", "greeting": "...", "body": "...", "closing": "..."}
QUALITY CRITERIA: The email should be immediately usable with minimal editing, and clearly achieve the desired outcome.
${RESPONSIBLE_AI_RULES}`;

  const buildUser = (instr) => `Email purpose: ${purpose || "Not specified"}
Context: ${context || "Not specified"}
Desired outcome: ${outcome || "Not specified"}
Additional instructions: ${extra || "None"}
${instr ? "Revision instruction: " + instr : ""}`;

  const generate = async (instr) => {
    if (!purpose.trim() || !context.trim()) { setError("Please provide at least an email purpose and context."); return; }
    setError(null); setLoading(true);
    try {
      const text = await callAI(buildSystem(), buildUser(instr));
      const parsed = parseJSONSafe(text);
      if (!parsed) throw new Error("bad parse");
      setResult(parsed);
      addHistory("Email Generator", parsed.subject || purpose, `${purpose} — ${audience}, ${tone}`, `${parsed.subject}\n\n${parsed.greeting}\n${parsed.body}\n${parsed.closing}`);
    } catch (e) {
      setError("We couldn't generate a response right now. Please try again.");
    } finally { setLoading(false); }
  };

  const copyEmail = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.subject}\n\n${result.greeting}\n\n${result.body}\n\n${result.closing}`).then(() => toast("Copied to clipboard"));
  };

  return (
    <div className="waiFadeIn">
      <PageHeader title="Smart Email Generator" subtitle="Turn workplace context into a professional, editable email." />
      <Disclaimer />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="waiTwoCol">
        <Panel style={{ padding: 20 }}>
          <Field label="Email purpose"><TextInput value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Request a project deadline extension" /></Field>
          <Field label="Context"><TextArea rows={5} value={context} onChange={e => setContext(e.target.value)} placeholder="Explain the situation..." /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Audience"><Select value={audience} onChange={e => setAudience(e.target.value)} options={AUDIENCES} /></Field>
            <Field label="Tone"><Select value={tone} onChange={e => setTone(e.target.value)} options={TONES} /></Field>
          </div>
          <Field label="Length"><Select value={length} onChange={e => setLength(e.target.value)} options={LENGTHS} /></Field>
          <Field label="Desired outcome"><TextInput value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="Ask the client to approve the new deadline" /></Field>
          <Field label="Additional instructions (optional)"><TextArea rows={2} value={extra} onChange={e => setExtra(e.target.value)} /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" icon={loading ? Loader2 : Sparkles} disabled={loading} onClick={() => generate()}>{loading ? "Generating..." : "Generate email"}</Btn>
            <Btn variant="ghost" onClick={() => { setPurpose(""); setContext(""); setOutcome(""); setExtra(""); setResult(null); setError(null); }}>Clear</Btn>
          </div>
          <ErrorNote msg={error} onRetry={() => generate()} />
        </Panel>

        <Panel style={{ padding: 20, minHeight: 260 }}>
          {loading && <PulseLoader label="Drafting your email..." />}
          {!loading && !result && <EmptyState icon={Mail} title="No email yet" body="Fill in the form and generate a professional draft." />}
          {!loading && result && (
            <div>
              <Field label="Subject"><TextInput value={result.subject} onChange={e => setResult({ ...result, subject: e.target.value })} /></Field>
              <Field label="Greeting"><TextInput value={result.greeting} onChange={e => setResult({ ...result, greeting: e.target.value })} /></Field>
              <Field label="Body"><TextArea rows={7} value={result.body} onChange={e => setResult({ ...result, body: e.target.value })} /></Field>
              <Field label="Closing"><TextInput value={result.closing} onChange={e => setResult({ ...result, closing: e.target.value })} /></Field>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 6 }}>
                <Btn icon={Copy} onClick={copyEmail}>Copy</Btn>
                <Btn icon={RefreshCw} disabled={loading} onClick={() => generate()}>Regenerate</Btn>
                <Btn disabled={loading} onClick={() => generate("Make the email noticeably shorter.")}>Make shorter</Btn>
                <Btn disabled={loading} onClick={() => generate("Make the tone more formal.")}>More formal</Btn>
                <Btn disabled={loading} onClick={() => generate("Make the email more persuasive while staying professional.")}>More persuasive</Btn>
                <Btn disabled={loading} onClick={() => generate("Make the tone warmer and friendlier.")}>Friendlier</Btn>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <style>{`@media (max-width:900px){.waiTwoCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   MEETING SUMMARIZER
--------------------------------------------------------------- */
function MeetingSummarizer({ addHistory, toast, goTo, setTasks }) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const system = `ROLE: You are a precise meeting-notes analyst for a workplace productivity tool.
OBJECTIVE: Convert raw meeting notes into structured, accurate information.
CONTEXT: You will receive a meeting title, date, participants, and raw notes/transcript.
ACCURACY RULES: Never invent decisions, deadlines, responsibilities, participants, or facts. If something is not available in the notes, use the exact string "Not specified" for missing fields, and use the exact string "Not mentioned in the provided notes." for empty lists.
OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown fences, no commentary, in exactly this shape:
{"executiveSummary":"...","keyPoints":["..."],"decisions":["..."],"actionItems":[{"task":"...","responsible":"...","deadline":"...","priority":"..."}],"deadlines":["..."],"followUpQuestions":["..."]}
QUALITY CRITERIA: Keep it concise and only reflect what's actually in the notes.
${RESPONSIBLE_AI_RULES}`;

  const generate = async () => {
    if (!notes.trim()) { setError("Please paste the meeting notes or transcript first."); return; }
    setError(null); setLoading(true);
    try {
      const user = `Meeting title: ${title || "Not specified"}\nDate: ${date || "Not specified"}\nParticipants: ${participants || "Not specified"}\nNotes/transcript:\n${notes}`;
      const text = await callAI(system, user);
      const parsed = parseJSONSafe(text);
      if (!parsed) throw new Error("bad parse");
      setResult(parsed);
      addHistory("Meeting Summarizer", title || "Untitled meeting", notes.slice(0, 160), parsed.executiveSummary);
    } catch (e) {
      setError("We couldn't generate a response right now. Please try again.");
    } finally { setLoading(false); }
  };

  const createTasks = () => {
    if (!result || !result.actionItems) return;
    const valid = result.actionItems.filter(a => a.task && a.task !== "Not specified");
    if (!valid.length) { toast("No action items to convert"); return; }
    const mapped = valid.map(a => ({
      id: Date.now() + Math.random(), title: a.task, description: `From meeting: ${title || "Untitled meeting"}`,
      priority: PRIORITIES.includes(a.priority) ? a.priority : "Important",
      deadline: a.deadline && a.deadline !== "Not specified" ? a.deadline : "",
      duration: "", category: "Internal", dependencies: "", notes: a.responsible && a.responsible !== "Not specified" ? `Responsible: ${a.responsible}` : "",
      completed: false, createdAt: new Date().toISOString(),
    }));
    setTasks(prev => [...mapped, ...prev]);
    toast(`${mapped.length} task(s) added`);
    goTo("tasks");
  };

  const Section = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.textSoft, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
  const List = ({ items }) => (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: t.text }}>
      {(items || []).map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );

  return (
    <div className="waiFadeIn">
      <PageHeader title="Meeting Notes Summarizer" subtitle="Extract summaries, decisions, action items, and deadlines from raw notes." />
      <Disclaimer />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 22 }} className="waiTwoCol">
        <Panel style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Meeting title"><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Weekly Project Team Meeting" /></Field>
            <Field label="Date"><TextInput value={date} onChange={e => setDate(e.target.value)} placeholder="e.g. 12 Aug 2026" /></Field>
          </div>
          <Field label="Participants"><TextInput value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Names, comma separated" /></Field>
          <Field label="Meeting notes / transcript"><TextArea rows={10} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste your notes here..." /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="primary" icon={loading ? Loader2 : Sparkles} disabled={loading} onClick={generate}>{loading ? "Summarizing..." : "Summarize meeting"}</Btn>
            <Btn variant="ghost" onClick={() => { setTitle(""); setDate(""); setParticipants(""); setNotes(""); setResult(null); }}>Clear</Btn>
          </div>
          <ErrorNote msg={error} onRetry={generate} />
        </Panel>

        <Panel style={{ padding: 20, minHeight: 260 }}>
          {loading && <PulseLoader label="Reading through the notes..." />}
          {!loading && !result && <EmptyState icon={FileText} title="No summary yet" body="Paste meeting notes and generate a structured summary." />}
          {!loading && result && (
            <div>
              <Section label="Executive summary"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.executiveSummary}</p></Section>
              <Section label="Key points"><List items={result.keyPoints} /></Section>
              <Section label="Decisions"><List items={result.decisions} /></Section>
              <Section label="Action items">
                {(result.actionItems || []).length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.actionItems.map((a, i) => (
                      <div key={i} style={{ border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{a.task}</div>
                        <div style={{ fontSize: 11.5, color: t.textSoft, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>Responsible: {a.responsible}</span><span>Deadline: {a.deadline}</span><span>Priority: {a.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <span style={{ fontSize: 13, color: t.textFaint }}>Not mentioned in the provided notes.</span>}
              </Section>
              <Section label="Deadlines"><List items={result.deadlines} /></Section>
              <Section label="Follow-up questions"><List items={result.followUpQuestions} /></Section>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="primary" icon={ArrowLeftRight} onClick={createTasks}>Create tasks from action items</Btn>
                <Btn icon={RefreshCw} onClick={generate}>Regenerate</Btn>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <style>{`@media (max-width:900px){.waiTwoCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   TASK PLANNER
--------------------------------------------------------------- */
function TaskPlanner({ tasks, setTasks, goTo, addHistory, toast }) {
  const t = useT();
  const [form, setForm] = useState({ title: "", description: "", priority: "Important", deadline: "", duration: "", category: "General", dependencies: "", notes: "" });
  const [schedule, setSchedule] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  const [planType, setPlanType] = useState("Daily Plan");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:30");
  const [breaks, setBreaks] = useState("A short break mid-morning and a lunch break");
  const [commitments, setCommitments] = useState("");

  const addTask = () => {
    if (!form.title.trim()) return;
    setTasks(p => [{ ...form, id: Date.now() + Math.random(), completed: false, createdAt: new Date().toISOString() }, ...p]);
    setForm({ title: "", description: "", priority: "Important", deadline: "", duration: "", category: "General", dependencies: "", notes: "" });
  };
  const toggleTask = (id) => setTasks(p => p.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
  const removeTask = (id) => setTasks(p => p.filter(x => x.id !== id));

  const genSchedule = async () => {
    const open = tasks.filter(x => !x.completed);
    if (!open.length) { setScheduleError("Add at least one open task before generating a schedule."); return; }
    setScheduleError(null); setScheduleLoading(true);
    try {
      const system = `ROLE: You are an AI workplace scheduling assistant.
OBJECTIVE: Build a realistic, time-blocked ${planType.toLowerCase()} using the given tasks and constraints.
CONSTRAINTS: Prioritize by urgency, importance, deadline proximity, estimated effort, and dependencies. Group similar tasks, avoid unnecessary context switching, place demanding tasks earlier when reasonable, protect deadline-sensitive work, and add reasonable breaks. Do not claim these techniques are scientifically guaranteed -- phrase recommendations as general best practice.
OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown fences, in exactly this shape:
{"blocks":[{"start":"HH:MM","end":"HH:MM","label":"...","type":"task|break|admin"}],"recommendations":["..."]}
${RESPONSIBLE_AI_RULES}`;
      const user = `Plan type: ${planType}\nWorking hours: ${start} to ${end}\nBreak preferences: ${breaks || "Not specified"}\nExisting commitments: ${commitments || "None"}\nTasks:\n${open.map(x => `- ${x.title} | priority: ${x.priority} | deadline: ${x.deadline || "none"} | duration: ${x.duration || "unspecified"} | category: ${x.category} | dependencies: ${x.dependencies || "none"}`).join("\n")}`;
      const text = await callAI(system, user);
      const parsed = parseJSONSafe(text);
      if (!parsed) throw new Error("bad parse");
      setSchedule(parsed);
      addHistory("Task Planner", `${planType} schedule`, `${open.length} tasks, ${start}-${end}`, (parsed.blocks || []).map(b => `${b.start}-${b.end} ${b.label}`).join("\n"));
    } catch (e) {
      setScheduleError("We couldn't generate a response right now. Please try again.");
    } finally { setScheduleLoading(false); }
  };

  const askWhy = () => {
    const open = tasks.filter(x => !x.completed);
    const summary = open.map(x => `${x.title} (${x.priority}${x.deadline ? ", due " + x.deadline : ""})`).join("; ");
    goTo("chat", { tool: "chat", autoSend: `Here are my current open tasks: ${summary || "none listed"}. Why might these priorities make sense, and what would you suggest I tackle first?` });
  };

  return (
    <div className="waiFadeIn">
      <PageHeader title="AI Task Planner" subtitle="Create tasks, prioritize your work, and generate a time-blocked schedule." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 22 }} className="waiTwoCol">
        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>New task</div>
          <Field label="Task name"><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Complete project report" /></Field>
          <Field label="Description"><TextArea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Priority"><Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} options={PRIORITIES} /></Field>
            <Field label="Category"><Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={CATEGORIES} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Deadline"><TextInput value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} placeholder="e.g. Fri 5pm" /></Field>
            <Field label="Estimated duration"><TextInput value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 90 min" /></Field>
          </div>
          <Field label="Dependencies"><TextInput value={form.dependencies} onChange={e => setForm({ ...form, dependencies: e.target.value })} placeholder="Optional" /></Field>
          <Field label="Notes"><TextArea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
          <Btn variant="primary" icon={Plus} onClick={addTask}>Add task</Btn>

          <div style={{ marginTop: 22, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Your tasks</div>
          {!tasks.length && <EmptyState icon={ListTodo} title="No tasks yet" body="Add a task above or create one from a meeting summary." />}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map(x => (
              <div key={x.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: `1px solid ${t.border}`, borderRadius: 9, padding: "9px 12px", opacity: x.completed ? 0.55 : 1 }}>
                <input type="checkbox" checked={x.completed} onChange={() => toggleTask(x.id)} style={{ marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, textDecoration: x.completed ? "line-through" : "none" }}>{x.title}</div>
                  <div style={{ fontSize: 11, color: t.textSoft, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                    <Pill tone={x.priority === "Urgent / Important" ? "danger" : x.priority === "Low Priority" ? "neutral" : "accent"}>{x.priority}</Pill>
                    {x.deadline && <span>Due {x.deadline}</span>}
                    <span>{x.category}</span>
                  </div>
                </div>
                <button onClick={() => removeTask(x.id)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {!!tasks.filter(x=>!x.completed).length && <Btn variant="ghost" style={{ marginTop: 10 }} icon={MessageSquare} onClick={askWhy}>Ask AI why these priorities make sense</Btn>}
        </Panel>

        <Panel style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Daily / weekly AI scheduler</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["Daily Plan", "Weekly Plan"].map(p => (
              <Btn key={p} variant={planType === p ? "primary" : "secondary"} onClick={() => setPlanType(p)}>{p}</Btn>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Working start"><TextInput value={start} onChange={e => setStart(e.target.value)} /></Field>
            <Field label="Working end"><TextInput value={end} onChange={e => setEnd(e.target.value)} /></Field>
          </div>
          <Field label="Break preferences"><TextInput value={breaks} onChange={e => setBreaks(e.target.value)} /></Field>
          <Field label="Existing commitments"><TextArea rows={2} value={commitments} onChange={e => setCommitments(e.target.value)} placeholder="Meetings, calls, etc." /></Field>
          <Btn variant="primary" icon={scheduleLoading ? Loader2 : Sparkles} disabled={scheduleLoading} onClick={genSchedule}>{scheduleLoading ? "Building schedule..." : "Generate my schedule"}</Btn>
          <ErrorNote msg={scheduleError} onRetry={genSchedule} />

          <div style={{ marginTop: 18 }}>
            {scheduleLoading && <PulseLoader label="Optimizing your time blocks..." />}
            {!scheduleLoading && schedule && (
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {(schedule.blocks || []).map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", borderLeft: `3px solid ${b.type === "break" ? t.textFaint : b.type === "admin" ? t.teal : t.accent}`, paddingLeft: 10 }}>
                      <div style={{ fontSize: 11.5, color: t.textSoft, width: 100, flexShrink: 0 }}>{b.start} – {b.end}</div>
                      <div style={{ fontSize: 13 }}>{b.label}</div>
                    </div>
                  ))}
                </div>
                {!!(schedule.recommendations || []).length && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.textSoft, marginBottom: 6, textTransform: "uppercase" }}>Recommendations</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7 }}>
                      {schedule.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </div>
      <style>{`@media (max-width:900px){.waiTwoCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   RESEARCH ASSISTANT
--------------------------------------------------------------- */
function ResearchAssistant({ addHistory, goTo }) {
  const t = useT();
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [source, setSource] = useState("");
  const [audience, setAudience] = useState("Employee");
  const [depth, setDepth] = useState("Standard");
  const [simplify, setSimplify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!topic.trim()) { setError("Please enter a research topic."); return; }
    setError(null); setLoading(true);
    try {
      const system = `ROLE: You are an AI research assistant helping a workplace user understand a topic quickly.
OBJECTIVE: Produce a clear research brief.
AUDIENCE: ${audience}. Explanation mode: ${simplify ? "Explain Like I'm New to This -- use plain, simple language without removing important meaning." : "Technical Mode -- deeper, more precise explanations are appropriate."}
CONTEXT: Research depth requested: ${depth}.
CONSTRAINTS: You have no live web access in this tool -- do not fabricate citations, sources, or links. Base your answer on general knowledge and clearly signal uncertainty where relevant.
OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown fences, in exactly this shape:
{"simpleExplanation":"...","keyConcepts":[{"term":"...","definition":"..."}],"mainInsights":["..."],"advantages":["..."],"risks":["..."],"recommendations":["..."],"furtherQuestions":["..."]}
${RESPONSIBLE_AI_RULES}`;
      const user = `Research topic: ${topic}\nResearch question: ${question || "Not specified"}\nSource/text provided by user: ${source || "None provided"}`;
      const text = await callAI(system, user);
      const parsed = parseJSONSafe(text);
      if (!parsed) throw new Error("bad parse");
      setResult(parsed);
      addHistory("Research Assistant", topic, question || topic, parsed.simpleExplanation);
    } catch (e) {
      setError("We couldn't generate a response right now. Please try again.");
    } finally { setLoading(false); }
  };

  const toEmail = () => {
    if (!result) return;
    goTo("email", { tool: "email", purpose: `Share research findings on: ${topic}`, context: result.simpleExplanation + (result.mainInsights ? "\n\nKey insights: " + result.mainInsights.join("; ") : "") });
  };

  const Section = ({ label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: t.textSoft, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
  const List = ({ items }) => <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>{(items || []).map((it, i) => <li key={i}>{it}</li>)}</ul>;

  return (
    <div className="waiFadeIn">
      <PageHeader title="AI Research Assistant" subtitle="Understand complex topics quickly, with clear uncertainty signals." />
      <Disclaimer />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 22 }} className="waiTwoCol">
        <Panel style={{ padding: 20 }}>
          <Field label="Research topic"><TextInput value={topic} onChange={e => setTopic(e.target.value)} placeholder="Artificial Intelligence in Workplace Productivity" /></Field>
          <Field label="Research question"><TextInput value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should I focus on?" /></Field>
          <Field label="Source / text (optional)"><TextArea rows={4} value={source} onChange={e => setSource(e.target.value)} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Intended audience"><Select value={audience} onChange={e => setAudience(e.target.value)} options={RESEARCH_AUDIENCES} /></Field>
            <Field label="Research depth"><Select value={depth} onChange={e => setDepth(e.target.value)} options={DEPTHS} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <Btn variant={simplify ? "primary" : "secondary"} onClick={() => setSimplify(true)}>Explain Like I'm New</Btn>
            <Btn variant={!simplify ? "primary" : "secondary"} onClick={() => setSimplify(false)}>Technical Mode</Btn>
          </div>
          <Btn variant="primary" icon={loading ? Loader2 : Sparkles} disabled={loading} onClick={generate}>{loading ? "Researching..." : "Research topic"}</Btn>
          <ErrorNote msg={error} onRetry={generate} />
          <div style={{ marginTop: 12, fontSize: 11.5, color: t.textFaint }}>This assistant doesn't have live web access -- verify findings against reliable sources before relying on them.</div>
        </Panel>

        <Panel style={{ padding: 20, minHeight: 260 }}>
          {loading && <PulseLoader label="Gathering key insights..." />}
          {!loading && !result && <EmptyState icon={Search} title="No research yet" body="Enter a topic and generate a structured research brief." />}
          {!loading && result && (
            <div>
              <Section label="Simple explanation"><p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.simpleExplanation}</p></Section>
              <Section label="Key concepts">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(result.keyConcepts || []).map((k, i) => (
                    <div key={i}><strong style={{ fontSize: 12.5 }}>{k.term}:</strong> <span style={{ fontSize: 12.5, color: t.textSoft }}>{k.definition}</span></div>
                  ))}
                </div>
              </Section>
              <Section label="Main insights"><List items={result.mainInsights} /></Section>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Section label="Advantages / opportunities"><List items={result.advantages} /></Section>
                <Section label="Risks / limitations"><List items={result.risks} /></Section>
              </div>
              <Section label="Recommendations"><List items={result.recommendations} /></Section>
              <Section label="Further questions"><List items={result.furtherQuestions} /></Section>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="primary" icon={Mail} onClick={toEmail}>Create professional email</Btn>
                <Btn icon={RefreshCw} onClick={generate}>Regenerate</Btn>
              </div>
            </div>
          )}
        </Panel>
      </div>
      <style>{`@media (max-width:900px){.waiTwoCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   WORKPLACE CHAT
--------------------------------------------------------------- */
const SUGGESTED_PROMPTS = [
  "Help me plan my workday.",
  "Write a professional email to my manager.",
  "Summarize these meeting notes.",
  "Help me prioritize my tasks.",
  "Explain this business concept simply.",
  "Give me ideas for improving team productivity.",
];

function WorkplaceChat({ chatMessages, setChatMessages, addHistory, toast, prefill, setPrefill }) {
  const t = useT();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const autoSentRef = useRef(false);

  const system = `ROLE: You are Workplace AI, a helpful, realistic workplace productivity assistant embedded in the WorkAI application.
OBJECTIVE: Support writing assistance, brainstorming, task planning, summarization, workplace communication, research assistance, productivity advice, and general workplace questions.
CONSTRAINTS: Be concise and practical. Do not claim to have taken real-world actions (you can only draft text and give advice). If a request needs information you don't have, ask a brief clarifying question or state the assumption you're making.
${RESPONSIBLE_AI_RULES}`;

  const send = async (text) => {
    const msg = (text !== undefined ? text : input).trim();
    if (!msg || loading) return;
    setError(null);
    const nextMessages = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const apiMessages = nextMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await callAIChat(system, apiMessages);
      setChatMessages(m => [...m, { role: "assistant", content: reply }]);
      addHistory("Workplace AI", msg.slice(0, 60), msg, reply);
    } catch (e) {
      setError("We couldn't generate a response right now. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (prefill && prefill.tool === "chat" && !autoSentRef.current) {
      autoSentRef.current = true;
      if (prefill.autoSend) send(prefill.autoSend);
      setPrefill(null);
    }
  }, [prefill]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatMessages, loading]);

  const regenerate = () => {
    const lastUser = [...chatMessages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    setChatMessages(m => { const idx = m.map(x => x.role).lastIndexOf("assistant"); return idx === -1 ? m : m.slice(0, idx); });
    send(lastUser.content);
  };

  return (
    <div className="waiFadeIn" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)", maxHeight: 760 }}>
      <PageHeader title="Workplace AI" subtitle="Chat with your intelligent workplace assistant across multiple turns." />
      <Disclaimer />
      <Panel style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
        <div ref={scrollRef} className="waiScroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {!chatMessages.length && (
            <div>
              <EmptyState icon={MessageSquare} title="Start a conversation" body="Ask about writing, planning, summarizing, or anything workplace-related." />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {SUGGESTED_PROMPTS.map(p => <Btn key={p} onClick={() => send(p)}>{p}</Btn>)}
              </div>
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{
                maxWidth: "78%", padding: "10px 14px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
                background: m.role === "user" ? t.ink : t.surfaceSoft, color: m.role === "user" ? t.inkText : t.text,
              }}>
                {m.content}
                {m.role === "assistant" && (
                  <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
                    <button onClick={() => navigator.clipboard.writeText(m.content).then(() => toast("Copied"))} style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }} title="Copy"><Copy size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && <PulseLoader label="Workplace AI is typing..." />}
          <ErrorNote msg={error} onRetry={() => regenerate()} />
        </div>
        <div style={{ borderTop: `1px solid ${t.border}`, padding: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <Btn variant="ghost" icon={Trash2} onClick={() => { setChatMessages([]); autoSentRef.current = false; }} title="Clear conversation" />
          <Btn variant="ghost" icon={RefreshCw} disabled={!chatMessages.length || loading} onClick={regenerate} title="Regenerate" />
          <TextInput value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask Workplace AI anything..." style={{ flex: 1 }} />
          <Btn variant="primary" icon={Send} disabled={loading || !input.trim()} onClick={() => send()}>Send</Btn>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------
   PROMPT LAB
--------------------------------------------------------------- */
function PromptLab({ addHistory }) {
  const t = useT();
  const [role, setRole] = useState("Professional workplace communication specialist");
  const [task, setTask] = useState("");
  const [context, setContext] = useState("");
  const [audience, setAudience] = useState("Manager");
  const [tone, setTone] = useState("Professional");
  const [constraints, setConstraints] = useState("Keep it concise and avoid inventing facts.");
  const [format, setFormat] = useState("Paragraph");
  const [built, setBuilt] = useState("");
  const [runLoading, setRunLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);

  const [promptA, setPromptA] = useState("Write an email about the deadline.");
  const [promptB, setPromptB] = useState("");
  const [respA, setRespA] = useState(null);
  const [respB, setRespB] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);

  const buildPrompt = () => {
    const p = `ROLE: ${role || "Not specified"}
TASK: ${task || "Not specified"}
CONTEXT: ${context || "Not specified"}
AUDIENCE: ${audience}
TONE: ${tone}
CONSTRAINTS: ${constraints || "None specified"}
OUTPUT FORMAT: ${format}
QUALITY CRITERIA: Response should be accurate, relevant to the audience and tone, and directly usable.
ACCURACY RULES: Do not invent information not provided in the context.`;
    setBuilt(p);
  };

  const runBuilt = async () => {
    if (!built) return;
    setRunLoading(true); setRunError(null);
    try {
      const text = await callAI("You follow structured prompt instructions precisely and produce a workplace-appropriate response.", built);
      setRunResult(text);
      addHistory("Prompt Lab", task || "Structured prompt", built.slice(0, 160), text);
    } catch (e) { setRunError("We couldn't generate a response right now. Please try again."); }
    finally { setRunLoading(false); }
  };

  const improve = () => {
    setPromptB(`ROLE: Professional workplace communication specialist.
TASK: ${promptA}
AUDIENCE: Manager.
TONE: Professional and concise.
CONSTRAINTS: Do not invent specific dates or facts not provided; keep it under 120 words.
OUTPUT FORMAT: A ready-to-send email with subject, greeting, body, and closing.`);
  };

  const runCompare = async () => {
    if (!promptA.trim() || !promptB.trim()) { setCompareError("Fill in both Prompt A and Prompt B first."); return; }
    setCompareError(null); setCompareLoading(true);
    try {
      const [a, b] = await Promise.all([
        callAI("You are a helpful assistant.", promptA),
        callAI("You are a helpful, structured, workplace-appropriate assistant that follows instructions precisely.", promptB),
      ]);
      setRespA(a); setRespB(b);
      addHistory("Prompt Lab", "Prompt comparison", promptA, `A: ${a}\n\nB: ${b}`);
    } catch (e) { setCompareError("We couldn't generate a response right now. Please try again."); }
    finally { setCompareLoading(false); }
  };

  return (
    <div className="waiFadeIn">
      <PageHeader title="AI Prompt Lab" subtitle="Discover the art of prompting -- build, test, and compare structured prompts." />

      <Panel style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>1. From basic to structured</div>
        <p style={{ fontSize: 12.5, color: t.textSoft, marginTop: 0, marginBottom: 12 }}>Good AI results depend on clear instructions, context, constraints, and output requirements.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }} className="waiThreeCol">
          {[
            { label: "Basic prompt", text: "\"Write an email about the deadline.\"" },
            { label: "Improved prompt", text: "\"Write a professional email to my manager requesting a 3-day deadline extension for the Q3 report, explaining the reason and proposing a new date.\"" },
            { label: "Structured prompt", text: "Role + Task + Context + Constraints + Output Format + Quality Criteria, as engineered below." },
          ].map(c => (
            <div key={c.label} style={{ background: t.surfaceSoft, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: t.accentText, marginBottom: 5, textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 12, color: t.textSoft, lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel style={{ padding: 20, marginBottom: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>2. Prompt builder</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="waiTwoCol">
          <Field label="AI role"><TextInput value={role} onChange={e => setRole(e.target.value)} /></Field>
          <Field label="Task"><TextInput value={task} onChange={e => setTask(e.target.value)} placeholder="What should the AI do?" /></Field>
          <Field label="Context"><TextArea rows={2} value={context} onChange={e => setContext(e.target.value)} /></Field>
          <Field label="Constraints"><TextArea rows={2} value={constraints} onChange={e => setConstraints(e.target.value)} /></Field>
          <Field label="Audience"><Select value={audience} onChange={e => setAudience(e.target.value)} options={AUDIENCES} /></Field>
          <Field label="Tone"><Select value={tone} onChange={e => setTone(e.target.value)} options={TONES} /></Field>
          <Field label="Output format"><Select value={format} onChange={e => setFormat(e.target.value)} options={["Paragraph", "Bullet points", "Table", "JSON", "Structured sections"]} /></Field>
        </div>
        <Btn variant="primary" icon={Sparkles} onClick={buildPrompt}>Build structured prompt</Btn>
        {built && (
          <div style={{ marginTop: 14 }}>
            <div style={{ background: t.surfaceSoft, borderRadius: 9, padding: 12, fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", marginBottom: 10 }}>{built}</div>
            <Btn icon={runLoading ? Loader2 : Send} disabled={runLoading} onClick={runBuilt}>{runLoading ? "Running..." : "Run this prompt"}</Btn>
            <ErrorNote msg={runError} onRetry={runBuilt} />
            {runLoading && <PulseLoader />}
            {runResult && <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 9, padding: 12, whiteSpace: "pre-wrap" }}>{runResult}</div>}
          </div>
        )}
      </Panel>

      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>3. Prompt comparison</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="waiTwoCol">
          <div>
            <Field label="Prompt A (basic)"><TextArea rows={3} value={promptA} onChange={e => setPromptA(e.target.value)} /></Field>
            {respA && <div style={{ fontSize: 12.5, lineHeight: 1.6, background: t.surfaceSoft, borderRadius: 9, padding: 10, whiteSpace: "pre-wrap" }}>{respA}</div>}
          </div>
          <div>
            <Field label="Prompt B (improved)"><TextArea rows={3} value={promptB} onChange={e => setPromptB(e.target.value)} placeholder="Click 'Suggest improved prompt' or write your own" /></Field>
            {respB && <div style={{ fontSize: 12.5, lineHeight: 1.6, background: t.tealSoft, borderRadius: 9, padding: 10, whiteSpace: "pre-wrap" }}>{respB}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Btn onClick={improve}>Suggest improved prompt</Btn>
          <Btn variant="primary" icon={compareLoading ? Loader2 : Sparkles} disabled={compareLoading} onClick={runCompare}>{compareLoading ? "Comparing..." : "Run both prompts"}</Btn>
        </div>
        <ErrorNote msg={compareError} onRetry={runCompare} />
        {respA && respB && (
          <div style={{ marginTop: 14, fontSize: 12.5, color: t.textSoft, background: t.accentSoft, borderRadius: 9, padding: 12 }}>
            <strong style={{ color: t.accentText }}>Why B is typically more useful:</strong> Prompt B specifies a role, audience, tone, format, and constraints, so the response is targeted and closer to something you could send directly, whereas Prompt A leaves the AI to guess those details -- more editing is usually needed.
          </div>
        )}
      </Panel>
      <style>{`@media (max-width:900px){.waiTwoCol,.waiThreeCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   HISTORY
--------------------------------------------------------------- */
function HistoryPage({ history, setHistory, toast, goTo, setPrefill }) {
  const t = useT();
  const [filter, setFilter] = useState("All");
  const [openId, setOpenId] = useState(null);
  const tools = ["All", "Email Generator", "Meeting Summarizer", "Task Planner", "Research Assistant", "Workplace AI", "Prompt Lab"];
  const filtered = filter === "All" ? history : history.filter(h => h.tool === filter);

  const del = (id) => setHistory(h => h.filter(x => x.id !== id));
  const copyItem = (h) => navigator.clipboard.writeText(h.output || "").then(() => toast("Copied to clipboard"));
  const reuse = (h) => {
    if (h.tool === "Email Generator") { goTo("email", { tool: "email", purpose: h.title, context: h.input }); return; }
    if (h.tool === "Research Assistant") { goTo("research"); return; }
    goTo("history");
  };

  return (
    <div className="waiFadeIn">
      <PageHeader title="AI History" subtitle="Every AI generation you've made, in one place." />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {tools.map(tool => (
          <button key={tool} onClick={() => setFilter(tool)} style={{
            border: `1px solid ${filter === tool ? t.accent : t.border}`, background: filter === tool ? t.accentSoft : t.surface,
            color: filter === tool ? t.accentText : t.textSoft, borderRadius: 999, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{tool}</button>
        ))}
      </div>

      {!filtered.length && <EmptyState icon={HistoryIcon} title="No history yet" body="Generations from any AI tool will appear here." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(h => (
          <Panel key={h.id} style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <Pill tone="accent">{h.tool}</Pill>
                  <span style={{ fontSize: 11, color: t.textFaint }}>{new Date(h.date).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                {openId !== h.id ? (
                  <div style={{ fontSize: 12, color: t.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(h.output || "").slice(0, 120)}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: t.text, whiteSpace: "pre-wrap", marginTop: 6, background: t.surfaceSoft, borderRadius: 8, padding: 10 }}>{h.output}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => setOpenId(openId === h.id ? null : h.id)} title="View" style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><Edit3 size={14} /></button>
                <button onClick={() => copyItem(h)} title="Copy" style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><Copy size={14} /></button>
                <button onClick={() => reuse(h)} title="Reuse" style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><RefreshCw size={14} /></button>
                <button onClick={() => del(h.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: t.textFaint }}><Trash2 size={14} /></button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   SETTINGS
--------------------------------------------------------------- */
function SettingsPage({ profile, setProfile, aiPrefs, setAiPrefs, themeMode, setThemeMode, setHistory, setTasks, setChatMessages, toast }) {
  const t = useT();
  return (
    <div className="waiFadeIn">
      <PageHeader title="Settings" subtitle="Manage your profile, AI preferences, appearance, and privacy." />

      <Panel style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Profile</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }} className="waiThreeCol">
          <Field label="Name"><TextInput value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></Field>
          <Field label="Email"><TextInput value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></Field>
          <Field label="Role"><TextInput value={profile.role} onChange={e => setProfile({ ...profile, role: e.target.value })} /></Field>
        </div>
      </Panel>

      <Panel style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>AI preferences</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }} className="waiFourCol">
          <Field label="Default tone"><Select value={aiPrefs.tone} onChange={e => setAiPrefs({ ...aiPrefs, tone: e.target.value })} options={TONES} /></Field>
          <Field label="Default length"><Select value={aiPrefs.length} onChange={e => setAiPrefs({ ...aiPrefs, length: e.target.value })} options={LENGTHS} /></Field>
          <Field label="Research depth"><Select value={aiPrefs.researchDepth} onChange={e => setAiPrefs({ ...aiPrefs, researchDepth: e.target.value })} options={DEPTHS} /></Field>
          <Field label="Planning style"><Select value={aiPrefs.planningStyle} onChange={e => setAiPrefs({ ...aiPrefs, planningStyle: e.target.value })} options={["Balanced", "Deadline-focused", "Deep-work-focused", "Meeting-light"]} /></Field>
        </div>
      </Panel>

      <Panel style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Appearance</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }, { id: "system", label: "System", icon: Monitor }].map(o => (
            <Btn key={o.id} icon={o.icon} variant={themeMode === o.id ? "primary" : "secondary"} onClick={() => setThemeMode(o.id)}>{o.label}</Btn>
          ))}
        </div>
      </Panel>

      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Privacy</div>
        <p style={{ fontSize: 12.5, color: t.textSoft, lineHeight: 1.6, marginTop: 0 }}>
          Your tasks, AI history, and chat messages are stored so this application can function across sessions. Avoid entering unnecessary confidential or sensitive information into any AI tool. You can clear your locally stored history at any time.
        </p>
        <Btn variant="danger" icon={Trash2} onClick={() => { setHistory([]); setTasks([]); setChatMessages([]); toast("History cleared"); }}>Clear stored history, tasks, and chat</Btn>
      </Panel>
      <style>{`@media (max-width:900px){.waiThreeCol,.waiFourCol{grid-template-columns:1fr 1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   RESPONSIBLE AI
--------------------------------------------------------------- */
function ResponsibleAI() {
  const t = useT();
  const sections = [
    { title: "AI limitations", body: "AI can make mistakes, misunderstand context, produce incomplete information, generate biased outputs, and produce plausible-sounding but incorrect information." },
    { title: "Human verification", body: "Users remain responsible for reviewing important AI-generated content before acting on it, sending it, or relying on it for decisions." },
    { title: "Bias", body: "AI systems may reflect biases present in their training data or in the information provided by users, and outputs should be reviewed with that in mind." },
    { title: "Privacy", body: "Avoid entering unnecessary confidential or sensitive information into AI tools, including this application." },
    { title: "Transparency", body: "AI-generated content in this application is clearly identified as a draft or suggestion, not a finished, verified output." },
    { title: "Human oversight", body: "Important workplace decisions should remain subject to human judgment; this application is designed to support, not replace, that judgment." },
  ];
  return (
    <div className="waiFadeIn">
      <PageHeader title="Responsible AI" subtitle="How WorkAI approaches AI safety, accuracy, and human oversight." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="waiTwoCol">
        {sections.map(s => (
          <Panel key={s.title} style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 12.5, color: t.textSoft, lineHeight: 1.6 }}>{s.body}</div>
          </Panel>
        ))}
      </div>
      <Panel style={{ padding: 18, marginTop: 14, background: t.accentSoft, border: `1px solid ${t.accentBorder}` }}>
        <div style={{ fontSize: 12.5, color: t.accentText, lineHeight: 1.6 }}>
          AI-generated content may contain errors, omissions, or bias. Review and verify important information before using it for professional, academic, legal, financial, or other high-impact decisions.
        </div>
      </Panel>
      <style>{`@media (max-width:900px){.waiTwoCol{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}

/* ---------------------------------------------------------------
   ABOUT
--------------------------------------------------------------- */
function About() {
  const t = useT();
  const cards = [
    { n: "01", title: "Introduction to AI", body: "Demonstrates practical AI capabilities across five real workplace tools." },
    { n: "02", title: "Maximize Productivity", body: "Automates repetitive workplace tasks: writing, summarizing, planning, and researching." },
    { n: "03", title: "Art of Prompting", body: "Uses structured prompts, a prompt builder, and side-by-side prompt comparison." },
    { n: "04", title: "Responsible AI", body: "Includes verification, transparency, limitations, privacy, and bias awareness throughout." },
    { n: "05", title: "Stay Ahead of the AI Curve", body: "Demonstrates modern AI-powered workplace workflows and human-AI collaboration." },
  ];
  return (
    <div className="waiFadeIn">
      <PageHeader title="About / Learning Outcomes" subtitle="What is this? An AI workplace productivity assistant for professionals, employees, managers, students, and teams." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
        {cards.map(c => (
          <Panel key={c.n} style={{ padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.accentText, marginBottom: 8 }}>{c.n}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12.5, color: t.textSoft, lineHeight: 1.6 }}>{c.body}</div>
          </Panel>
        ))}
      </div>
      <Panel style={{ padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Manual vs AI-assisted workflow</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5, color: t.textSoft }}>
            {["Write", "Review", "Organize", "Plan"].map((s, i, arr) => (
              <React.Fragment key={s}><Pill>{s}</Pill>{i < arr.length - 1 && <ArrowRight size={12} />}</React.Fragment>
            ))}
          </div>
          <span style={{ fontSize: 12, color: t.textFaint }}>vs</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5 }}>
            {["Input", "AI", "Structured Output", "Action"].map((s, i, arr) => (
              <React.Fragment key={s}><Pill tone="accent">{s}</Pill>{i < arr.length - 1 && <ArrowRight size={12} color={t.accentText} />}</React.Fragment>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
