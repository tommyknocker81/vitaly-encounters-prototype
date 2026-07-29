import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, MinusCircle, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronsLeft,
  AlertTriangle, AlertCircle, ArrowUpDown, Filter, ArrowDown, CalendarDays, Stethoscope,
  ClipboardList, Users, Repeat, CornerDownRight, LayoutGrid, Bell, List, UserPlus,
  FileText, BarChart3, History, User, Check, ExternalLink, Plus, X, Search,
} from "lucide-react";

// Vitaly RSO design tokens (Figma: OpenLine-Vitaly)
const T = {
  primary: "#0080A3",    // Theme/Primary
  secondary: "#00324B",  // Theme/Secondary (sidebar)
  dark: "#001E2D",       // Theme/Dark (logo block, sidebar footer)
  success: "#62A752",    // Theme/Success
  warning: "#FFB853",    // Theme/Warning
  border: "#DEE2E6",     // Theme/Border
  bodyText: "#212529",   // Body Text/Body Color
  gray700: "#495057",
  gray600: "#6C757D",
  gray500: "#ADB5BD",
  gray400: "#CED4DA",
  lightBg: "#E9ECEF",    // Theme/Light background (source rows)
  light: "#F7F8FA",      // Theme/Light
  fontFamily: "'Source Sans 3', 'Source Sans Pro', system-ui, sans-serif",
};

// Each fetch returns at most FETCH_PAGE of a source's entries (latest first),
// mimicking server-side pagination. `entries` is the full server-side dataset.
const FETCH_PAGE = 10;

const SOURCE_CONFIG = [
  {
    id: "gp-linde",
    name: "GP Practice de Linde, Amersfoort",
    delayMs: () => 3000 + Math.random() * 2000,
    outcome: "loaded",
    entries: [
      { id: "e1", date: "22/08/2025", sortDate: "2025-08-22", label: "Outpatient visit | Hypertension monitoring", source: "GP Practice de Linde, Amersfoort" },
      { id: "e11", date: "12/01/2024", sortDate: "2024-01-12", label: "Outpatient visit | Annual check-up", source: "GP Practice de Linde, Amersfoort" },
    ],
  },
  {
    // Primary hospital for this patient — has more records than one fetch returns
    id: "maastricht",
    name: "Maastricht UMC+",
    delayMs: () => 4500 + Math.random() * 2500,
    outcome: "loaded",
    entries: [
      { id: "m1", date: "16/08/2025 - 20/08/2025", sortDate: "2025-08-20", label: "Emergency | Suspected wrist fracture", source: "Maastricht UMC+ (+1)" },
      { id: "m2", date: "02/07/2025", sortDate: "2025-07-02", label: "Outpatient visit | Orthopedics follow-up", source: "Maastricht UMC+" },
      { id: "m3", date: "18/03/2025", sortDate: "2025-03-18", label: "Outpatient visit | Cardiology check", source: "Maastricht UMC+" },
      { id: "m4", date: "05/01/2025", sortDate: "2025-01-05", label: "Teleconsult | Medication adjustment", source: "Maastricht UMC+" },
      { id: "m5", date: "22/11/2024", sortDate: "2024-11-22", label: "Outpatient visit | Endocrinology consultation", source: "Maastricht UMC+" },
      { id: "m6", date: "09/06/2024", sortDate: "2024-06-09", label: "Outpatient visit | Orthopedics follow-up", source: "Maastricht UMC+" },
      { id: "m7", date: "15/04/2024", sortDate: "2024-04-15", label: "Day treatment | Minor surgery", source: "Maastricht UMC+" },
      { id: "m8", date: "28/01/2024", sortDate: "2024-01-28", label: "Outpatient visit | Dermatology consultation", source: "Maastricht UMC+" },
      { id: "m9", date: "12/10/2023", sortDate: "2023-10-12", label: "Imaging | X-ray right wrist", source: "Maastricht UMC+" },
      { id: "m10", date: "03/08/2023", sortDate: "2023-08-03", label: "Outpatient visit | Pediatrics consultation", source: "Maastricht UMC+" },
      { id: "m11", date: "19/05/2023", sortDate: "2023-05-19", label: "Teleconsult | Follow-up call", source: "Maastricht UMC+" },
      { id: "m12", date: "07/02/2023", sortDate: "2023-02-07", label: "Outpatient visit | ENT consultation", source: "Maastricht UMC+" },
      { id: "m13", date: "21/09/2022", sortDate: "2022-09-21", label: "Emergency | Sports injury assessment", source: "Maastricht UMC+" },
      { id: "m14", date: "30/04/2022", sortDate: "2022-04-30", label: "Outpatient visit | General pediatrics", source: "Maastricht UMC+" },
      { id: "m15", date: "12/11/2021", sortDate: "2021-11-12", label: "Outpatient visit | Asthma review", source: "Maastricht UMC+" },
      { id: "m16", date: "03/06/2021", sortDate: "2021-06-03", label: "Teleconsult | Vaccination advice", source: "Maastricht UMC+" },
    ],
  },
  {
    id: "umcu",
    name: "UMC Utrecht",
    delayMs: () => 6000 + Math.random() * 2500,
    outcome: "failed",
    entries: [],
  },
  {
    id: "mumc",
    name: "MUMC+",
    delayMs: () => 3500 + Math.random() * 2000,
    outcome: "empty",
    entries: [],
  },
  {
    id: "erasmus",
    name: "Erasmus MC",
    delayMs: () => 14000 + Math.random() * 10000,
    outcome: "loaded",
    entries: [
      { id: "e14", date: "30/09/2024", sortDate: "2024-09-30", label: "Outpatient visit | Cardiology consultation", source: "Erasmus MC" },
      { id: "e3", date: "14/07/2023", sortDate: "2023-07-14", label: "Day treatment | Knee arthroscopy", source: "Erasmus MC" },
    ],
  },
];

// Mock clinical detail data shown when an encounter card is expanded.
// Multi-source merges (e.g. "Maastricht UMC+ (+1)") get one detail block per
// contributing organization; conflicting values get a hover comparison.
const ENCOUNTER_DETAILS = {
  m1: [
    {
      org: "MAASTRICHT UMC+",
      date: "16/08/2025",
      problem: "Suspected wrist fracture",
      vitals: "BP 140/85, weight 81 kg",
      vitalsConflict: [
        { org: "Maastricht UMC+", value: "140/85" },
        { org: "Tergooi", value: "130/85" },
      ],
      outcome: "Cast applied, follow-up in 3 weeks",
      additional1: "Patient reports fall during sports activity",
      additional2: "X-ray confirms non-displaced fracture",
      careProvider: "Dr. R. Verhoeven (Emergency Medicine)",
      status: "ARRIVED",
    },
    {
      org: "TERGOOI",
      date: "16/08/2025",
      problem: "Suspected wrist fracture",
      vitals: "BP 130/85, weight 81 kg",
      vitalsConflict: [
        { org: "Maastricht UMC+", value: "140/85" },
        { org: "Tergooi", value: "130/85" },
      ],
      outcome: "/",
      additional1: "/",
      additional2: "/",
      careProvider: "/",
      status: "ARRIVED",
    },
  ],
  e1: [
    {
      org: "GP PRACTICE DE LINDE, AMERSFOORT",
      date: "22/08/2025",
      problem: "Hypertension monitoring",
      vitals: "BP 138/86, weight 79 kg",
      outcome: "No changes in meds, follow-up in 3 weeks",
      additional1: "Patient adherent to medication",
      additional2: "Lifestyle advice reinforced",
      careProvider: "Dr. A. Dijkstra (General Practitioner)",
      status: "ARRIVED",
    },
  ],
};

// Fallback for encounters without hand-authored detail data above.
function genericDetail(item) {
  const parts = item.label.split("|").map((s) => s.trim());
  const org = item.source.replace(/\s*\(\+\d+\)\s*$/, "");
  return [
    {
      org: org.toUpperCase(),
      date: item.date.split(" - ")[0],
      problem: parts[1] || parts[0],
      vitals: null,
      outcome: "No changes, follow-up as scheduled",
      additional1: "—",
      additional2: "—",
      careProvider: "Dr. A. Dijkstra (General Practitioner)",
      status: "ARRIVED",
    },
  ];
}

// Encounter-type checkboxes offered in the filter drawer, and how they map
// onto the "Type | Detail" label prefix each mock entry already has.
const FILTER_TYPES = [
  { key: "outpatient", label: "Outpatient visits", test: (p) => p.startsWith("Outpatient visit") },
  { key: "emergency", label: "Emergency", test: (p) => p.startsWith("Emergency") },
  { key: "day-treatment", label: "Day treatment", test: (p) => p.startsWith("Day treatment") },
  { key: "therapy", label: "Therapy session", test: (p) => p.startsWith("Therapy session") },
  { key: "teleconsult", label: "Teleconsult", test: (p) => p.startsWith("Teleconsult") },
];

function encounterTypeKey(item) {
  const prefix = item.label.split("|")[0].trim();
  return FILTER_TYPES.find((t) => t.test(prefix))?.key ?? null;
}

// Which SOURCE_CONFIG source contributed a given item — used by the
// "All organisations" global filter (looked up rather than stored on the
// item, so the merge-on-arrival data shape doesn't need to change).
function sourceIdForItem(item) {
  return SOURCE_CONFIG.find((s) => s.entries.some((e) => e.id === item.id))?.id;
}

const TIME_OPTIONS = [
  { key: "all", label: "All time" },
  { key: "month", label: "Last month" },
  { key: "6months", label: "Last 6 months" },
  { key: "year", label: "Last year" },
  { key: "5years", label: "Last 5 years" },
];

function withinTimeWindow(item, timeFilter) {
  if (timeFilter === "all") return true;
  const days = { month: 31, "6months": 186, year: 366, "5years": 366 * 5 }[timeFilter];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(item.sortDate) >= cutoff;
}

function orgFilterLabel(selected) {
  if (selected.size === SOURCE_CONFIG.length) return "All organisations";
  if (selected.size === 0) return "No organisations";
  if (selected.size <= 2) return SOURCE_CONFIG.filter((s) => selected.has(s.id)).map((s) => s.name).join(", ");
  return `${selected.size} organisations selected`;
}

// Shared close-on-outside-click behavior for the header dropdowns.
function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [active, ref, onOutside]);
}

function formatClock(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const iconSpring = { type: "spring", stiffness: 550, damping: 30 };
const cardSpring = { type: "spring", stiffness: 420, damping: 34 };

// Crossfades between per-state icons in a fixed 17px box so rows never shift.
function StatusIcon({ state }) {
  const icons = {
    loading: <span className="block w-[17px] h-[17px] border-2 border-[#CED4DA] border-t-[#0080A3] rounded-full animate-spin" />,
    loaded: <CheckCircle2 size={17} style={{ color: T.success }} />,
    empty: <MinusCircle size={17} style={{ color: T.gray500 }} />,
    failed: <AlertTriangle size={17} className="text-red-600" />,
  };
  return (
    <span className="relative block w-[17px] h-[17px] shrink-0">
      <AnimatePresence initial={false}>
        <motion.span
          key={state}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={iconSpring}
        >
          {icons[state]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Crossfades inline content (e.g. "fetching…" → timestamp) keyed by state.
function FadeSwap({ id, className, children }) {
  return (
    <span className={className}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={id}
          className="inline-flex items-center"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Small loading→check indicator for the category menu rows.
function CategoryTick({ done }) {
  return (
    <span className="relative block w-[16px] h-[16px] shrink-0">
      <AnimatePresence initial={false}>
        <motion.span
          key={done ? "done" : "loading"}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={iconSpring}
        >
          {done
            ? <Check size={15} strokeWidth={3} style={{ color: T.success }} />
            : <span className="block w-[13px] h-[13px] border-2 border-[#CED4DA] border-t-[#0080A3] rounded-full animate-spin" />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Renders "Maastricht UMC+ (+1)" with the "(+1)" count in bold primary,
// signalling that this card merges records from more than one organization.
function SourceLabel({ source }) {
  const match = source.match(/^(.*?)\s*(\(\+\d+\))$/);
  if (!match) return <span>{source}</span>;
  return (
    <span>
      {match[1]} <span className="font-bold" style={{ color: T.primary }}>{match[2]}</span>
    </span>
  );
}

// Hover comparison shown on a vital-sign value that disagrees across the
// organizations contributing to a merged encounter.
function VitalsWarning({ comparisons }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <AlertCircle size={16} style={{ color: T.warning, fill: T.warning, stroke: "#fff" }} />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 rounded-md text-white text-[13px] whitespace-nowrap shadow-lg"
            style={{ backgroundColor: T.secondary }}
          >
            {comparisons.map((c, i) => (
              <div key={i}>{c.org}: {c.value}</div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function DetailRow({ label, children }) {
  if (children === null || children === undefined) return null;
  return (
    <div className="flex items-start gap-4 py-1 text-[13px]">
      <span className="w-[120px] shrink-0" style={{ color: T.gray600 }}>{label}</span>
      <span className="flex items-center gap-1.5 flex-wrap" style={{ color: T.bodyText }}>{children}</span>
    </div>
  );
}

function StatusBadge({ children }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: "#E4F0E0", color: T.success }}
    >
      {children}
    </span>
  );
}

// One organization's contribution to an (expanded) encounter card. Merged
// encounters render one of these per contributing source.
function OrgDetailBlock({ detail, isFirst }) {
  return (
    <div className={`px-4 py-3 ${isFirst ? "" : "border-t border-white"}`} style={{ backgroundColor: T.light }}>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[12px] font-bold tracking-wide" style={{ color: T.bodyText }}>{detail.org}</span>
        <span className="text-[13px]" style={{ color: T.gray600 }}>{detail.date}</span>
      </div>
      <DetailRow label="Problem">
        {detail.problem}
        {detail.problem && <ExternalLink size={13} style={{ color: T.primary }} />}
      </DetailRow>
      <DetailRow label="Vital signs">
        {detail.vitals && (
          <>
            {detail.vitals}
            <ExternalLink size={13} style={{ color: T.primary }} />
            {detail.vitalsConflict && <VitalsWarning comparisons={detail.vitalsConflict} />}
          </>
        )}
      </DetailRow>
      <div className="my-2 border-t" style={{ borderColor: T.border }} />
      <DetailRow label="Outcome">{detail.outcome}</DetailRow>
      <DetailRow label="Additional info">{detail.additional1}</DetailRow>
      <DetailRow label="Additional info">{detail.additional2}</DetailRow>
      <DetailRow label="Care provider">{detail.careProvider}</DetailRow>
      <div className="flex items-start gap-4 py-1 text-[13px]">
        <span className="w-[120px] shrink-0" style={{ color: T.gray600 }}>Status</span>
        <StatusBadge>{detail.status}</StatusBadge>
      </div>
    </div>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <button onClick={onChange} className="w-full flex items-center gap-2.5 py-1.5 text-[14px] text-left">
      <span
        className="w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 border-2 transition-colors"
        style={{ backgroundColor: checked ? T.primary : "#fff", borderColor: checked ? T.primary : T.gray400 }}
      >
        <AnimatePresence>
          {checked && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={iconSpring}>
              <Check size={13} strokeWidth={3} className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span style={{ color: T.bodyText }}>{label}</span>
    </button>
  );
}

// Collapsible section of the filter drawer ("Status", "Encounter type", …),
// plus icon rotating into an x when expanded.
function FilterAccordion({ title, open, onToggle, children }) {
  return (
    <div className="border-b" style={{ borderColor: T.border }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 text-[14px]" style={{ color: T.bodyText }}>
        {title}
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
          <Plus size={16} style={{ color: T.gray600 }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-5 pb-4 pt-1" style={{ backgroundColor: T.lightBg }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EncountersSection({ scrollRef, sourceFilter, timeFilter }) {
  const [runId, setRunId] = useState(0);
  const [sourceStatus, setSourceStatus] = useState({});
  const [visibleItems, setVisibleItems] = useState([]);
  const [queuedItems, setQueuedItems] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  // Simulated load state of the other categories (not wired to real data).
  const [categoryDone, setCategoryDone] = useState({ klachten: false, treatment: false });
  const [expandedIds, setExpandedIds] = useState({});
  const toggleExpand = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  // Sort order: a display preference, re-applied to whatever is already
  // merged rather than re-running the simulation.
  const [sortOrder, setSortOrder] = useState("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortOrderRef = useRef("newest");
  const sortMenuRef = useRef(null);

  // Filter drawer state — purely a view over whatever has already arrived;
  // it never touches the merge-on-arrival or pagination logic.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typeFilters, setTypeFilters] = useState(new Set());
  const [statusFilters, setStatusFilters] = useState({ arrived: true, planned: true });
  const [careProviderQuery, setCareProviderQuery] = useState("");
  const [drawerSections, setDrawerSections] = useState({ status: false, encounterType: true, careProvider: false });

  const allItemsRef = useRef([]);
  const timeoutsRef = useRef([]);
  // Read at timeout-fire time (state values here would be stale — the
  // timeouts are scheduled once, before the user has scrolled or expanded).
  const userScrolledRef = useRef(false);
  const queuePendingRef = useRef(false);
  // How many entries each source has delivered so far (server-side cursor).
  const fetchedRef = useRef({});

  const statuses = Object.values(sourceStatus);
  const pendingCount = statuses.filter((s) => s.state === "loading").length;
  const failedCount = statuses.filter((s) => s.state === "failed").length;
  // Only sources that actually responded count as loaded (empty = responded, no records)
  const loadedCount = statuses.filter((s) => s.state === "loaded" || s.state === "empty").length;
  const allSettled = statuses.length > 0 && pendingCount === 0;

  const applySort = useCallback((list, order) => {
    const o = order || sortOrderRef.current;
    return [...list].sort((a, b) =>
      o === "oldest" ? new Date(a.sortDate) - new Date(b.sortDate) : new Date(b.sortDate) - new Date(a.sortDate)
    );
  }, []);

  // Sort is a display preference: re-sort whatever has already arrived
  // rather than touching the merge-on-arrival state machine.
  const changeSortOrder = (order) => {
    sortOrderRef.current = order;
    setSortOrder(order);
    setVisibleItems((prev) => applySort(prev, order));
    setQueuedItems((prev) => (prev ? applySort(prev, order) : prev));
    setSortMenuOpen(false);
  };

  // phase: "initial" for the first fetch, "more" for pagination fetches
  // triggered by Show more. Each fetch returns the next FETCH_PAGE entries.
  const runSource = useCallback((source, opts = {}) => {
    const phase = opts.phase || "initial";
    setSourceStatus((prev) => ({ ...prev, [source.id]: { ...prev[source.id], state: "loading", phase } }));
    const t = setTimeout(() => {
      const now = new Date();
      const state = source.outcome === "empty" ? "empty" : source.outcome === "failed" ? "failed" : "loaded";
      const already = fetchedRef.current[source.id] || 0;
      const slice = state === "loaded" ? source.entries.slice(already, already + FETCH_PAGE) : [];
      if (state === "loaded") fetchedRef.current[source.id] = already + slice.length;
      setSourceStatus((prev) => ({
        ...prev,
        [source.id]: { state, time: now, phase, fetched: fetchedRef.current[source.id] || 0, total: source.entries.length },
      }));
      setLastUpdated(now);

      if (slice.length) {
        allItemsRef.current = [...allItemsRef.current, ...slice];
        const sorted = applySort(allItemsRef.current);
        // Everything fetched is displayed. Arrivals are deferred behind the
        // banner only while the user has scrolled into the page — except
        // records the user explicitly requested via Show more ("more" phase),
        // which merge immediately. A pending queue always absorbs subsequent
        // arrivals so the banner's contents can't leak in early.
        const engaged = userScrolledRef.current && phase !== "more";
        if (queuePendingRef.current || engaged) {
          queuePendingRef.current = true;
          setQueuedItems(sorted);
        } else {
          setVisibleItems(sorted);
        }
      }
    }, opts.delayMs ? opts.delayMs() : source.delayMs());
    timeoutsRef.current.push(t);
  }, []);

  const startSimulation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    allItemsRef.current = [];
    setVisibleItems([]);
    setQueuedItems(null);
    userScrolledRef.current = false;
    queuePendingRef.current = false;
    fetchedRef.current = {};
    setExpandedIds({});
    setSourceStatus(Object.fromEntries(SOURCE_CONFIG.map((s) => [s.id, { state: "loading" }])));
    SOURCE_CONFIG.forEach(runSource);
    // Mock loads for the other categories, so the whole menu comes alive.
    setCategoryDone({ klachten: false, treatment: false });
    timeoutsRef.current.push(setTimeout(() => setCategoryDone((p) => ({ ...p, treatment: true })), 4000 + Math.random() * 3000));
    timeoutsRef.current.push(setTimeout(() => setCategoryDone((p) => ({ ...p, klachten: true })), 8000 + Math.random() * 4000));
  }, [runSource]);

  useEffect(() => {
    startSimulation();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [runId]);

  const retrySource = (id) => {
    const source = SOURCE_CONFIG.find((s) => s.id === id);
    runSource(source, { delayMs: () => 2500 });
  };

  // Ask every fully-responded source that still has server-side records for
  // its next page. Their status rows return to a (re)fetching state.
  const fetchMoreFromSources = () => {
    SOURCE_CONFIG.forEach((source) => {
      const st = sourceStatus[source.id];
      const fetched = fetchedRef.current[source.id] || 0;
      if (st?.state === "loaded" && fetched < source.entries.length) {
        runSource(source, { phase: "more", delayMs: () => 3000 + Math.random() * 2000 });
      }
    });
  };

  const applyQueued = () => {
    setVisibleItems(queuedItems);
    setQueuedItems(null);
    queuePendingRef.current = false;
  };

  // Engagement now tracks the page scroll (the whole content column scrolls,
  // not the list itself). Scrolled meaningfully into the page = reading.
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const onScroll = () => {
      userScrolledRef.current = el.scrollTop > 100;
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  useEffect(() => {
    if (!sortMenuOpen) return;
    const onClick = (e) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target)) setSortMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const toggleType = (key) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setTypeFilters(new Set());
    setStatusFilters({ arrived: true, planned: true });
    setCareProviderQuery("");
  };

  const activeFilterCount =
    typeFilters.size +
    (!statusFilters.arrived || !statusFilters.planned ? 1 : 0) +
    (careProviderQuery.trim() ? 1 : 0);

  // Filters are a pure view over whatever has already merged in — they never
  // change what's fetched, only what's shown. Source/time come from the
  // page-level "All organisations" / "All time" dropdowns.
  const passesFilters = (item) => {
    if (!statusFilters.arrived) return false; // every entry here is "arrived" (this is the Past tab)
    if (sourceFilter && !sourceFilter.has(sourceIdForItem(item))) return false;
    if (!withinTimeWindow(item, timeFilter)) return false;
    if (typeFilters.size > 0) {
      const key = encounterTypeKey(item);
      if (!key || !typeFilters.has(key)) return false;
    }
    if (careProviderQuery.trim()) {
      const q = careProviderQuery.trim().toLowerCase();
      const details = ENCOUNTER_DETAILS[item.id] || genericDetail(item);
      if (!details.some((d) => d.careProvider && d.careProvider.toLowerCase().includes(q))) return false;
    }
    return true;
  };

  const displayedItems = visibleItems.filter(passesFilters);

  // Records known to exist on the server but not yet fetched (e.g. Maastricht
  // reported total 16 and delivered 10). This is what "Show more" loads —
  // it's hidden entirely once the picture is complete.
  const serverRemaining = SOURCE_CONFIG.reduce((sum, s) => {
    const st = sourceStatus[s.id];
    return st?.state === "loaded" ? sum + (st.total - st.fetched) : sum;
  }, 0);

  return (
    <>
    <div className="grid grid-cols-[300px_1fr] gap-10">
      <div className="flex flex-col self-start sticky top-6">
        <div className="text-white font-semibold text-sm tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5 rounded-t-sm" style={{ backgroundColor: T.primary }}>
          <span className="flex items-center gap-2.5"><CalendarDays size={16} /> ENCOUNTERS</span>
          {/* Live per-category indicator: counts up per settled source, then
              resolves to a check (or warning when a source failed). */}
          <span className="relative block w-[32px] h-[18px] shrink-0">
            <AnimatePresence initial={false}>
              <motion.span
                key={!allSettled ? `n${loadedCount}` : failedCount > 0 ? "warn" : "done"}
                className="absolute inset-0 flex items-center justify-end"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {!allSettled
                  ? <span className="text-[13px] font-semibold tabular-nums">{loadedCount}/{SOURCE_CONFIG.length}</span>
                  : failedCount > 0
                    ? <AlertTriangle size={14} style={{ color: T.warning }} />
                    : <Check size={15} strokeWidth={3} />}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>
        <div className="border border-t-0 border-[#DEE2E6] bg-white text-sm font-semibold tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5" style={{ color: T.bodyText }}>
          <span className="flex items-center gap-2.5"><Stethoscope size={16} style={{ color: T.primary }} /> KLACHTEN EN DIAGNOSES</span>
          <CategoryTick done={categoryDone.klachten} />
        </div>
        <div className="border border-t-0 border-[#DEE2E6] bg-white text-sm font-semibold tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5" style={{ color: T.bodyText }}>
          <span className="flex items-center gap-2.5"><ClipboardList size={16} style={{ color: T.primary }} /> TREATMENT RESTRICTIONS</span>
          <CategoryTick done={categoryDone.treatment} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[22px] font-semibold leading-tight" style={{ color: T.bodyText }}>Encounters</h2>
          <div className="flex items-center gap-3 text-sm" style={{ color: T.gray600 }}>
            <button
              onClick={() => setSourcesOpen((v) => !v)}
              className="flex items-center gap-1.5"
            >
              <span className="relative block w-[14px] h-[14px]">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={!allSettled ? "pending" : failedCount > 0 ? "failed" : "done"}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={iconSpring}
                  >
                    {!allSettled
                      ? <AlertCircle size={14} style={{ color: T.warning, fill: T.warning, stroke: "#fff" }} />
                      : failedCount > 0
                        ? <AlertTriangle size={14} className="text-red-600" />
                        : <CheckCircle2 size={14} style={{ color: T.success }} />}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="underline underline-offset-2" style={{ color: T.bodyText }}>
                Sources ({loadedCount}/{SOURCE_CONFIG.length} loaded)
              </span>
              {sourcesOpen ? <ChevronUp size={14} style={{ color: T.primary }} /> : <ChevronDown size={14} style={{ color: T.primary }} />}
            </button>
            <FadeSwap id={allSettled ? "complete" : "updating"}>
              {allSettled
                ? <span>Complete as of {lastUpdated ? formatClock(lastUpdated) : "—"}</span>
                : <span>Updated: {lastUpdated ? formatClock(lastUpdated) : "—"}</span>}
            </FadeSwap>
            <motion.button onClick={() => setRunId((r) => r + 1)} aria-label="Refresh" whileTap={{ scale: 0.85, rotate: 90 }}>
              <RefreshCw size={15} style={{ color: T.primary }} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {sourcesOpen && (
            <motion.div
              key="sources-panel"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="rounded-md overflow-hidden mb-4 border border-[#DEE2E6]">
                {SOURCE_CONFIG.map((source, i) => {
                  const status = sourceStatus[source.id] || { state: "loading" };
                  return (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm ${i > 0 ? "border-t border-white" : ""}`}
                      style={{ backgroundColor: T.lightBg }}
                    >
                      <div className="flex items-center gap-2.5">
                        <StatusIcon state={status.state} />
                        <div>
                          <div className={`font-semibold text-[14px] ${status.state === "failed" ? "text-red-700" : ""}`} style={status.state === "failed" ? undefined : { color: T.bodyText }}>
                            {source.name}
                          </div>
                          <AnimatePresence initial={false}>
                            {(status.state === "empty" || status.state === "failed" || (status.state === "loaded" && status.fetched < status.total)) && (
                              <motion.div
                                key="subline"
                                className="overflow-hidden"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              >
                                <div className="text-[13px]" style={{ color: status.state === "failed" ? "#dc2626" : T.gray500 }}>
                                  {status.state === "failed"
                                    ? "Fetch failed"
                                    : status.state === "empty"
                                      ? "No records found for this patient"
                                      : `Latest ${status.fetched} of ${status.total} records loaded`}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <FadeSwap id={status.state === "loading" ? `loading-${status.phase || "initial"}` : status.state} className="text-sm" >
                        {status.state === "loading" && (
                          <span style={{ color: T.gray600 }}>{status.phase === "more" ? "fetching more…" : "fetching…"}</span>
                        )}
                        {(status.state === "loaded" || status.state === "empty") && <span style={{ color: T.gray600 }}>{formatClock(status.time)}</span>}
                        {status.state === "failed" && (
                          <motion.button onClick={() => retrySource(source.id)} aria-label="Retry" whileTap={{ scale: 0.85, rotate: 90 }}>
                            <RefreshCw size={15} className="text-gray-500 hover:text-gray-800" />
                          </motion.button>
                        )}
                      </FadeSwap>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: T.primary }}>Past (24)</span>
            <span className="text-sm px-3 py-1" style={{ color: T.gray600 }}>Planned (0)</span>
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: T.primary }}>
            <div className="relative" ref={sortMenuRef}>
              <button onClick={() => setSortMenuOpen((v) => !v)} className="flex items-center gap-1">
                <ArrowUpDown size={14} /> Sort: {sortOrder === "oldest" ? "Oldest first" : "Newest first"}
              </button>
              <AnimatePresence>
                {sortMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-44 rounded-md border bg-white shadow-lg overflow-hidden z-20"
                    style={{ borderColor: T.border }}
                  >
                    {["newest", "oldest"].map((o) => (
                      <button
                        key={o}
                        onClick={() => changeSortOrder(o)}
                        className="w-full text-left px-4 py-2.5 text-[14px]"
                        style={{ color: T.bodyText, backgroundColor: sortOrder === o ? T.light : "#fff" }}
                      >
                        {o === "oldest" ? "Oldest first" : "Newest first"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-1.5">
              <Filter size={14} /> Filters
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={iconSpring}
                    className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-white text-[11px] font-bold"
                    style={{ backgroundColor: T.primary }}
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {queuedItems && (
            <motion.div
              key="queued-banner"
              className="overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <motion.button
                onClick={applyQueued}
                whileTap={{ scale: 0.98 }}
                className="w-full mb-3 flex items-center justify-center gap-2 text-sm rounded-md py-2 border"
                style={{ backgroundColor: T.light, borderColor: T.primary, color: T.primary }}
              >
                <ArrowDown size={14} /> New entries available — click to update
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {visibleItems.length === 0 && (
              <motion.div
                key="empty-state"
                className="text-sm py-6 text-center border rounded-md"
                style={{ color: T.gray500, borderColor: T.border }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                Loading first results…
              </motion.div>
            )}
            {visibleItems.length > 0 && displayedItems.length === 0 && (
              <motion.div
                key="filtered-empty"
                className="text-sm py-6 text-center border rounded-md"
                style={{ color: T.gray500, borderColor: T.border }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                No encounters match the selected filters.{" "}
                <button onClick={clearFilters} className="underline font-semibold" style={{ color: T.primary }}>
                  Clear filters
                </button>
              </motion.div>
            )}
            {displayedItems.map((item) => {
              const isExpanded = !!expandedIds[item.id];
              const details = ENCOUNTER_DETAILS[item.id] || genericDetail(item);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ ...cardSpring, opacity: { duration: 0.25 } }}
                  className="border rounded-md bg-white overflow-hidden"
                  style={{ borderColor: T.border }}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full text-left px-4 py-3 hover:bg-black/[0.02]"
                  >
                    <div className="flex items-center justify-between text-[13px] mb-1" style={{ color: T.gray600 }}>
                      <span>{item.date}</span>
                      <span><SourceLabel source={item.source} /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold" style={{ color: T.primary }}>{item.label}</span>
                      <motion.span
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="shrink-0"
                      >
                        <ChevronDown size={16} style={{ color: T.primary }} />
                      </motion.span>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="detail"
                        className="overflow-hidden border-t"
                        style={{ borderColor: T.border }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        {details.map((d, i) => (
                          <OrgDetailBlock key={i} detail={d} isFirst={i === 0} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {serverRemaining > 0 && (
            <motion.div
              key="show-more"
              className="flex justify-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                onClick={fetchMoreFromSources}
                whileTap={{ scale: 0.97 }}
                className="border text-sm rounded-md px-6 py-2"
                style={{ borderColor: T.primary, color: T.primary }}
              >
                Show more{" "}
                <FadeSwap id={serverRemaining} className="inline-flex">
                  <span>({serverRemaining})</span>
                </FadeSwap>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="filters-backdrop"
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              key="filters-drawer"
              className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white z-50 shadow-2xl flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: T.border }}>
                <span className="text-[13px] font-bold tracking-wide" style={{ color: T.bodyText }}>FILTERS</span>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X size={20} style={{ color: T.primary }} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <FilterAccordion
                  title="Status"
                  open={drawerSections.status}
                  onToggle={() => setDrawerSections((p) => ({ ...p, status: !p.status }))}
                >
                  <FilterCheckbox
                    label="Arrived"
                    checked={statusFilters.arrived}
                    onChange={() => setStatusFilters((p) => ({ ...p, arrived: !p.arrived }))}
                  />
                  <FilterCheckbox
                    label="Planned"
                    checked={statusFilters.planned}
                    onChange={() => setStatusFilters((p) => ({ ...p, planned: !p.planned }))}
                  />
                </FilterAccordion>

                <FilterAccordion
                  title="Encounter type"
                  open={drawerSections.encounterType}
                  onToggle={() => setDrawerSections((p) => ({ ...p, encounterType: !p.encounterType }))}
                >
                  {FILTER_TYPES.map((t) => (
                    <FilterCheckbox key={t.key} label={t.label} checked={typeFilters.has(t.key)} onChange={() => toggleType(t.key)} />
                  ))}
                </FilterAccordion>

                <FilterAccordion
                  title="Care provider"
                  open={drawerSections.careProvider}
                  onToggle={() => setDrawerSections((p) => ({ ...p, careProvider: !p.careProvider }))}
                >
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: T.gray500 }} />
                    <input
                      value={careProviderQuery}
                      onChange={(e) => setCareProviderQuery(e.target.value)}
                      placeholder="Search care provider"
                      className="w-full pl-8 pr-3 py-2 text-[14px] rounded border bg-white outline-none"
                      style={{ borderColor: T.gray400, color: T.bodyText }}
                    />
                  </div>
                </FilterAccordion>
              </div>

              {activeFilterCount > 0 && (
                <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: T.border }}>
                  <button onClick={clearFilters} className="text-[14px] font-semibold" style={{ color: T.primary }}>
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}

const NAV_ITEMS = [
  { icon: Users, label: "Patients", active: true },
  { icon: Repeat, label: "Referrals" },
  { icon: CornerDownRight, label: "Received referrals" },
  { icon: CalendarDays, label: "Scheduling" },
  { icon: LayoutGrid, label: "MDT meetings" },
  { icon: Bell, label: "Notifications" },
  { icon: Stethoscope, label: "Care services" },
  { icon: List, label: "Patient lists" },
  { icon: UserPlus, label: "Patient merger" },
  { icon: FileText, label: "Integration logs" },
  { icon: BarChart3, label: "Analytics" },
];

function Sidebar() {
  return (
    <div className="w-64 shrink-0 flex flex-col text-white" style={{ backgroundColor: T.secondary }}>
      <div className="h-[88px] flex items-center gap-3 px-5" style={{ backgroundColor: T.secondary }}>
        <svg width="34" height="34" viewBox="0 0 32 32" fill="#17A3C6">
          <path d="M4 1H28L21 9H11L4 1Z" />
          <path d="M31 4V28L23 21V11L31 4Z" />
          <path d="M28 31H4L11 23H21L28 31Z" />
          <path d="M1 4L9 11V21L1 28V4Z" />
        </svg>
        <div className="leading-none">
          <div className="text-[9px] tracking-[0.25em] font-semibold">OPEN<span className="font-normal opacity-80">LINE</span></div>
          <div className="text-[19px] font-bold tracking-[0.08em] mt-0.5">VITALY</div>
        </div>
      </div>
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className="w-full flex items-center gap-3 px-5 py-2.5 text-[14px] text-left transition-colors hover:bg-white/10"
            style={active ? { backgroundColor: T.primary } : undefined}
          >
            <Icon size={17} className="shrink-0" /> {label}
          </button>
        ))}
      </nav>
      <button className="w-full flex items-center gap-3 px-5 py-3 text-[14px] text-left hover:bg-white/10">
        <History size={17} /> Last view patients
      </button>
      <button className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px] text-left hover:bg-white/10" style={{ backgroundColor: T.dark }}>
        <ChevronsLeft size={17} /> Collapse menu
      </button>
    </div>
  );
}

const TABS = ["PATIENT 360", "CONTACTS", "DOCUMENTS", "REFERRALS"];

function PatientBar({ activeTab, onTabChange }) {
  return (
    <div className="flex items-stretch border-b bg-white" style={{ borderColor: T.border }}>
      <div className="flex items-center px-3 border-r" style={{ borderColor: T.border }}>
        <ChevronLeft size={18} style={{ color: T.primary }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-3 border-r" style={{ borderColor: T.border }}>
        <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCEEF3" }}>
          <User size={26} style={{ color: T.primary }} />
        </span>
        <div className="leading-snug">
          <div className="text-[15px] font-bold" style={{ color: T.bodyText }}>Leroy Matt Evans</div>
          <div className="text-[13px]" style={{ color: T.gray600 }}>ID 161 885 4347</div>
          <div className="text-[13px]" style={{ color: T.gray600 }}>16.08.2024(16yrs) · Male</div>
        </div>
      </div>
      <div className="flex-1 flex items-stretch justify-end gap-10 px-10">
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`relative flex items-center text-[13px] tracking-wide ${active ? "font-bold" : "font-normal"}`}
              style={{ color: active ? T.primary : T.gray700 }}
            >
              {tab}
              {active && (
                <motion.span
                  layoutId="patient-tab-underline"
                  className="absolute left-0 right-0 bottom-0 h-[3px]"
                  style={{ backgroundColor: T.primary }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// "All organisations" — multi-select checkbox dropdown, global to the page.
function OrgFilterDropdown({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const toggle = (id) => {
    onChange((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-60 flex items-center justify-between border rounded px-3 py-2 text-[14px] bg-white text-left"
        style={{ borderColor: T.gray400, color: T.gray600 }}
      >
        <span className="truncate">{orgFilterLabel(selected)}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={15} style={{ color: T.primary }} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-72 rounded-md border bg-white shadow-lg p-3 z-20"
            style={{ borderColor: T.border }}
          >
            {SOURCE_CONFIG.map((s) => (
              <FilterCheckbox key={s.id} label={s.name} checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// "All time" — single-select dropdown, global to the page.
function TimeFilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const label = TIME_OPTIONS.find((o) => o.key === value)?.label ?? "All time";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-60 flex items-center justify-between border rounded px-3 py-2 text-[14px] bg-white"
        style={{ borderColor: T.gray400, color: T.gray600 }}
      >
        {label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} style={{ color: T.primary }} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-60 rounded-md border bg-white shadow-lg overflow-hidden z-20"
            style={{ borderColor: T.border }}
          >
            {TIME_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-[14px]"
                style={{ color: T.bodyText, backgroundColor: value === o.key ? T.lightBg : "#fff" }}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VitalyPatient360() {
  const [activeTab, setActiveTab] = useState("PATIENT 360");
  const contentScrollRef = useRef(null);
  // Global filters, applied across whichever section is showing — currently
  // only Encounters reads them, but they live at the page level on purpose.
  const [sourceFilter, setSourceFilter] = useState(() => new Set(SOURCE_CONFIG.map((s) => s.id)));
  const [timeFilter, setTimeFilter] = useState("all");

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: T.fontFamily, color: T.bodyText }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between pl-8 pr-6 py-2.5 bg-white border-b" style={{ borderColor: T.border }}>
          <h1 className="text-[24px] font-semibold leading-tight" style={{ color: T.bodyText }}>Patients</h1>
          <div className="flex items-center gap-4">
            <span className="relative">
              <Bell size={19} style={{ color: T.primary }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            </span>
            <span className="w-px h-6" style={{ backgroundColor: T.border }} />
            <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCEEF3" }}>
              <User size={18} style={{ color: T.primary }} />
            </span>
            <span className="text-[15px] font-semibold" style={{ color: T.bodyText }}>Prof.Dr.Muller</span>
            <ChevronDown size={16} style={{ color: T.primary }} />
          </div>
        </div>

        <PatientBar activeTab={activeTab} onTabChange={setActiveTab} />

        <div ref={contentScrollRef} className="flex-1 overflow-y-auto" style={{ backgroundColor: "#F8F9FA" }}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="px-8 py-6"
            >
              {activeTab === "PATIENT 360" ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[22px] font-semibold" style={{ color: T.bodyText }}>Patient 360</h2>
                    <div className="flex items-center gap-4">
                      <OrgFilterDropdown selected={sourceFilter} onChange={setSourceFilter} />
                      <TimeFilterDropdown value={timeFilter} onChange={setTimeFilter} />
                    </div>
                  </div>
                  <EncountersSection scrollRef={contentScrollRef} sourceFilter={sourceFilter} timeFilter={timeFilter} />
                </>
              ) : (
                <div className="border rounded-md py-16 text-center text-sm" style={{ borderColor: T.border, color: T.gray500 }}>
                  {activeTab} — not part of this prototype
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
