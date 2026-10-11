
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

const DEMO = {
  filename: "No dataset selected",
  rows: 0,
  column_count: 0,
  total_cells: 0,
  missing_cells: 0,
  completeness_percent: 0,
  duplicate_rows: 0,
  columns: [],
  preview: [],
  insights: [],
  analysis: {
    provider: "local",
    model: "none",
    summary: "Choose a dataset to begin your analysis.",
    key_findings: [],
    recommendations: [],
    data_quality_warnings: [],
    suggested_questions: [],
  },
};

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAnalysis(raw) {
  if (!raw || typeof raw !== "object") return DEMO;

  // The backend returns profile fields at the root and AI output in analysis.
  // These fallbacks also tolerate older API response formats.
  const outer = raw.result || raw.data || raw;
  const profile =
    outer.profile ||
    outer.dataset_profile ||
    outer.data_profile ||
    outer.statistics ||
    outer;

  const ai =
    outer.analysis ||
    outer.ai_analysis ||
    outer.aiAnalysis ||
    outer.ai_insights ||
    outer.insights_result ||
    raw.analysis ||
    {};

  const columns = safeArray(
    profile.columns || outer.columns || raw.columns
  ).map((column, index) => ({
    name: String(column?.name || `Column ${index + 1}`),
    type: String(column?.type || "categorical"),
    non_empty: number(column?.non_empty),
    missing: number(column?.missing),
    missing_percent: number(column?.missing_percent),
    unique: number(column?.unique),
    statistics:
      column?.statistics && typeof column.statistics === "object"
        ? column.statistics
        : {},
    distribution: safeArray(column?.distribution),
    top_values: safeArray(column?.top_values),
  }));

  const rows = number(
    profile.rows ?? profile.total_rows ?? outer.rows ?? outer.total_rows
  );

  const columnCount = number(
    profile.column_count ??
      profile.total_columns ??
      outer.column_count ??
      outer.total_columns ??
      columns.length
  );

  const totalCells = number(
    profile.total_cells ?? rows * columnCount
  );

  const missingCells = number(profile.missing_cells);
  const completeness = number(
    profile.completeness_percent ??
      (totalCells
        ? ((totalCells - missingCells) / totalCells) * 100
        : 100)
  );

  const oldInsights = safeArray(profile.insights || outer.insights);

  return {
    ...DEMO,
    filename:
      outer.filename ||
      outer.dataset?.filename ||
      profile.filename ||
      "Dataset",
    rows,
    column_count: columnCount,
    total_cells: totalCells,
    missing_cells: missingCells,
    completeness_percent: Math.min(100, Math.max(0, completeness)),
    duplicate_rows: number(
      profile.duplicate_rows ?? profile.duplicates ?? outer.duplicate_rows
    ),
    columns,
    preview: safeArray(profile.preview || outer.preview),
    insights: oldInsights,
    dataset: outer.dataset || raw.dataset || null,
    analysis: {
      provider: ai.provider || "local",
      model: ai.model || "",
      summary:
        ai.summary ||
        oldInsights[0] ||
        "Analysis completed. Review the dataset metrics and column statistics below.",
      key_findings: safeArray(
        ai.key_findings || ai.findings || ai.highlights
      ),
      recommendations: safeArray(
        ai.recommendations || ai.actions
      ),
      data_quality_warnings: safeArray(
        ai.data_quality_warnings || ai.warnings
      ),
      suggested_questions: safeArray(
        ai.suggested_questions || ai.questions
      ),
    },
  };
}

function formatNumber(value) {
  return number(value).toLocaleString();
}

function formatPercent(value) {
  return `${number(value).toFixed(1)}%`;
}

function Icon({ name, size = 20 }) {
  const paths = {
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.6 9a7 7 0 0 1 11.8-2L20 12" />
        <path d="M18.4 15a7 7 0 0 1-11.8 2L4 12" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 17v4h14v-4" />
      </>
    ),
    message: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.sparkles}
    </svg>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`dp-panel ${className}`}>
      <div className="dp-panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon, label, value, detail, tone = "blue" }) {
  return (
    <article className="dp-metric">
      <div className={`dp-metric-icon ${tone}`}>
        <Icon name={icon} size={21} />
      </div>
      <div className="dp-metric-label">{label}</div>
      <div className="dp-metric-value">{value}</div>
      <div className="dp-metric-detail">{detail}</div>
    </article>
  );
}

function QualityRing({ value }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="dp-ring-wrap">
      <svg viewBox="0 0 108 108" className="dp-ring">
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth="9"
        />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke={value >= 90 ? "#16a34a" : value >= 70 ? "#d97706" : "#e05252"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 54 54)"
        />
        <text
          x="54"
          y="51"
          textAnchor="middle"
          className="dp-ring-number"
        >
          {Math.round(value)}%
        </text>
        <text
          x="54"
          y="66"
          textAnchor="middle"
          className="dp-ring-caption"
        >
          complete
        </text>
      </svg>
    </div>
  );
}

function DistributionChart({ column }) {
  const values = safeArray(column?.distribution);
  const isNumeric = column?.type === "numeric";
  const source = values.length
    ? values.map((item, index) => ({
        label: String(
          item.label ?? item.value ?? item.range ?? `Item ${index + 1}`
        ),
        count: number(item.count),
      }))
    : safeArray(column?.top_values).map((item) => ({
        label: String(item.value ?? "Unknown"),
        count: number(item.count),
      }));

  const data = source.slice(0, 7);
  const max = Math.max(1, ...data.map((item) => item.count));

  if (!data.length) {
    return <div className="dp-empty-chart">No distribution data available.</div>;
  }

  return (
    <div className="dp-chart">
      {data.map((item, index) => (
        <div className="dp-bar-row" key={`${item.label}-${index}`}>
          <div className="dp-bar-label" title={item.label}>
            {item.label}
          </div>
          <div className="dp-bar-track">
            <div
              className={`dp-bar-fill ${isNumeric ? "numeric" : ""}`}
              style={{
                width: `${Math.max(2, (item.count / max) * 100)}%`,
              }}
            />
          </div>
          <div className="dp-bar-count">{formatNumber(item.count)}</div>
        </div>
      ))}
    </div>
  );
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escapeCell = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const content = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCell(row[header])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { fileId } = useParams();

  const [user, setUser] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedId, setSelectedId] = useState(fileId || "");
  const [result, setResult] = useState(DEMO);
  const [loading, setLoading] = useState(false);
  const [datasetLoading, setDatasetLoading] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const token = user?.access_token || "";

  useEffect(() => {
    let alive = true;

    async function initialize() {
      setDatasetLoading(true);
      try {
        const { data, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        if (!alive) return;

        const session = data?.session;
        setUser(session || null);

        if (!session) {
          setDatasets([]);
          setError("Sign in to access your saved datasets.");
          return;
        }

        const { data: records, error: recordsError } = await supabase
          .from("datasets")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (recordsError) throw recordsError;
        if (!alive) return;

        const list = safeArray(records);
        setDatasets(list);

        const requestedId = fileId || selectedId;
        const chosen =
          list.find((item) => String(item.id) === String(requestedId)) ||
          list[0];

        if (chosen) {
          setSelectedId(String(chosen.id));
        } else {
          setSelectedId("");
          setResult(DEMO);
        }
      } catch (err) {
        if (alive) {
          setError(err?.message || "Could not load your datasets.");
        }
      } finally {
        if (alive) setDatasetLoading(false);
      }
    }

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session || null);
      if (!session) {
        setDatasets([]);
        setSelectedId("");
        setResult(DEMO);
        setError("Sign in to access your saved datasets.");
      }
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
    // selectedId is deliberately not a dependency; changing the selector
    // should not reload the entire datasets list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  const selectedDataset = useMemo(
    () => datasets.find((item) => String(item.id) === String(selectedId)),
    [datasets, selectedId]
  );

  const analyze = useCallback(
    async (id = selectedId) => {
      if (!id) {
        setError("Upload a CSV file or choose a dataset first.");
        return;
      }

      if (!token) {
        setError("Your session is missing. Sign in again to analyze this dataset.");
        return;
      }

      setLoading(true);
      setError("");
      setAnswer("");

      try {
        const response = await fetch(`${API_URL}/api/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ file_id: id }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload.detail ||
              payload.message ||
              `Analysis failed (${response.status}).`
          );
        }

        const normalized = normalizeAnalysis(payload);
        setResult(normalized);
      } catch (err) {
        setError(
          err?.message ||
            "Could not analyze the dataset. Check that the API is running."
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedId, token]
  );

  useEffect(() => {
    if (!datasetLoading && token && selectedId) {
      analyze(selectedId);
    }
    // Analyze only when the selected route/dataset has been resolved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetLoading, token, selectedId]);

  function selectDataset(value) {
    setSelectedId(value);
    setResult(DEMO);
    setAnswer("");
    setError("");

    if (value) {
      const basePath = fileId ? "/dashboard" : "/dashboard";
      window.history.replaceState(null, "", `${basePath}/${value}`);
    }
  }

  async function askQuestion(event) {
    event.preventDefault();

    const text = question.trim();
    if (!text || asking) return;

    if (!selectedId || !token) {
      setError("Choose a dataset and sign in before asking a question.");
      return;
    }

    setAsking(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_id: selectedId,
          question: text,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || "Could not get an answer.");
      }

      setAnswer(payload.answer || "No answer was returned.");
    } catch (err) {
      setError(err?.message || "Question request failed.");
    } finally {
      setAsking(false);
    }
  }

  const columns = result.columns;
  const numericColumns = columns.filter((column) => column.type === "numeric");
  const categoricalColumns = columns.filter(
    (column) => column.type !== "numeric"
  );

  const warnings = result.analysis.data_quality_warnings;
  const findings = result.analysis.key_findings.length
    ? result.analysis.key_findings
    : result.insights;
  const recommendations = result.analysis.recommendations;
  const questions = result.analysis.suggested_questions;

  const healthLabel =
    result.completeness_percent >= 90
      ? "Healthy"
      : result.completeness_percent >= 70
        ? "Needs attention"
        : "At risk";

  return (
    <div className="dp-app">
      <style>{`
        .dp-app {
          --bg: #f6f8fc;
          --surface: #ffffff;
          --text: #17233b;
          --muted: #77839a;
          --line: #e8edf5;
          --blue: #5267ee;
          --blue-light: #eef1ff;
          --green: #16a34a;
          --shadow: 0 8px 30px rgba(30, 48, 90, .045);
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 14px;
        }
        .dp-app * { box-sizing: border-box; }
        .dp-layout { display: flex; min-height: 100vh; }
        .dp-sidebar {
          width: 238px; flex-shrink: 0; padding: 28px 17px;
          background: #101a32; color: #d6def1; display: flex; flex-direction: column;
        }
        .dp-brand { display: flex; align-items: center; gap: 11px; padding: 0 11px 36px; }
        .dp-brand-mark {
          width: 39px; height: 39px; display: grid; place-items: center;
          color: white; border-radius: 13px; background: linear-gradient(135deg, #7184ff, #4d55d8);
          box-shadow: 0 6px 18px #5267ee55;
        }
        .dp-brand-name { color: white; font-size: 17px; font-weight: 800; letter-spacing: -.6px; }
        .dp-brand-sub { font-size: 10px; margin-top: 3px; color: #8998b7; letter-spacing: 1.5px; text-transform: uppercase; }
        .dp-nav-label { padding: 0 12px 11px; color: #7f8eac; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; }
        .dp-nav { display: grid; gap: 7px; }
        .dp-nav a {
          color: #aebad2; text-decoration: none; padding: 12px 13px; border-radius: 10px;
          display: flex; align-items: center; gap: 11px; font-weight: 550; transition: .18s;
        }
        .dp-nav a:hover, .dp-nav a.active { color: white; background: #263453; }
        .dp-nav a.active { box-shadow: inset 3px 0 #7b8cff; }
        .dp-side-bottom { margin-top: auto; }
        .dp-side-tip { border: 1px solid #35415c; background: #1a2742; border-radius: 15px; padding: 15px; }
        .dp-side-tip h3 { margin: 10px 0 6px; font-size: 13px; color: white; }
        .dp-side-tip p { margin: 0; color: #a5b2cc; font-size: 12px; line-height: 1.6; }
        .dp-side-tip a { display: inline-block; margin-top: 13px; color: #aebaff; text-decoration: none; font-weight: 700; }
        .dp-main { min-width: 0; flex: 1; }
        .dp-topbar {
          min-height: 76px; background: rgba(255,255,255,.92); border-bottom: 1px solid var(--line);
          display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 16px 32px;
        }
        .dp-breadcrumb { color: var(--muted); font-size: 12px; }
        .dp-breadcrumb strong { color: var(--text); font-weight: 700; }
        .dp-top-actions { display: flex; align-items: center; gap: 10px; }
        .dp-user-dot { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #e8ecff; color: #4859cf; font-weight: 800; }
        .dp-user-email { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #5f6b81; font-size: 12px; }
        .dp-content { max-width: 1600px; margin: 0 auto; padding: 31px 32px 48px; }
        .dp-page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 25px; }
        .dp-eyebrow { display: flex; align-items: center; gap: 7px; color: #5267ee; text-transform: uppercase; letter-spacing: 1.5px; font-size: 10px; font-weight: 850; }
        .dp-page-head h1 { font-size: clamp(25px, 3vw, 33px); letter-spacing: -1.2px; margin: 9px 0 8px; line-height: 1.2; }
        .dp-page-head p { margin: 0; color: var(--muted); line-height: 1.6; max-width: 650px; }
        .dp-actions { display: flex; gap: 9px; align-items: center; flex-wrap: wrap; }
        .dp-button {
          min-height: 40px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 0 14px; border-radius: 10px; border: 1px solid var(--line); background: white;
          color: #34425b; text-decoration: none; font-size: 12px; font-weight: 750; cursor: pointer;
          transition: transform .15s, box-shadow .15s, background .15s;
        }
        .dp-button:hover { transform: translateY(-1px); box-shadow: 0 5px 15px #1c31520d; }
        .dp-button:disabled { opacity: .55; cursor: not-allowed; transform: none; }
        .dp-button.primary { background: var(--blue); border-color: var(--blue); color: white; box-shadow: 0 5px 13px #5267ee26; }
        .dp-select { max-width: 330px; min-width: 220px; height: 40px; border: 1px solid var(--line); border-radius: 10px; background: white; padding: 0 12px; color: var(--text); outline: none; }
        .dp-select:focus, .dp-input:focus { border-color: #8b98ff; box-shadow: 0 0 0 3px #5267ee16; }
        .dp-status-line { display: flex; align-items: center; gap: 9px; margin: 0 0 22px; padding: 11px 14px; background: #fff; border: 1px solid var(--line); border-radius: 11px; color: #6a7890; font-size: 12px; }
        .dp-status-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; flex-shrink: 0; }
        .dp-status-line strong { color: var(--text); }
        .dp-status-right { margin-left: auto; color: #8a96aa; white-space: nowrap; }
        .dp-error { margin-bottom: 18px; border: 1px solid #fecaca; background: #fff4f4; color: #a22b35; padding: 13px 15px; border-radius: 11px; line-height: 1.5; }
        .dp-loading { border: 1px solid var(--line); background: white; padding: 32px; border-radius: 16px; color: var(--muted); text-align: center; margin-bottom: 20px; }
        .dp-spinner { width: 21px; height: 21px; border: 2px solid #dce2ff; border-top-color: var(--blue); border-radius: 50%; animation: dp-spin .8s linear infinite; margin: 0 auto 11px; }
        @keyframes dp-spin { to { transform: rotate(360deg); } }
        .dp-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
        .dp-metric { min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: 15px; padding: 19px 20px; box-shadow: var(--shadow); }
        .dp-metric-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 16px; }
        .dp-metric-icon.blue { background: #eef1ff; color: #5267ee; }
        .dp-metric-icon.green { background: #e8f9ef; color: #159447; }
        .dp-metric-icon.orange { background: #fff3e6; color: #d97706; }
        .dp-metric-icon.purple { background: #f3edff; color: #8651d9; }
        .dp-metric-label { color: #77839a; font-size: 12px; font-weight: 600; }
        .dp-metric-value { font-size: clamp(24px, 2.4vw, 31px); font-weight: 800; letter-spacing: -1.1px; margin-top: 6px; line-height: 1.2; overflow-wrap: anywhere; }
        .dp-metric-detail { color: #8c98ab; font-size: 11px; margin-top: 8px; line-height: 1.4; }
        .dp-main-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(290px, .85fr); gap: 18px; align-items: stretch; margin-bottom: 20px; }
        .dp-panel { min-width: 0; border: 1px solid var(--line); border-radius: 15px; background: white; box-shadow: var(--shadow); padding: 22px; margin-bottom: 20px; }
        .dp-main-grid .dp-panel { margin-bottom: 0; }
        .dp-panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 20px; }
        .dp-panel-heading h2 { margin: 0; font-size: 15px; letter-spacing: -.25px; font-weight: 800; }
        .dp-panel-heading p { color: var(--muted); font-size: 11px; margin: 6px 0 0; line-height: 1.5; }
        .dp-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 6px 9px; background: #eaf8ef; color: #16834a; font-size: 10px; font-weight: 800; white-space: nowrap; }
        .dp-quality-layout { display: grid; grid-template-columns: 145px minmax(0,1fr); gap: 18px; align-items: center; }
        .dp-ring-wrap { display: flex; justify-content: center; }
        .dp-ring { width: 138px; height: 138px; overflow: visible; }
        .dp-ring-number { font-size: 21px; font-weight: 850; fill: var(--text); }
        .dp-ring-caption { font-size: 9px; fill: #8792a7; }
        .dp-quality-details { display: grid; gap: 15px; }
        .dp-quality-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; }
        .dp-quality-row span { color: var(--muted); }
        .dp-quality-row strong { font-weight: 800; text-align: right; }
        .dp-quality-track { height: 5px; background: #edf0f6; border-radius: 8px; overflow: hidden; margin-top: 7px; }
        .dp-quality-fill { height: 100%; border-radius: 8px; background: #16a34a; }
        .dp-ai-panel { color: white; border: none; overflow: hidden; background: linear-gradient(145deg, #202c58, #3944a1 68%, #5869ef); position: relative; }
        .dp-ai-panel:after { content: ""; width: 180px; height: 180px; border-radius: 50%; border: 1px solid #ffffff16; position: absolute; right: -70px; top: -70px; box-shadow: 0 0 0 24px #ffffff08, 0 0 0 48px #ffffff05; pointer-events: none; }
        .dp-ai-panel .dp-panel-heading { position: relative; z-index: 1; }
        .dp-ai-panel .dp-panel-heading h2 { color: white; }
        .dp-ai-panel .dp-panel-heading p { color: #c2caf7; }
        .dp-ai-label { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #ffffff30; background: #ffffff12; padding: 6px 9px; border-radius: 999px; color: #e2e7ff; font-size: 10px; font-weight: 750; }
        .dp-ai-summary { font-size: 15px; line-height: 1.85; color: #f3f5ff; margin: 0 0 18px; position: relative; z-index: 1; }
        .dp-ai-footer { border-top: 1px solid #ffffff25; padding-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; color: #cbd2ff; font-size: 11px; }
        .dp-ai-footer span { display: inline-flex; gap: 6px; align-items: center; }
        .dp-columns-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
        .dp-column-card { border: 1px solid var(--line); border-radius: 13px; padding: 17px; min-width: 0; transition: border-color .15s, transform .15s; }
        .dp-column-card:hover { border-color: #cbd3ff; transform: translateY(-1px); }
        .dp-column-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .dp-column-name { font-weight: 800; font-size: 13px; overflow-wrap: anywhere; }
        .dp-column-type { color: #7583a0; background: #f2f4fa; padding: 5px 7px; border-radius: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
        .dp-column-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; margin-bottom: 17px; }
        .dp-column-stat { min-width: 0; background: #f7f9fc; border-radius: 8px; padding: 9px 7px; }
        .dp-column-stat span { display: block; font-size: 10px; color: #8a96a9; margin-bottom: 5px; }
        .dp-column-stat strong { display: block; font-size: 12px; overflow-wrap: anywhere; }
        .dp-chart-title { font-size: 10px; color: #7b879d; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .8px; }
        .dp-chart { display: grid; gap: 10px; }
        .dp-bar-row { display: grid; grid-template-columns: minmax(65px, .9fr) minmax(45px, 1.5fr) 32px; gap: 8px; align-items: center; }
        .dp-bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: #6d7890; }
        .dp-bar-track { background: #f0f2fa; height: 8px; border-radius: 5px; overflow: hidden; }
        .dp-bar-fill { height: 100%; background: linear-gradient(90deg, #8190ff, #5267ee); border-radius: 5px; transition: width .45s ease; }
        .dp-bar-fill.numeric { background: linear-gradient(90deg, #52cba1, #159a72); }
        .dp-bar-count { text-align: right; color: #6d7890; font-size: 10px; font-variant-numeric: tabular-nums; }
        .dp-empty-chart { padding: 20px 0; color: #9aa4b5; font-size: 11px; }
        .dp-insights-list { display: grid; gap: 12px; }
        .dp-insight { display: flex; align-items: flex-start; gap: 11px; padding: 13px; border: 1px solid var(--line); border-radius: 11px; }
        .dp-insight-icon { flex-shrink: 0; width: 29px; height: 29px; border-radius: 9px; display: grid; place-items: center; background: #edf1ff; color: #5267ee; }
        .dp-insight p { margin: 2px 0 0; line-height: 1.6; font-size: 12px; color: #4b5871; overflow-wrap: anywhere; }
        .dp-insight.warning .dp-insight-icon { color: #d97706; background: #fff3df; }
        .dp-insight.success .dp-insight-icon { color: #16944a; background: #e8f9ef; }
        .dp-empty { padding: 20px; text-align: center; color: #8995a8; font-size: 12px; border: 1px dashed var(--line); border-radius: 10px; }
        .dp-table-wrap { width: 100%; overflow: auto; border: 1px solid var(--line); border-radius: 11px; }
        .dp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; white-space: nowrap; }
        .dp-table th { padding: 12px 14px; background: #f7f9fc; color: #718098; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; font-weight: 800; border-bottom: 1px solid var(--line); }
        .dp-table td { padding: 12px 14px; border-bottom: 1px solid #eff2f7; color: #4b5871; max-width: 240px; overflow: hidden; text-overflow: ellipsis; }
        .dp-table tbody tr:last-child td { border-bottom: none; }
        .dp-table tbody tr:hover { background: #fafbff; }
        .dp-table td:first-child { color: var(--text); font-weight: 700; }
        .dp-qa { background: linear-gradient(120deg, #f7f8ff, white); }
        .dp-qa-form { display: flex; gap: 9px; }
        .dp-input { flex: 1; min-width: 0; height: 43px; border: 1px solid var(--line); border-radius: 10px; padding: 0 13px; outline: none; color: var(--text); background: white; font: inherit; font-size: 12px; }
        .dp-answer { margin-top: 15px; padding: 15px; border: 1px solid #dfe4ff; background: #f5f6ff; border-radius: 11px; color: #35426a; white-space: pre-wrap; line-height: 1.8; font-size: 12px; overflow-wrap: anywhere; }
        .dp-question-chips { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 13px; }
        .dp-chip { padding: 7px 10px; background: white; border: 1px solid var(--line); border-radius: 999px; color: #697691; font-size: 10px; cursor: pointer; text-align: left; }
        .dp-chip:hover { border-color: #aab4ff; color: #485bd9; }
        .dp-footer { text-align: center; color: #99a3b4; font-size: 10px; padding: 14px 0 0; }
        @media (max-width: 1150px) {
          .dp-sidebar { width: 205px; }
          .dp-content { padding: 25px 22px 40px; }
          .dp-metrics { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .dp-main-grid { grid-template-columns: minmax(0,1fr); }
        }
        @media (max-width: 760px) {
          .dp-sidebar { display: none; }
          .dp-topbar { padding: 14px 17px; }
          .dp-content { padding: 22px 15px 35px; }
          .dp-page-head { flex-direction: column; }
          .dp-actions { width: 100%; }
          .dp-select { flex: 1; min-width: 0; max-width: 100%; }
          .dp-metrics { gap: 10px; }
          .dp-metric { padding: 15px; }
          .dp-metric-value { font-size: 25px; }
          .dp-columns-grid { grid-template-columns: minmax(0,1fr); }
          .dp-panel { padding: 17px; }
          .dp-quality-layout { grid-template-columns: 110px minmax(0,1fr); gap: 8px; }
          .dp-ring { width: 110px; height: 110px; }
          .dp-qa-form { flex-direction: column; }
          .dp-qa-form .dp-button { width: 100%; }
          .dp-user-email { display: none; }
          .dp-status-right { display: none; }
        }
        @media (max-width: 380px) {
          .dp-metrics { grid-template-columns: minmax(0,1fr); }
          .dp-quality-layout { grid-template-columns: minmax(0,1fr); }
        }
        @media (prefers-reduced-motion: reduce) {
          .dp-app *, .dp-app *::before, .dp-app *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <div className="dp-layout">
        <aside className="dp-sidebar">
          <div className="dp-brand">
            <div className="dp-brand-mark">
              <Icon name="sparkles" size={23} />
            </div>
            <div>
              <div className="dp-brand-name">DataPilot AI</div>
              <div className="dp-brand-sub">Intelligence workspace</div>
            </div>
          </div>

          <div className="dp-nav-label">WORKSPACE</div>
          <nav className="dp-nav" aria-label="Main navigation">
            <Link to="/dashboard" className="active">
              <Icon name="grid" size={18} /> Dashboard
            </Link>
            <Link to="/upload">
              <Icon name="database" size={18} /> Upload dataset
            </Link>
            <Link to="/explore">
              <Icon name="sparkles" size={18} /> Explore data
            </Link>
          </nav>

          <div className="dp-side-bottom">
            <div className="dp-side-tip">
              <Icon name="sparkles" size={20} />
              <h3>Your data, made clear.</h3>
              <p>Turn raw CSV files into understandable insights and practical next steps.</p>
              <Link to="/upload">
                Analyze a dataset <Icon name="arrow" size={13} />
              </Link>
            </div>
          </div>
        </aside>

        <main className="dp-main">
          <header className="dp-topbar">
            <div className="dp-breadcrumb">
              Workspace <span aria-hidden="true"> / </span>{" "}
              <strong>Dashboard</strong>
            </div>
            <div className="dp-top-actions">
              <span className="dp-user-email">
                {user?.user?.email || ""}
              </span>
              <div className="dp-user-dot" title={user?.user?.email || "User"}>
                {(user?.user?.email || "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="dp-content">
            <div className="dp-page-head">
              <div>
                <div className="dp-eyebrow">
                  <Icon name="sparkles" size={14} /> DATA INTELLIGENCE
                </div>
                <h1>Analysis overview</h1>
                <p>
                  Understand your dataset's health, uncover patterns, and turn
                  findings into your next decision.
                </p>
              </div>
              <div className="dp-actions">
                <select
                  className="dp-select"
                  aria-label="Choose a dataset"
                  value={selectedId}
                  onChange={(event) => selectDataset(event.target.value)}
                  disabled={datasetLoading || datasets.length === 0}
                >
                  <option value="">
                    {datasetLoading ? "Loading datasets..." : "Choose dataset"}
                  </option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={String(dataset.id)}>
                      {dataset.filename ||
                        dataset.file_name ||
                        dataset.name ||
                        String(dataset.id)}
                    </option>
                  ))}
                </select>
                <button
                  className="dp-button primary"
                  onClick={() => analyze()}
                  disabled={loading || !selectedId || !token}
                >
                  <Icon name="refresh" size={15} />
                  {loading ? "Analyzing..." : "Analyze dataset"}
                </button>
              </div>
            </div>

            <div className="dp-status-line">
              <span className="dp-status-dot" />
              <span>
                <strong>
                  {selectedDataset?.filename ||
                    selectedDataset?.file_name ||
                    selectedDataset?.name ||
                    result.filename}
                </strong>
              </span>
              <span>·</span>
              <span>
                {loading
                  ? "Analysis in progress"
                  : result.rows
                    ? "Analysis results available"
                    : "Ready to analyze"}
              </span>
              <span className="dp-status-right">
                {result.analysis.provider === "openrouter"
                  ? "AI-enhanced analysis"
                  : "Local analysis fallback available"}
              </span>
            </div>

            {error && (
              <div className="dp-error" role="alert">
                <strong>Something needs attention.</strong> {error}
              </div>
            )}

            {loading && (
              <div className="dp-loading" role="status" aria-live="polite">
                <div className="dp-spinner" />
                <strong>Analyzing your dataset</strong>
                <div style={{ marginTop: 7 }}>
                  Profiling columns and preparing insights...
                </div>
              </div>
            )}

            <div className="dp-metrics">
              <MetricCard
                icon="database"
                label="Total records"
                value={formatNumber(result.rows)}
                detail="Rows analyzed"
                tone="blue"
              />
              <MetricCard
                icon="grid"
                label="Total columns"
                value={formatNumber(result.column_count)}
                detail={`${numericColumns.length} numeric · ${categoricalColumns.length} categorical`}
                tone="purple"
              />
              <MetricCard
                icon="alert"
                label="Missing cells"
                value={formatNumber(result.missing_cells)}
                detail={`${formatNumber(result.total_cells)} total cells`}
                tone="orange"
              />
              <MetricCard
                icon="check"
                label="Data completeness"
                value={formatPercent(result.completeness_percent)}
                detail={`${formatNumber(result.duplicate_rows)} duplicate rows detected`}
                tone="green"
              />
            </div>

            <div className="dp-main-grid">
              <Panel
                title="Data quality"
                subtitle="A quick overview of the reliability of your dataset."
                action={
                  <span className="dp-pill">
                    <span>●</span> {healthLabel}
                  </span>
                }
              >
                <div className="dp-quality-layout">
                  <QualityRing value={result.completeness_percent} />
                  <div className="dp-quality-details">
                    <div>
                      <div className="dp-quality-row">
                        <span>Completeness</span>
                        <strong>{formatPercent(result.completeness_percent)}</strong>
                      </div>
                      <div className="dp-quality-track">
                        <div
                          className="dp-quality-fill"
                          style={{ width: `${result.completeness_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="dp-quality-row">
                      <span>Missing values</span>
                      <strong>{formatNumber(result.missing_cells)}</strong>
                    </div>
                    <div className="dp-quality-row">
                      <span>Duplicate records</span>
                      <strong>{formatNumber(result.duplicate_rows)}</strong>
                    </div>
                    <div className="dp-quality-row">
                      <span>Columns profiled</span>
                      <strong>{formatNumber(columns.length)}</strong>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="AI executive summary"
                subtitle="The main takeaway from your dataset."
                className="dp-ai-panel"
                action={
                  <span className="dp-ai-label">
                    <Icon name="sparkles" size={13} /> AI INSIGHTS
                  </span>
                }
              >
                <p className="dp-ai-summary">{result.analysis.summary}</p>
                <div className="dp-ai-footer">
                  <span>
                    <Icon name="check" size={14} /> Profile generated
                  </span>
                  <span>·</span>
                  <span>
                    {result.analysis.provider === "openrouter"
                      ? "AI enhanced"
                      : "Fallback mode"}
                  </span>
                </div>
              </Panel>
            </div>

            <Panel
              title="Column explorer"
              subtitle="Inspect column types, completeness, summary statistics, and value distributions."
              action={<span className="dp-column-type">{columns.length} COLUMNS</span>}
            >
              {columns.length === 0 ? (
                <div className="dp-empty">
                  {loading
                    ? "Column details will appear when analysis finishes."
                    : "Select a dataset and run analysis to see column-level statistics."}
                </div>
              ) : (
                <div className="dp-columns-grid">
                  {columns.map((column) => (
                    <article className="dp-column-card" key={column.name}>
                      <div className="dp-column-top">
                        <div className="dp-column-name" title={column.name}>
                          {column.name}
                        </div>
                        <span className="dp-column-type">{column.type}</span>
                      </div>

                      <div className="dp-column-stats">
                        <div className="dp-column-stat">
                          <span>Unique</span>
                          <strong>{formatNumber(column.unique)}</strong>
                        </div>
                        <div className="dp-column-stat">
                          <span>Missing</span>
                          <strong>{formatNumber(column.missing)}</strong>
                        </div>
                        <div className="dp-column-stat">
                          <span>Missing %</span>
                          <strong>{formatPercent(column.missing_percent)}</strong>
                        </div>
                      </div>

                      {column.type === "numeric" && (
                        <div className="dp-column-stats">
                          <div className="dp-column-stat">
                            <span>Minimum</span>
                            <strong>
                              {column.statistics.min ?? "—"}
                            </strong>
                          </div>
                          <div className="dp-column-stat">
                            <span>Average</span>
                            <strong>
                              {column.statistics.mean ?? "—"}
                            </strong>
                          </div>
                          <div className="dp-column-stat">
                            <span>Maximum</span>
                            <strong>
                              {column.statistics.max ?? "—"}
                            </strong>
                          </div>
                        </div>
                      )}

                      <div className="dp-chart-title">
                        {column.type === "numeric"
                          ? "Value distribution"
                          : "Most frequent values"}
                      </div>
                      <DistributionChart column={column} />
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <div className="dp-main-grid">
              <Panel
                title="Key findings"
                subtitle="Highlights detected from the dataset profile."
              >
                {findings.length ? (
                  <div className="dp-insights-list">
                    {findings.map((finding, index) => (
                      <div className="dp-insight" key={`${index}-${finding}`}>
                        <div className="dp-insight-icon">
                          <Icon name="sparkles" size={15} />
                        </div>
                        <p>{String(finding)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dp-empty">
                    Your findings will appear after analysis.
                  </div>
                )}
              </Panel>

              <Panel
                title="Data quality warnings"
                subtitle="Items worth reviewing before making decisions."
              >
                {warnings.length ? (
                  <div className="dp-insights-list">
                    {warnings.map((warning, index) => (
                      <div
                        className="dp-insight warning"
                        key={`${index}-${warning}`}
                      >
                        <div className="dp-insight-icon">
                          <Icon name="alert" size={15} />
                        </div>
                        <p>{String(warning)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dp-insight success">
                    <div className="dp-insight-icon">
                      <Icon name="check" size={15} />
                    </div>
                    <p>
                      No additional AI quality warnings were returned.
                      Review the missing-cell and duplicate metrics as well.
                    </p>
                  </div>
                )}
              </Panel>
            </div>

            <Panel
              title="Recommended next steps"
              subtitle="Practical actions to help you get more value from your data."
            >
              {recommendations.length ? (
                <div className="dp-insights-list">
                  {recommendations.map((item, index) => (
                    <div className="dp-insight" key={`${index}-${item}`}>
                      <div className="dp-insight-icon">
                        <span style={{ fontWeight: 850, fontSize: 12 }}>
                          {index + 1}
                        </span>
                      </div>
                      <p>{String(item)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dp-empty">
                  Recommendations will appear when analysis is available.
                </div>
              )}
            </Panel>

            <Panel
              title="Dataset preview"
              subtitle={`Showing up to ${result.preview.length} sample records from the analyzed CSV.`}
              action={
                <button
                  className="dp-button"
                  disabled={!result.preview.length}
                  onClick={() =>
                    downloadCsv(
                      `${(result.filename || "dataset").replace(/\.csv$/i, "")}-preview.csv`,
                      result.preview
                    )
                  }
                >
                  <Icon name="download" size={15} /> Export preview
                </button>
              }
            >
              {result.preview.length ? (
                <div className="dp-table-wrap">
                  <table className="dp-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        {Object.keys(result.preview[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.preview.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          {Object.keys(result.preview[0]).map((key) => (
                            <td key={key} title={String(row[key] ?? "")}>
                              {row[key] === "" ||
                              row[key] === null ||
                              row[key] === undefined
                                ? "—"
                                : String(row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dp-empty">
                  No preview data available. Analyze a dataset to populate this table.
                </div>
              )}
            </Panel>

            <Panel
              title="Ask your data"
              subtitle="Ask a follow-up question about the selected dataset."
              className="dp-qa"
            >
              <form className="dp-qa-form" onSubmit={askQuestion}>
                <input
                  className="dp-input"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="e.g. Which columns have the most missing values?"
                  aria-label="Question about the dataset"
                  minLength={2}
                  maxLength={1500}
                  required
                />
                <button
                  className="dp-button primary"
                  type="submit"
                  disabled={asking || loading || !selectedId || !token}
                >
                  <Icon name="message" size={15} />
                  {asking ? "Thinking..." : "Ask DataPilot"}
                </button>
              </form>

              {questions.length > 0 && (
                <div className="dp-question-chips">
                  {questions.slice(0, 5).map((item, index) => (
                    <button
                      type="button"
                      className="dp-chip"
                      key={`${index}-${item}`}
                      onClick={() => setQuestion(String(item))}
                    >
                      {String(item)}
                    </button>
                  ))}
                </div>
              )}

              {answer && (
                <div className="dp-answer" role="status">
                  <strong>DataPilot AI</strong>
                  <div style={{ marginTop: 7 }}>{answer}</div>
                </div>
              )}
            </Panel>

            <div className="dp-footer">
              DataPilot AI · Dataset insights to support better decisions
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
