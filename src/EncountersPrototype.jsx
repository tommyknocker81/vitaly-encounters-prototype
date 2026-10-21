import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, MinusCircle, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronsLeft,
  AlertTriangle, AlertCircle, ArrowUpDown, Filter, ArrowDown, CalendarDays, Stethoscope,
  ClipboardList, Users, Repeat, CornerDownRight, LayoutGrid, Bell, List, UserPlus,
  FileText, BarChart3, History, User, Check, ExternalLink, Plus, X, Search,
  Download, Printer, Menu, MoreVertical, Minus, Minimize2,
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
  danger: "#DC5B5B",     // Treatment-restriction label color
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
    // The first fetch always fails; a manual retry (via the source row's
    // retry button) succeeds and delivers this source's records.
    retryOutcome: "loaded",
    entries: [
      { id: "u1", date: "05/09/2024", sortDate: "2024-09-05", label: "Outpatient visit | Rheumatology consultation", source: "UMC Utrecht" },
    ],
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

// Klachten en diagnoses / Treatment restrictions — the left rail's other two
// categories. Static (not fetched page-by-page), but each entry deliberately
// lines up by date/org with an item already in SOURCE_CONFIG above, so the
// three categories read as one aggregated, cross-referenced patient picture
// rather than unrelated filler content.
const DIAGNOSIS_ENTRIES = [
  {
    id: "d1",
    date: "22/08/2025",
    sortDate: "2025-08-22",
    source: "GP Practice de Linde, Amersfoort",
    label: "Diagnosis | Essential hypertension",
    detail: {
      org: "GP Practice de Linde, Amersfoort",
      explanation: "Essential (primary) hypertension, diagnosed following repeated elevated readings at routine checks.",
      verificationStatus: "Confirmed",
      status: "ACTIVE",
      date: "22/08/2025",
    },
  },
  {
    id: "d2",
    date: "12/11/2021",
    sortDate: "2021-11-12",
    source: "Maastricht UMC+",
    label: "Diagnosis | Mild persistent asthma",
    detail: {
      org: "Maastricht UMC+",
      explanation: "Mild persistent asthma, well controlled on inhaled therapy.",
      location: "Lungs (bilateral)",
      verificationStatus: "Confirmed",
      status: "ACTIVE",
      date: "12/11/2021",
    },
  },
  {
    id: "d3",
    date: "22/11/2024",
    sortDate: "2024-11-22",
    source: "Maastricht UMC+",
    label: "Diagnosis | Type 1 Diabetes Mellitus",
    detail: {
      org: "Maastricht UMC+",
      explanation: "Type 1 diabetes mellitus, insulin-dependent, managed jointly with endocrinology.",
      verificationStatus: "Confirmed",
      status: "ACTIVE",
      date: "22/11/2024",
    },
  },
  {
    id: "d4",
    date: "16/08/2025",
    sortDate: "2025-08-16",
    source: "Maastricht UMC+",
    label: "Complaint | Persistent right wrist pain post-fracture",
    detail: {
      org: "Maastricht UMC+",
      explanation: "Persistent right wrist pain following the suspected fracture sustained during sports activity; monitored post-cast removal.",
      location: "Wrist",
      laterality: "Right",
      verificationStatus: "Confirmed",
      status: "COMPLETED",
      date: "16/08/2025",
    },
  },
];

const RESTRICTION_ENTRIES = [
  {
    id: "r1",
    date: "15/01/2022",
    sortDate: "2022-01-15",
    source: "GP Practice de Linde, Amersfoort",
    label: "Medication restriction | Avoid NSAIDs",
    detail: {
      limits: "Flagged after mild bronchospasm following ibuprofen taken for post-diagnosis asthma-related pain",
      verifiedBy: "Dr. A. Dijkstra (General Practitioner)",
      verificationDate: "15/1/2022",
    },
  },
  {
    id: "r2",
    date: "25/08/2025",
    sortDate: "2025-08-25",
    source: "GP Practice de Linde, Amersfoort",
    label: "Medication restriction | Avoid NSAIDs and aspirin",
    detail: {
      limits: "Extended to aspirin after confirmed sensitivity testing during wrist-fracture follow-up",
      verifiedBy: "Dr. A. Dijkstra (General Practitioner)",
      verificationDate: "25/8/2025",
    },
  },
];

// Shared by Diagnoses/Treatment so they can offer the same Sort/Filters
// experience Encounters has, without needing Encounters' own FILTER_TYPES
// (a different taxonomy tied to visit types).
function simpleTypeKey(item) {
  return item.label.split("|")[0].trim();
}
const DIAGNOSIS_FILTER_TYPES = [...new Set(DIAGNOSIS_ENTRIES.map(simpleTypeKey))].map((key) => ({ key, label: key }));
const TREATMENT_FILTER_TYPES = [...new Set(RESTRICTION_ENTRIES.map(simpleTypeKey))].map((key) => ({ key, label: key }));

// How many of a category's own entries came from a given source — used so
// the Sources breakdown's per-source subtext reflects what's actually on
// screen for Diagnoses/Treatment (a handful of records) rather than reusing
// Encounters' own fetched/total pagination counts.
function countByOrg(entries, orgName) {
  return entries.filter((e) => e.source === orgName).length;
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

/* ---- Linked records: documents (full screen) and ZIBs (drawer) ----------
   Per the Figma "BGZ/encounter" spec, an info row that leads to a *document*
   shows the filled document icon and opens it full screen; one that leads to
   another *ZIB* shows the link icon and opens that BGZ in a right-hand drawer. */

const ViewerContext = createContext({ openDocument: () => {}, openZib: () => {} });

const PATIENT = { first: "Leroy Matt", last: "EVANS", id: "161 885 4347", dob: "16.08.2024", sex: "Male" };

// Filled document glyph from the Figma "Icons/Small / document".
function DocumentIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2.5h8.2L19.5 8v12.2a1.3 1.3 0 0 1-1.3 1.3H6a1.3 1.3 0 0 1-1.3-1.3V3.8A1.3 1.3 0 0 1 6 2.5Z" fill={T.primary} />
      <path d="M14 2.5V8h5.5" fill="#fff" fillOpacity="0.35" />
      <path d="M8 12.5h8M8 15.5h8M8 18.5h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DocLink({ doc, label = "Open document" }) {
  const { openDocument } = useContext(ViewerContext);
  return (
    <button onClick={() => openDocument(doc)} aria-label={label} title={label} className="inline-flex items-center rounded hover:bg-black/[0.06] p-0.5 -m-0.5">
      <DocumentIcon />
    </button>
  );
}

function ZibLink({ zib, label }) {
  const { openZib } = useContext(ViewerContext);
  return (
    <button onClick={() => openZib(zib)} aria-label={label} title={label} className="inline-flex items-center rounded hover:bg-black/[0.06] p-0.5 -m-0.5">
      <ExternalLink size={14} strokeWidth={2.4} style={{ color: T.primary }} />
    </button>
  );
}

// Deterministic guid-looking file name, like the real viewer shows.
function pseudoGuid(seed) {
  let h = 2166136261;
  const out = [];
  for (let i = 0; i < 32; i++) {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) + i), 16777619) >>> 0;
    out.push((h >>> 28).toString(16));
  }
  const s = out.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

// Card headers show organisations in caps; documents/ZIBs use the proper name.
function properOrgName(org) {
  const known = SOURCE_CONFIG.find((s) => s.name.toUpperCase() === org.toUpperCase());
  if (known) return known.name;
  return org === org.toUpperCase() ? org.charAt(0) + org.slice(1).toLowerCase() : org;
}

// Builds the content of a mock clinical document from a few summary rows.
function buildDocument({ title, type, org: rawOrg, date, careProvider, summary }) {
  const org = properOrgName(rawOrg);
  const guid = pseudoGuid(`${title}${org}${date}`);
  return {
    title: `${title} (${date})`,
    filename: guid,
    sections: [
      { heading: "Document", rows: [["Id", guid], ["Type", type], ["Date", date], ["Organisation", org]] },
      { heading: "Patient", rows: [["First name", PATIENT.first], ["Last name", PATIENT.last], ["ID", PATIENT.id], ["Sex", PATIENT.sex], ["Date of birth", PATIENT.dob]] },
      ...(careProvider ? [{ heading: "Author", rows: [["Full name", careProvider], ["Organisation", org]] }] : []),
    ],
    summaryHeading: type,
    summary: summary.filter(([, v]) => v),
  };
}

function encounterDocument(detail) {
  return buildDocument({
    title: detail.problem || "Encounter report",
    type: "Encounter report",
    org: detail.org,
    date: detail.date,
    careProvider: detail.careProvider && detail.careProvider !== "/" ? detail.careProvider : null,
    summary: [
      ["Problem", detail.problem],
      ["Vital signs", detail.vitals],
      ["Outcome", detail.outcome && detail.outcome !== "/" ? detail.outcome : null],
      ["Additional info", detail.additional1 && !["/", "—"].includes(detail.additional1) ? detail.additional1 : null],
      ["Status", detail.status],
    ],
  });
}

// Reads the structured values out of the "BP 140/85, weight 81 kg" strings.
function vitalsZib(detail) {
  const bp = detail.vitals.match(/BP\s*(\d+)\s*\/\s*(\d+)/);
  const kg = detail.vitals.match(/weight\s*(\d+(?:\.\d+)?)\s*kg/i);
  const org = properOrgName(detail.org);
  return {
    title: "Vital signs",
    org,
    date: detail.date,
    rows: [
      ["Systolic blood pressure", bp ? `${bp[1]} mmHg` : null],
      ["Diastolic blood pressure", bp ? `${bp[2]} mmHg` : null],
      ["Body weight", kg ? `${kg[1]} kg` : null],
      ["Measurement date", detail.date],
      ["Measured by", detail.careProvider && detail.careProvider !== "/" ? detail.careProvider : null],
      ["Source", detail.org],
    ].filter(([, v]) => v),
    status: detail.status,
    conflict: detail.vitalsConflict || null,
  };
}

// Full-screen document viewer (dark header + toolbar + white page).
function DocumentViewer({ doc, onClose }) {
  const [zoom, setZoom] = useState(100);
  const step = (d) => setZoom((z) => Math.min(200, Math.max(50, z + d)));
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ backgroundColor: "#2b2b2b", fontFamily: T.fontFamily }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="dialog"
      aria-label={doc.title}
    >
      <div className="relative flex items-center justify-between px-5 h-[46px] shrink-0 text-white" style={{ backgroundColor: T.secondary }}>
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCEEF3" }}>
            <User size={16} style={{ color: T.primary }} />
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-bold">{PATIENT.last}, {PATIENT.first}</div>
            <div className="text-[11px] opacity-80">ID {PATIENT.id} · {PATIENT.dob}</div>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-[18px] font-semibold tracking-wide whitespace-nowrap">{doc.title}</div>
        <div className="flex items-center gap-4">
          <button aria-label="Download" title="Download"><Download size={18} /></button>
          <button onClick={onClose} aria-label="Exit full screen" title="Exit full screen"><Minimize2 size={18} /></button>
          <button onClick={onClose} aria-label="Close document" title="Close"><X size={20} /></button>
        </div>
      </div>

      <div className="relative flex items-center h-[42px] shrink-0 px-5 text-white text-[13px]" style={{ backgroundColor: "#3c3c3c" }}>
        <Menu size={16} />
        <span className="ml-5 font-semibold">{doc.filename}</span>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="px-2 py-0.5 rounded bg-black/60">1</span><span>/ 1</span>
          <span className="w-px h-4 bg-white/30" />
          <button onClick={() => step(-25)} aria-label="Zoom out"><Minus size={14} /></button>
          <span className="px-2 py-0.5 rounded bg-black/60 tabular-nums">{zoom}%</span>
          <button onClick={() => step(25)} aria-label="Zoom in"><Plus size={14} /></button>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Download size={16} /><Printer size={16} /><MoreVertical size={16} />
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-5">
        <div className="bg-white shadow-xl origin-top shrink-0 mb-6" style={{ width: 585, minHeight: 760, padding: "28px 28px 40px", zoom: zoom / 100, color: T.bodyText }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[22px] font-bold leading-tight">{PATIENT.last}, {PATIENT.first}</div>
              <div className="text-[9px] mt-0.5" style={{ color: T.gray600 }}>
                <b>ID:</b> {PATIENT.id} &nbsp; <b>Date of birth</b> {PATIENT.dob} &nbsp; <b>Sex</b> {PATIENT.sex}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="#17A3C6"><path d="M4 1H28L21 9H11L4 1Z" /><path d="M31 4V28L23 21V11L31 4Z" /><path d="M28 31H4L11 23H21L28 31Z" /><path d="M1 4L9 11V21L1 28V4Z" /></svg>
              <span className="text-[15px] font-bold tracking-[0.18em]" style={{ color: T.gray700 }}>VITALY</span>
            </div>
          </div>
          <div className="h-[3px] mt-2.5 mb-6 rounded" style={{ backgroundColor: T.gray400 }} />

          {doc.sections.map((s) => (
            <div key={s.heading} className="grid grid-cols-[150px_1fr] mb-5">
              <div className="text-[13px] font-semibold">{s.heading}</div>
              <div className="flex flex-col gap-2.5">
                {s.rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[1fr_1.3fr] gap-3 text-[10.5px] leading-snug">
                    <span className="font-bold">{k}</span>
                    <span style={{ color: T.gray600 }} className="break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="text-[18px] font-semibold mt-8 pb-1 border-b" style={{ borderColor: T.gray600 }}>{doc.summaryHeading}</div>
          <div className="flex flex-col gap-2.5 mt-4">
            {doc.summary.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[150px_1fr] gap-3 text-[10.5px] leading-snug">
                <span className="font-bold">{k}</span>
                <span style={{ color: T.gray600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Right-hand drawer showing a linked BGZ (ZIB).
function ZibDrawer({ zib, onClose }) {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/30 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed top-0 right-0 h-full w-[383px] max-w-[92vw] bg-white z-50 shadow-2xl flex flex-col"
        style={{ fontFamily: T.fontFamily, color: T.bodyText }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        role="dialog"
        aria-label={`${zib.title} (ZIB)`}
      >
        <div className="flex items-center justify-between px-4 h-[72px] shrink-0">
          <span className="text-[13px] font-bold tracking-wide uppercase">{zib.title}</span>
          <button onClick={onClose} aria-label="Close"><X size={24} style={{ color: T.primary }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="rounded-md p-4" style={{ backgroundColor: T.light }}>
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="text-[12px] font-bold tracking-wide">{zib.org.toUpperCase()}</span>
              <span className="text-[14px]" style={{ color: T.gray600 }}>{zib.date}</span>
            </div>
            <div className="flex flex-col gap-3 text-[14px]">
              {zib.rows.map(([k, v]) => (
                <div key={k}>
                  <div className="font-semibold" style={{ color: T.gray600 }}>{k}</div>
                  <div>{v}</div>
                </div>
              ))}
              <div>
                <div className="font-semibold mb-0.5" style={{ color: T.gray600 }}>Status</div>
                <StatusBadge>{zib.status}</StatusBadge>
              </div>
            </div>
          </div>
          {zib.conflict && (
            <div className="mt-4 rounded-md px-4 py-3 border text-[13px]" style={{ borderColor: T.warning, backgroundColor: "#FFF6E8" }}>
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <AlertCircle size={15} style={{ color: T.warning, fill: T.warning, stroke: "#fff" }} /> Values differ between sources
              </div>
              {zib.conflict.map((c, i) => <div key={i}>{c.org}: {c.value}</div>)}
            </div>
          )}
        </div>
      </motion.div>
    </>
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
        {detail.problem && <DocLink doc={encounterDocument(detail)} />}
      </DetailRow>
      <DetailRow label="Vital signs">
        {detail.vitals && (
          <>
            {detail.vitals}
            <ZibLink zib={vitalsZib(detail)} label="Open Vital signs (ZIB)" />
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

function DiagnosisDetailBlock({ detail, title }) {
  const doc = buildDocument({
    title,
    type: "Diagnosis report",
    org: detail.org,
    date: detail.date,
    summary: [
      ["Explanation", detail.explanation],
      ["Anatom. location", detail.location],
      ["Laterality", detail.laterality],
      ["Verification status", detail.verificationStatus],
      ["Status", detail.status],
    ],
  });
  return (
    <div className="px-4 py-3" style={{ backgroundColor: T.light }}>
      <div className="mb-2">
        <span className="text-[12px] font-bold tracking-wide" style={{ color: T.bodyText }}>{detail.org}</span>
      </div>
      <DetailRow label="Explanation">
        {detail.explanation}
        <DocLink doc={doc} />
      </DetailRow>
      <DetailRow label="Anatom. location">{detail.location}</DetailRow>
      <DetailRow label="Laterality">{detail.laterality}</DetailRow>
      <DetailRow label="Verification status">{detail.verificationStatus}</DetailRow>
      <div className="flex items-start gap-4 py-1 text-[13px]">
        <span className="w-[120px] shrink-0" style={{ color: T.gray600 }}>Status</span>
        <StatusBadge>{detail.status}</StatusBadge>
      </div>
      <DetailRow label="Date">{detail.date}</DetailRow>
    </div>
  );
}

function RestrictionDetailBlock({ detail, title, org, date }) {
  const doc = buildDocument({
    title,
    type: "Treatment restriction",
    org,
    date,
    careProvider: detail.verifiedBy,
    summary: [
      ["Limits", detail.limits],
      ["Verified by", detail.verifiedBy],
      ["Verification date", detail.verificationDate],
    ],
  });
  return (
    <div className="px-4 py-3" style={{ backgroundColor: T.light }}>
      <DetailRow label="Limits">
        {detail.limits}
        <DocLink doc={doc} />
      </DetailRow>
      <DetailRow label="Verified By">{detail.verifiedBy}</DetailRow>
      <DetailRow label="Verification date">{detail.verificationDate}</DetailRow>
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

// The left-rail status indicator — three states only (loading spinner,
// success check, failed warning); the counts live in the Sources header.
// Shared by all three category rows since they're populated by the same
// underlying 5-source fetch: once it settles, it settles for
// Encounters/Diagnoses/Treatment simultaneously.
function CategoryIndicator({ allSettled, failedCount, isActive }) {
  const state = !allSettled ? "loading" : failedCount > 0 ? "failed" : "done";
  return (
    <span className="relative block w-[18px] h-[18px] shrink-0">
      <AnimatePresence initial={false}>
        <motion.span
          key={state}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.3 }}
          transition={iconSpring}
        >
          {state === "loading" ? (
            <span
              className="block w-[15px] h-[15px] border-2 rounded-full animate-spin"
              style={isActive
                ? { borderColor: "rgba(255,255,255,0.35)", borderTopColor: "#fff" }
                : { borderColor: T.gray400, borderTopColor: T.primary }}
            />
          ) : state === "failed" ? (
            <AlertTriangle size={15} style={{ color: T.warning }} />
          ) : (
            <Check size={15} strokeWidth={3} style={{ color: isActive ? "#fff" : T.success }} />
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Category title + the "Sources (N/5 loaded)" collapsible breakdown — shared
// across all three categories, since one 5-source fetch feeds all of them.
// `categoryEntries` (Diagnoses'/Treatment's own array) switches the
// per-source subtext from Encounters' pagination counts ("Latest N of M") to
// a plain per-category record count — showing "Latest 10 of 16" next to a
// 4-entry diagnosis list would just be the wrong numbers.
function SourcesHeader({ title, sourcesOpen, setSourcesOpen, sourceStatus, loadedCount, allSettled, failedCount, lastUpdated, onRefresh, onRetry, categoryEntries }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[22px] font-semibold leading-tight" style={{ color: T.bodyText }}>{title}</h2>
        <div className="flex items-center gap-3 text-sm" style={{ color: T.gray600 }}>
          <button onClick={() => setSourcesOpen((v) => !v)} className="flex items-center gap-1.5">
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
          <motion.button onClick={onRefresh} aria-label="Refresh" whileTap={{ scale: 0.85, rotate: 90 }}>
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
                const categoryTotal = categoryEntries ? countByOrg(categoryEntries, source.name) : null;
                const showSubline =
                  status.state === "empty" ||
                  status.state === "failed" ||
                  (status.state === "loaded" && (categoryEntries ? true : status.fetched < status.total));
                const sublineText =
                  status.state === "failed"
                    ? "Fetch failed"
                    : status.state === "empty" || (categoryEntries && categoryTotal === 0)
                      ? "No records found for this patient"
                      : categoryEntries
                        ? `${categoryTotal} record${categoryTotal === 1 ? "" : "s"} loaded`
                        : `Latest ${status.fetched} of ${status.total} records loaded`;
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
                          {showSubline && (
                            <motion.div
                              key="subline"
                              className="overflow-hidden"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              <div className="text-[13px]" style={{ color: status.state === "failed" ? "#dc2626" : T.gray500 }}>
                                {sublineText}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <FadeSwap id={status.state === "loading" ? `loading-${status.phase || "initial"}` : status.state} className="text-sm">
                      {status.state === "loading" && (
                        <span style={{ color: T.gray600 }}>{status.phase === "more" ? "fetching more…" : "fetching…"}</span>
                      )}
                      {(status.state === "loaded" || status.state === "empty") && <span style={{ color: T.gray600 }}>{formatClock(status.time)}</span>}
                      {status.state === "failed" && (
                        <motion.button onClick={() => onRetry(source.id)} aria-label="Retry" whileTap={{ scale: 0.85, rotate: 90 }}>
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
    </>
  );
}

// The Past/Planned status pills + Sort + Filters row — identical across
// Encounters/Diagnoses/Treatment (only one is ever mounted at a time, since
// the three categories are mutually exclusive), so sortOrder/sortMenuOpen and
// the filter drawer they open are safely shared state rather than duplicated
// per category.
function CategoryToolbar({ pastCount, filterCount, sortOrder, sortMenuOpen, setSortMenuOpen, sortMenuRef, changeSortOrder, onOpenFilters }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: T.primary }}>Past ({pastCount})</span>
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
        <button onClick={onOpenFilters} className="flex items-center gap-1.5">
          <Filter size={14} /> Filters
          <AnimatePresence>
            {filterCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={iconSpring}
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-white text-[11px] font-bold"
                style={{ backgroundColor: T.primary }}
              >
                {filterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
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
  // Linked record currently open: a full-screen document or a ZIB drawer.
  const [viewer, setViewer] = useState(null);
  const viewerApi = useRef({
    openDocument: (doc) => setViewer({ type: "document", doc }),
    openZib: (zib) => setViewer({ type: "zib", zib }),
  }).current;
  useEffect(() => {
    if (!viewer) return;
    const onKey = (e) => {
      if (e.key === "Escape") setViewer(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewer]);
  const [expandedIds, setExpandedIds] = useState({});
  const toggleExpand = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  // Which left-rail category's content shows in the right column. All three
  // read the same underlying 5-source fetch above.
  const [activeCategory, setActiveCategory] = useState("encounters");
  const [diagnosisTypeFilters, setDiagnosisTypeFilters] = useState(new Set());
  const [treatmentTypeFilters, setTreatmentTypeFilters] = useState(new Set());

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
  // Whether any source has failed at some point during this run — used to
  // auto-collapse the breakdown once a retry fixes the last failure.
  const everFailedRef = useRef(false);

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
      const outcome = opts.outcomeOverride || source.outcome;
      const state = outcome === "empty" ? "empty" : outcome === "failed" ? "failed" : "loaded";
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
    everFailedRef.current = false;
    setSourcesOpen(true);
    setExpandedIds({});
    setSourceStatus(Object.fromEntries(SOURCE_CONFIG.map((s) => [s.id, { state: "loading" }])));
    SOURCE_CONFIG.forEach(runSource);
  }, [runSource]);

  useEffect(() => {
    startSimulation();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [runId]);

  const retrySource = (id) => {
    const source = SOURCE_CONFIG.find((s) => s.id === id);
    // Sources with a retryOutcome (e.g. UMC Utrecht) succeed on a manual
    // retry even though their first fetch is scripted to fail.
    runSource(source, { delayMs: () => 10000, outcomeOverride: source.retryOutcome });
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

  // Remember that a failure happened at some point during this run.
  useEffect(() => {
    if (statuses.some((s) => s.state === "failed")) everFailedRef.current = true;
  }, [sourceStatus]);

  // Once a run that included a failure becomes fully successful (e.g. the
  // user retried the failed source), auto-collapse the breakdown into its
  // condensed summary line — a clean first-try run is left as-is.
  useEffect(() => {
    if (allSettled && failedCount === 0 && everFailedRef.current) {
      everFailedRef.current = false;
      timeoutsRef.current.push(setTimeout(() => setSourcesOpen(false), 1200));
    }
  }, [allSettled, failedCount]);

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

  const toggleDiagnosisType = (key) => {
    setDiagnosisTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const toggleTreatmentType = (key) => {
    setTreatmentTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const displayedDiagnoses = applySort(
    DIAGNOSIS_ENTRIES.filter((item) => diagnosisTypeFilters.size === 0 || diagnosisTypeFilters.has(simpleTypeKey(item)))
  );
  const displayedRestrictions = applySort(
    RESTRICTION_ENTRIES.filter((item) => treatmentTypeFilters.size === 0 || treatmentTypeFilters.has(simpleTypeKey(item)))
  );

  // Records known to exist on the server but not yet fetched (e.g. Maastricht
  // reported total 16 and delivered 10). This is what "Show more" loads —
  // it's hidden entirely once the picture is complete.
  const serverRemaining = SOURCE_CONFIG.reduce((sum, s) => {
    const st = sourceStatus[s.id];
    return st?.state === "loaded" ? sum + (st.total - st.fetched) : sum;
  }, 0);

  return (
    <ViewerContext.Provider value={viewerApi}>
    <div className="grid grid-cols-[300px_1fr] gap-10">
      <div className="flex flex-col self-start sticky top-6">
        <button
          onClick={() => setActiveCategory("encounters")}
          className="font-semibold text-sm tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5 rounded-t-sm text-left"
          style={{ backgroundColor: activeCategory === "encounters" ? T.primary : "#fff", color: activeCategory === "encounters" ? "#fff" : T.bodyText }}
        >
          <span className="flex items-center gap-2.5">
            <CalendarDays size={16} style={{ color: activeCategory === "encounters" ? "#fff" : T.primary }} /> ENCOUNTERS
          </span>
          <CategoryIndicator allSettled={allSettled} failedCount={failedCount} isActive={activeCategory === "encounters"} />
        </button>
        <button
          onClick={() => setActiveCategory("diagnoses")}
          className="border border-t-0 border-[#DEE2E6] text-sm font-semibold tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5 text-left"
          style={{ backgroundColor: activeCategory === "diagnoses" ? T.primary : "#fff", color: activeCategory === "diagnoses" ? "#fff" : T.bodyText }}
        >
          <span className="flex items-center gap-2.5">
            <Stethoscope size={16} style={{ color: activeCategory === "diagnoses" ? "#fff" : T.primary }} /> KLACHTEN EN DIAGNOSES
          </span>
          <CategoryIndicator allSettled={allSettled} failedCount={failedCount} isActive={activeCategory === "diagnoses"} />
        </button>
        <button
          onClick={() => setActiveCategory("treatment")}
          className="border border-t-0 border-[#DEE2E6] text-sm font-semibold tracking-wide px-4 py-3.5 flex items-center justify-between gap-2.5 text-left"
          style={{ backgroundColor: activeCategory === "treatment" ? T.primary : "#fff", color: activeCategory === "treatment" ? "#fff" : T.bodyText }}
        >
          <span className="flex items-center gap-2.5">
            <ClipboardList size={16} style={{ color: activeCategory === "treatment" ? "#fff" : T.primary }} /> TREATMENT RESTRICTIONS
          </span>
          <CategoryIndicator allSettled={allSettled} failedCount={failedCount} isActive={activeCategory === "treatment"} />
        </button>
      </div>

      <div>
        {activeCategory === "encounters" && (
          <>
            <SourcesHeader
              title="Encounters"
              sourcesOpen={sourcesOpen}
              setSourcesOpen={setSourcesOpen}
              sourceStatus={sourceStatus}
              loadedCount={loadedCount}
              allSettled={allSettled}
              failedCount={failedCount}
              lastUpdated={lastUpdated}
              onRefresh={() => setRunId((r) => r + 1)}
              onRetry={retrySource}
            />
            <CategoryToolbar
              pastCount={24}
              filterCount={activeFilterCount}
              sortOrder={sortOrder}
              sortMenuOpen={sortMenuOpen}
              setSortMenuOpen={setSortMenuOpen}
              sortMenuRef={sortMenuRef}
              changeSortOrder={changeSortOrder}
              onOpenFilters={() => setFiltersOpen(true)}
            />

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
          </>
        )}

        {activeCategory === "diagnoses" && (
          <>
            <SourcesHeader
              title="Klachten en diagnoses"
              sourcesOpen={sourcesOpen}
              setSourcesOpen={setSourcesOpen}
              sourceStatus={sourceStatus}
              loadedCount={loadedCount}
              allSettled={allSettled}
              failedCount={failedCount}
              lastUpdated={lastUpdated}
              onRefresh={() => setRunId((r) => r + 1)}
              onRetry={retrySource}
              categoryEntries={DIAGNOSIS_ENTRIES}
            />
            <CategoryToolbar
              pastCount={DIAGNOSIS_ENTRIES.length}
              filterCount={diagnosisTypeFilters.size}
              sortOrder={sortOrder}
              sortMenuOpen={sortMenuOpen}
              setSortMenuOpen={setSortMenuOpen}
              sortMenuRef={sortMenuRef}
              changeSortOrder={changeSortOrder}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            {displayedDiagnoses.length === 0 && (
              <div className="text-sm py-6 text-center border rounded-md" style={{ color: T.gray500, borderColor: T.border }}>
                No entries match the selected filters.{" "}
                <button onClick={() => setDiagnosisTypeFilters(new Set())} className="underline font-semibold" style={{ color: T.primary }}>
                  Clear filters
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {displayedDiagnoses.map((item) => {
                const isExpanded = !!expandedIds[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={cardSpring}
                    className="border rounded-md bg-white overflow-hidden"
                    style={{ borderColor: T.border }}
                  >
                    <button onClick={() => toggleExpand(item.id)} className="w-full text-left px-4 py-3 hover:bg-black/[0.02]">
                      <div className="flex items-center justify-between text-[13px] mb-1" style={{ color: T.gray600 }}>
                        <span>{item.date}</span>
                        <span>{item.source}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold" style={{ color: T.primary }}>{item.label}</span>
                        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="shrink-0">
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
                          <DiagnosisDetailBlock detail={item.detail} title={item.label.split("|")[1].trim()} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {activeCategory === "treatment" && (
          <>
            <SourcesHeader
              title="Treatment restrictions"
              sourcesOpen={sourcesOpen}
              setSourcesOpen={setSourcesOpen}
              sourceStatus={sourceStatus}
              loadedCount={loadedCount}
              allSettled={allSettled}
              failedCount={failedCount}
              lastUpdated={lastUpdated}
              onRefresh={() => setRunId((r) => r + 1)}
              onRetry={retrySource}
              categoryEntries={RESTRICTION_ENTRIES}
            />
            <CategoryToolbar
              pastCount={RESTRICTION_ENTRIES.length}
              filterCount={treatmentTypeFilters.size}
              sortOrder={sortOrder}
              sortMenuOpen={sortMenuOpen}
              setSortMenuOpen={setSortMenuOpen}
              sortMenuRef={sortMenuRef}
              changeSortOrder={changeSortOrder}
              onOpenFilters={() => setFiltersOpen(true)}
            />
            {displayedRestrictions.length === 0 && (
              <div className="text-sm py-6 text-center border rounded-md" style={{ color: T.gray500, borderColor: T.border }}>
                No entries match the selected filters.{" "}
                <button onClick={() => setTreatmentTypeFilters(new Set())} className="underline font-semibold" style={{ color: T.primary }}>
                  Clear filters
                </button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {displayedRestrictions.map((item) => {
                const isExpanded = !!expandedIds[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={cardSpring}
                    className="border rounded-md bg-white overflow-hidden"
                    style={{ borderColor: T.border }}
                  >
                    <button onClick={() => toggleExpand(item.id)} className="w-full text-left px-4 py-3 hover:bg-black/[0.02]">
                      <div className="flex items-center justify-between text-[13px] mb-1" style={{ color: T.gray600 }}>
                        <span>{item.date}</span>
                        <span>{item.source}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold" style={{ color: T.danger }}>{item.label}</span>
                        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="shrink-0">
                          <ChevronDown size={16} style={{ color: T.danger }} />
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
                          <RestrictionDetailBlock detail={item.detail} title={item.label.split("|")[1].trim()} org={item.source} date={item.date} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
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

              {activeCategory === "encounters" && (
                <>
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
                      {FILTER_TYPES.map((ft) => (
                        <FilterCheckbox key={ft.key} label={ft.label} checked={typeFilters.has(ft.key)} onChange={() => toggleType(ft.key)} />
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
                </>
              )}

              {activeCategory === "diagnoses" && (
                <>
                  <div className="flex-1 overflow-y-auto">
                    <FilterAccordion title="Type" open onToggle={() => {}}>
                      {DIAGNOSIS_FILTER_TYPES.map((ft) => (
                        <FilterCheckbox key={ft.key} label={ft.label} checked={diagnosisTypeFilters.has(ft.key)} onChange={() => toggleDiagnosisType(ft.key)} />
                      ))}
                    </FilterAccordion>
                  </div>

                  {diagnosisTypeFilters.size > 0 && (
                    <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: T.border }}>
                      <button onClick={() => setDiagnosisTypeFilters(new Set())} className="text-[14px] font-semibold" style={{ color: T.primary }}>
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeCategory === "treatment" && (
                <>
                  <div className="flex-1 overflow-y-auto">
                    <FilterAccordion title="Type" open onToggle={() => {}}>
                      {TREATMENT_FILTER_TYPES.map((ft) => (
                        <FilterCheckbox key={ft.key} label={ft.label} checked={treatmentTypeFilters.has(ft.key)} onChange={() => toggleTreatmentType(ft.key)} />
                      ))}
                    </FilterAccordion>
                  </div>

                  {treatmentTypeFilters.size > 0 && (
                    <div className="px-5 py-3 border-t shrink-0" style={{ borderColor: T.border }}>
                      <button onClick={() => setTreatmentTypeFilters(new Set())} className="text-[14px] font-semibold" style={{ color: T.primary }}>
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}

    {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {viewer?.type === "zib" && <ZibDrawer key="zib" zib={viewer.zib} onClose={() => setViewer(null)} />}
        {viewer?.type === "document" && <DocumentViewer key="doc" doc={viewer.doc} onClose={() => setViewer(null)} />}
      </AnimatePresence>,
      document.body
    )}
    </ViewerContext.Provider>
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
