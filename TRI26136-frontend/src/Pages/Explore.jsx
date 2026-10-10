
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(value) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileType(file) {
  return (
    file.original_filename?.split(".").pop()?.toUpperCase() || "FILE"
  );
}

function FileIcon({ type }) {
  return <div className={`ex-file-icon ex-${type.toLowerCase()}`}>{type}</div>;
}

export default function Explore() {
  const location = useLocation();
  const analysisResults = Array.isArray(location.state?.analysisResults)
    ? location.state.analysisResults
    : [];

  const [files, setFiles] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadFiles = useCallback(async (showRefresh = false) => {
    setLoading(!showRefresh);
    setRefreshing(showRefresh);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const currentUser = authData.user;

      if (!currentUser) {
        setUser(null);
        setFiles([]);
        setError("Please sign in to view your private datasets.");
        return;
      }

      setUser(currentUser);

      const { data, error: queryError } = await supabase
        .from("datasets")
        .select(
          "id, user_id, name, original_filename, file_path, mime_type, size_bytes, row_count, status, created_at"
        )
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setFiles(data || []);
    } catch (err) {
      setError(err.message || "Unable to load your datasets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles, location.key]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      // Refresh after sign-in, sign-out, or session changes.
      loadFiles(true);
    });

    return () => data.subscription.unsubscribe();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        !query ||
        file.name?.toLowerCase().includes(query) ||
        file.original_filename?.toLowerCase().includes(query);

      const type = fileType(file).toLowerCase();
      const matchesType =
        filter === "all" ||
        (filter === "csv" && type === "csv") ||
        (filter === "excel" && ["xls", "xlsx"].includes(type));

      return matchesSearch && matchesType;
    });
  }, [files, search, filter]);

  const totalBytes = files.reduce(
    (total, file) => total + Number(file.size_bytes || 0),
    0
  );

  const downloadFile = async (file) => {
    setBusyId(file.id);
    setNotice("");

    try {
      if (!user || file.user_id !== user.id) {
        throw new Error("You don't have permission to download this file.");
      }

      const { data, error: downloadError } = await supabase.storage
        .from("datasets")
        .download(file.file_path);

      if (downloadError) throw downloadError;

      const objectUrl = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = file.original_filename || file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setNotice(`Downloaded ${file.name}.`);
    } catch (err) {
      setNotice(err.message || "Download failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteFile = async (file) => {
    if (!user || file.user_id !== user.id) {
      setNotice("You don't have permission to delete this file.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${file.original_filename || file.name}" permanently?\n\nThe stored file and its database record will be removed.`
    );

    if (!confirmed) return;

    setBusyId(file.id);
    setNotice("");

    try {
      // Remove the private Storage object first.
      const { error: storageError } = await supabase.storage
        .from("datasets")
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete only this user's database record.
      const { error: databaseError } = await supabase
        .from("datasets")
        .delete()
        .eq("id", file.id)
        .eq("user_id", user.id);

      if (databaseError) {
        throw new Error(
          `The file was removed from Storage, but its database record could not be deleted: ${databaseError.message}`
        );
      }

      setFiles((current) =>
        current.filter((item) => item.id !== file.id)
      );

      setSelected((current) =>
        current?.id === file.id ? null : current
      );

      setNotice("File and database record deleted successfully.");
    } catch (err) {
      setNotice(err.message || "Could not delete this file.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="dp-site dp-explore">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');

        .dp-explore {
          --ex-bg: #f5f6f0;
          --ex-ink: #17211c;
          --ex-muted: #5e695f;
          --ex-line: #dce2d7;
          --ex-lime: #d7ff55;
          min-height: 100vh;
          padding: 0 5%;
          color: var(--ex-ink);
          background: var(--ex-bg);
          font-family: 'Manrope', sans-serif;
          font-size: 15px;
          line-height: 1.6;
        }

        .dp-explore * { box-sizing: border-box; }
        .dp-explore button, .dp-explore input, .dp-explore select {
          font: inherit;
        }
        .dp-explore button:focus-visible,
        .dp-explore a:focus-visible,
        .dp-explore input:focus-visible,
        .dp-explore select:focus-visible {
          outline: 3px solid #9abd45;
          outline-offset: 3px;
        }

        .ex-nav {
          min-height: 82px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          border-bottom: 1px solid var(--ex-line);
        }

        .ex-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          color: var(--ex-ink);
          text-decoration: none;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -.7px;
        }

        .ex-brand-mark {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          border-radius: 11px;
          background: var(--ex-ink);
          color: var(--ex-lime);
          font-size: 22px;
        }

        .ex-nav-right {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .ex-nav-link {
          color: #58655b;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .ex-nav-link:hover, .ex-nav-link.active { color: var(--ex-ink); }

        .ex-avatar {
          display: grid;
          place-items: center;
          width: 41px;
          height: 41px;
          border-radius: 50%;
          background: #e3e9dc;
          color: #314338;
          font-size: 13px;
          font-weight: 800;
        }

        .ex-main {
          max-width: 1300px;
          margin: 0 auto;
          padding: 48px 0 75px;
        }

        .ex-eyebrow {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #59665c;
          font: 12px 'DM Mono', monospace;
          letter-spacing: 1.1px;
          text-transform: uppercase;
        }

        .ex-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #8bbd32;
          box-shadow: 0 0 0 5px #e8f2d8;
        }

        .ex-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 24px;
          margin: 22px 0 30px;
        }

        .ex-heading {
          margin: 0;
          font-size: clamp(40px, 5vw, 61px);
          line-height: 1.12;
          letter-spacing: -2.8px;
          font-weight: 800;
        }

        .ex-heading span {
          color: #819078;
          font-weight: 500;
        }

        .ex-subtitle {
          max-width: 660px;
          margin: 15px 0 0;
          color: #59665d;
          font-size: 15px;
          line-height: 1.9;
        }

        .ex-primary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 12px 19px;
          border: 0;
          border-radius: 10px;
          background: var(--ex-ink);
          color: white;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition: transform .2s, background .2s;
          white-space: nowrap;
        }

        .ex-primary:hover {
          background: #34463a;
          transform: translateY(-2px);
        }

        .ex-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          margin-bottom: 26px;
        }

        .ex-analysis {
          margin-bottom: 26px;
          padding: 24px;
          border: 1px solid var(--ex-line);
          border-radius: 17px;
          background: white;
        }

        .ex-analysis-title {
          margin: 0 0 16px;
          font-size: 19px;
          font-weight: 800;
        }

        .ex-analysis-file + .ex-analysis-file {
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #e9ede5;
        }

        .ex-analysis-file-title {
          margin: 0 0 12px;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .ex-analysis-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          color: #59665d;
          font-size: 12px;
        }

        .ex-analysis-report {
          margin: 15px 0 0;
          color: #344438;
          font-size: 13px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .ex-analysis-note {
          margin: 12px 0 0;
          color: #59665d;
          font-size: 13px;
        }

        .ex-analysis-facts {
          margin: 12px 0 0;
          padding-left: 20px;
          color: #59665d;
          font-size: 12px;
        }

        .ex-stat {
          min-width: 0;
          padding: 21px;
          border: 1px solid var(--ex-line);
          border-radius: 15px;
          background: white;
        }

        .ex-stat-label {
          color: #5e6b60;
          font: 11px 'DM Mono', monospace;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .ex-stat-value {
          margin-top: 9px;
          font-size: clamp(25px, 3vw, 34px);
          font-weight: 800;
          letter-spacing: -1.3px;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .ex-stat-caption {
          margin-top: 5px;
          color: #687468;
          font-size: 12px;
        }

        .ex-panel {
          min-width: 0;
          border: 1px solid var(--ex-line);
          border-radius: 17px;
          background: white;
          box-shadow: 0 8px 28px rgba(30,45,30,.025);
          overflow: hidden;
        }

        .ex-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 25px;
          border-bottom: 1px solid #e9ede5;
        }

        .ex-panel-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .ex-panel-kicker {
          margin-top: 5px;
          color: #647064;
          font: 11px 'DM Mono', monospace;
        }

        .ex-count {
          padding: 7px 10px;
          border-radius: 7px;
          background: #f0f3e9;
          color: #435143;
          font: 11px 'DM Mono', monospace;
          white-space: nowrap;
        }

        .ex-toolbar {
          display: flex;
          gap: 12px;
          padding: 18px 24px;
          border-bottom: 1px solid #e9ede5;
        }

        .ex-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          padding: 0 13px;
          border: 1px solid #dce3d8;
          border-radius: 9px;
          background: #fbfcf8;
        }

        .ex-search-icon {
          color: #677466;
          font-size: 19px;
        }

        .ex-search {
          width: 100%;
          min-width: 0;
          min-height: 44px;
          border: 0;
          outline: none;
          background: transparent;
          color: var(--ex-ink);
          font-size: 13px;
        }

        .ex-search:focus-visible { outline: none !important; }

        .ex-filter {
          min-width: 145px;
          padding: 0 12px;
          border: 1px solid #dce3d8;
          border-radius: 9px;
          background: #fbfcf8;
          color: #354439;
          font-size: 13px;
        }

        .ex-refresh {
          width: 46px;
          flex: 0 0 46px;
          border: 1px solid #dce3d8;
          border-radius: 9px;
          background: white;
          color: #314338;
          cursor: pointer;
          font-size: 19px;
        }

        .ex-refresh:hover { background: #f2f6e9; }

        .ex-table-wrap { overflow-x: auto; }

        .ex-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .ex-table th {
          padding: 13px 20px;
          background: #fafbf7;
          color: #647064;
          font: 10px 'DM Mono', monospace;
          font-weight: 500;
          letter-spacing: .5px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .ex-table td {
          padding: 17px 20px;
          border-top: 1px solid #edf0e9;
          vertical-align: middle;
          font-size: 12px;
          color: #4c594e;
        }

        .ex-table tbody tr { transition: background .15s; }
        .ex-table tbody tr:hover { background: #fafcf6; }

        .ex-file-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 210px;
        }

        .ex-file-icon {
          display: grid;
          place-items: center;
          width: 43px;
          height: 45px;
          flex: 0 0 43px;
          border: 1px solid #dce8cc;
          border-radius: 9px;
          background: #edf4dd;
          color: #425d25;
          font: 10px 'DM Mono', monospace;
          font-weight: 500;
        }

        .ex-csv {
          background: #f0f0e2;
          border-color: #e4e3cd;
          color: #6d6b2b;
        }

        .ex-xls, .ex-xlsx {
          background: #e4f2e8;
          border-color: #d0e6d7;
          color: #28683d;
        }

        .ex-file-name {
          max-width: 260px;
          color: #202d23;
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .ex-file-sub {
          margin-top: 4px;
          color: #788276;
          font: 10px 'DM Mono', monospace;
        }

        .ex-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 6px;
          background: #edf7e9;
          color: #28713c;
          font: 10px 'DM Mono', monospace;
          white-space: nowrap;
        }

        .ex-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .ex-action {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 1px solid #e1e7dd;
          border-radius: 8px;
          background: white;
          color: #435143;
          cursor: pointer;
          font-size: 16px;
          transition: background .15s, border .15s;
        }

        .ex-action:hover {
          border-color: #cbd8bf;
          background: #f2f6e9;
        }

        .ex-action.danger { color: #a33d36; }
        .ex-action.danger:hover {
          border-color: #f0ceca;
          background: #fff0ed;
        }

        .ex-action:disabled {
          opacity: .45;
          cursor: wait;
        }

        .ex-empty {
          padding: 52px 22px;
          text-align: center;
        }

        .ex-empty-mark {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          margin: 0 auto 18px;
          border: 1px solid #dce5d0;
          border-radius: 18px;
          background: #f0f5e7;
          color: #58743d;
          font-size: 27px;
          transform: rotate(-3deg);
        }

        .ex-empty-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
        }

        .ex-empty-copy {
          max-width: 390px;
          margin: 9px auto 20px;
          color: #657064;
          font-size: 13px;
          line-height: 1.8;
        }

        .ex-message {
          margin: 15px 24px;
          padding: 12px 14px;
          border-radius: 9px;
          background: #edf7e9;
          color: #285f31;
          font-size: 12px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .ex-message.error {
          background: #fff0ed;
          color: #92342c;
        }

        .ex-error-state {
          margin: 24px;
          padding: 20px;
          border: 1px solid #f0ceca;
          border-radius: 10px;
          background: #fff7f5;
          color: #92342c;
          font-size: 13px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .ex-details {
          margin-top: 22px;
          padding: 23px;
          border: 1px solid var(--ex-line);
          border-radius: 16px;
          background: white;
        }

        .ex-details-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .ex-details-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .ex-close {
          width: 35px;
          height: 35px;
          flex: 0 0 35px;
          border: 1px solid #dce3d8;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 19px;
        }

        .ex-details-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .ex-detail {
          min-width: 0;
          padding: 13px;
          border-radius: 9px;
          background: #f6f8f1;
        }

        .ex-detail-label {
          color: #6b7769;
          font: 10px 'DM Mono', monospace;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .ex-detail-value {
          margin-top: 6px;
          color: #28382b;
          font-size: 12px;
          font-weight: 700;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .ex-detail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .ex-secondary {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          padding: 10px 14px;
          border: 1px solid #dce3d8;
          border-radius: 9px;
          background: white;
          color: #344438;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .ex-secondary:hover { background: #f3f6ed; }

        .ex-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid var(--ex-line);
          color: #58665b;
          font: 10px 'DM Mono', monospace;
          line-height: 1.8;
        }

        .ex-spinner {
          display: inline-block;
          width: 17px;
          height: 17px;
          border: 2px solid #dce3d8;
          border-top-color: #405c32;
          border-radius: 50%;
          animation: ex-spin .7s linear infinite;
          vertical-align: middle;
        }

        @keyframes ex-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1000px) {
          .dp-explore { padding: 0 4%; }
          .ex-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ex-table th, .ex-table td { padding-left: 14px; padding-right: 14px; }
        }

        @media (max-width: 650px) {
          .dp-explore { padding: 0 16px; }
          .ex-nav { min-height: 72px; }
          .ex-brand { gap: 8px; font-size: 18px; }
          .ex-brand-mark { width: 34px; height: 34px; }
          .ex-nav-right { gap: 12px; }
          .ex-nav-link { font-size: 11px; }
          .ex-avatar { display: none; }
          .ex-main { padding-top: 34px; }
          .ex-heading-row { align-items: flex-start; flex-direction: column; }
          .ex-heading { font-size: clamp(37px, 10vw, 49px); letter-spacing: -2px; }
          .ex-heading-row > .ex-primary { width: 100%; }
          .ex-stat { padding: 15px; }
          .ex-stat-value { font-size: 27px; }
          .ex-toolbar { flex-wrap: wrap; padding: 14px; }
          .ex-search-wrap { flex-basis: calc(100% - 58px); }
          .ex-filter { min-height: 42px; flex: 1; }
          .ex-panel-head { padding: 18px 15px; }
          .ex-table { min-width: 750px; }
          .ex-details { padding: 17px; }
          .ex-details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ex-footer { flex-direction: column; gap: 7px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dp-explore *, .dp-explore *::before, .dp-explore *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <header className="ex-nav">
        <Link to="/" className="ex-brand">
          <span className="ex-brand-mark">✳</span>
          DataPilot<span style={{ color: "#819078" }}>AI</span>
        </Link>

        <nav className="ex-nav-right" aria-label="Main navigation">
          <Link to="/dashboard" className="ex-nav-link">Dashboard</Link>
          <Link to="/explore" className="ex-nav-link active">Explore</Link>
          <Link to="/upload" className="ex-nav-link">Upload</Link>
          <div className="ex-avatar" title="Your private workspace">
            {user?.email?.[0]?.toUpperCase() || "DP"}
          </div>
        </nav>
      </header>

      <section className="ex-main">
        <div className="ex-eyebrow">
          <span className="ex-dot" />
          DATA WORKSPACE / EXPLORER
        </div>

        <div className="ex-heading-row">
          <div>
            <h1 className="ex-heading">
              Your data.
              <br />
              <span>All in one place.</span>
            </h1>
            <p className="ex-subtitle">
              Browse your uploaded datasets, inspect file information,
              download originals, and manage your private data library.
            </p>
          </div>

          <Link to="/upload" className="ex-primary">
            + Upload new dataset
          </Link>
        </div>

        <section className="ex-stats" aria-label="Dataset statistics">
          <div className="ex-stat">
            <div className="ex-stat-label">Total datasets</div>
            <div className="ex-stat-value">{loading ? "—" : files.length}</div>
            <div className="ex-stat-caption">Files in your workspace</div>
          </div>

          <div className="ex-stat">
            <div className="ex-stat-label">Storage used</div>
            <div className="ex-stat-value">
              {loading ? "—" : formatSize(totalBytes)}
            </div>
            <div className="ex-stat-caption">Combined file size</div>
          </div>

          <div className="ex-stat">
            <div className="ex-stat-label">CSV files</div>
            <div className="ex-stat-value">
              {loading ? "—" : files.filter((f) => fileType(f) === "CSV").length}
            </div>
            <div className="ex-stat-caption">Comma-separated data</div>
          </div>

          <div className="ex-stat">
            <div className="ex-stat-label">Excel files</div>
            <div className="ex-stat-value">
              {loading ? "—" : files.filter((f) => ["XLS", "XLSX"].includes(fileType(f))).length}
            </div>
            <div className="ex-stat-caption">Spreadsheet datasets</div>
          </div>
        </section>

        {location.state?.uploadNotice && (
          <div className="ex-message" role="status">
            {location.state.uploadNotice}
          </div>
        )}

        {analysisResults.length > 0 && (
          <section className="ex-analysis" aria-label="Latest analysis results">
            <h2 className="ex-analysis-title">Latest dataset analysis</h2>
            {analysisResults.map((item, index) => {
              const worksheets = item.result?.worksheets
                ? Object.entries(item.result.worksheets).map(
                    ([name, result]) => ({
                      ...result,
                      worksheet: result.worksheet || name,
                    })
                  )
                : item.result
                  ? [item.result]
                  : [];

              return (
                <article
                  className="ex-analysis-file"
                  key={`${item.fileName}-${index}`}
                >
                  <h3 className="ex-analysis-file-title">{item.fileName}</h3>
                  {item.error ? (
                    <p className="ex-analysis-note" role="alert">
                      Analysis unavailable: {item.error}
                    </p>
                  ) : (
                    worksheets.map((result) => (
                      <div key={result.worksheet || item.fileName}>
                        {result.worksheet && (
                          <h4 className="ex-analysis-file-title">
                            Worksheet: {result.worksheet}
                          </h4>
                        )}
                        <div className="ex-analysis-metrics">
                          <span>{result.rows} rows</span>
                          <span>{result.column_count} columns</span>
                          <span>{result.completeness_percent}% complete</span>
                          <span>{result.duplicate_rows} duplicate rows</span>
                        </div>
                        <p className="ex-analysis-note">
                          AI report: {result.ai_analysis?.status || "unavailable"}
                          {result.ai_analysis?.message
                            ? ` — ${result.ai_analysis.message}`
                            : ""}
                        </p>
                        {result.ai_analysis?.insights && (
                          <p className="ex-analysis-report">
                            {result.ai_analysis.insights}
                          </p>
                        )}
                        {Array.isArray(result.insights) &&
                          result.insights.length > 0 && (
                            <ul className="ex-analysis-facts">
                              {result.insights.map((insight) => (
                                <li key={insight}>{insight}</li>
                              ))}
                            </ul>
                          )}
                      </div>
                    ))
                  )}
                </article>
              );
            })}
          </section>
        )}

        <section className="ex-panel">
          <div className="ex-panel-head">
            <div>
              <h2 className="ex-panel-title">Your file library</h2>
              <div className="ex-panel-kicker">
                UPLOAD HISTORY · PRIVATE TO YOUR ACCOUNT
              </div>
            </div>
            <span className="ex-count">
              {filteredFiles.length} {filteredFiles.length === 1 ? "FILE" : "FILES"}
            </span>
          </div>

          <div className="ex-toolbar">
            <label className="ex-search-wrap">
              <span className="ex-search-icon" aria-hidden="true">⌕</span>
              <input
                className="ex-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your datasets..."
                aria-label="Search datasets"
              />
            </label>

            <select
              className="ex-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter by file type"
            >
              <option value="all">All file types</option>
              <option value="csv">CSV files</option>
              <option value="excel">Excel files</option>
            </select>

            <button
              className="ex-refresh"
              type="button"
              onClick={() => loadFiles(true)}
              disabled={refreshing}
              title="Refresh datasets"
              aria-label="Refresh datasets"
            >
              {refreshing ? <span className="ex-spinner" /> : "↻"}
            </button>
          </div>

          {notice && (
            <div className="ex-message" role="status">{notice}</div>
          )}

          {error ? (
            <div className="ex-error-state" role="alert">
              <strong>We couldn't load your datasets.</strong>
              <div>{error}</div>
              <button
                type="button"
                className="ex-secondary"
                onClick={() => loadFiles()}
                style={{ marginTop: 13 }}
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="ex-empty">
              <span className="ex-spinner" />
              <p className="ex-empty-copy">Loading your private datasets...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="ex-empty">
              <div className="ex-empty-mark">⌁</div>
              <h3 className="ex-empty-title">
                {files.length === 0 ? "Your library starts here" : "No matching files"}
              </h3>
              <p className="ex-empty-copy">
                {files.length === 0
                  ? "Upload your first CSV or Excel file. Once saved, it will appear here with its file details and available actions."
                  : "Try a different search term or change the file-type filter."}
              </p>
              {files.length === 0 && (
                <Link to="/upload" className="ex-primary">
                  Upload your first dataset ↗
                </Link>
              )}
              {(search || filter !== "all") && files.length > 0 && (
                <button
                  className="ex-secondary"
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="ex-table-wrap">
              <table className="ex-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>File size</th>
                    <th>Uploaded</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div className="ex-file-cell">
                          <FileIcon type={fileType(file)} />
                          <div>
                            <div className="ex-file-name">
                              {file.original_filename || file.name}
                            </div>
                            <div className="ex-file-sub">
                              {fileType(file)} · {file.row_count != null
                                ? `${file.row_count.toLocaleString()} rows`
                                : "Row count not analyzed"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{formatSize(Number(file.size_bytes || 0))}</td>
                      <td>{formatDate(file.created_at)}</td>
                      <td>
                        <span className="ex-status">
                          <span aria-hidden="true">●</span>
                          {file.status || "uploaded"}
                        </span>
                      </td>
                      <td>
                        <div className="ex-actions">
                          <button
                            type="button"
                            className="ex-action"
                            title="View file details"
                            aria-label={`View details for ${file.name}`}
                            onClick={() => setSelected(file)}
                          >
                            ⓘ
                          </button>
                          <button
                            type="button"
                            className="ex-action"
                            title="Download file"
                            aria-label={`Download ${file.name}`}
                            disabled={busyId === file.id}
                            onClick={() => downloadFile(file)}
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="ex-action danger"
                            title="Delete file"
                            aria-label={`Delete ${file.name}`}
                            disabled={busyId === file.id}
                            onClick={() => deleteFile(file)}
                          >
                            {busyId === file.id ? "…" : "×"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="ex-details" aria-label="Selected file details">
            <div className="ex-details-head">
              <div>
                <div className="ex-eyebrow">DATASET / FILE DETAILS</div>
                <h2 className="ex-details-title" style={{ marginTop: 10 }}>
                  {selected.original_filename || selected.name}
                </h2>
              </div>
              <button
                type="button"
                className="ex-close"
                onClick={() => setSelected(null)}
                aria-label="Close file details"
              >
                ×
              </button>
            </div>

            <div className="ex-details-grid">
              <div className="ex-detail">
                <div className="ex-detail-label">File type</div>
                <div className="ex-detail-value">{fileType(selected)}</div>
              </div>
              <div className="ex-detail">
                <div className="ex-detail-label">File size</div>
                <div className="ex-detail-value">
                  {formatSize(Number(selected.size_bytes || 0))}
                </div>
              </div>
              <div className="ex-detail">
                <div className="ex-detail-label">Upload date</div>
                <div className="ex-detail-value">{formatDate(selected.created_at)}</div>
              </div>
              <div className="ex-detail">
                <div className="ex-detail-label">Upload status</div>
                <div className="ex-detail-value">{selected.status || "uploaded"}</div>
              </div>
              <div className="ex-detail">
                <div className="ex-detail-label">Rows</div>
                <div className="ex-detail-value">
                  {selected.row_count == null
                    ? "Not analyzed yet"
                    : selected.row_count.toLocaleString()}
                </div>
              </div>
              <div className="ex-detail">
                <div className="ex-detail-label">MIME type</div>
                <div className="ex-detail-value">{selected.mime_type || "Not provided"}</div>
              </div>
              <div className="ex-detail" style={{ gridColumn: "1 / -1" }}>
                <div className="ex-detail-label">Dataset ID</div>
                <div className="ex-detail-value">{selected.id}</div>
              </div>
            </div>

            <div className="ex-detail-actions">
              <button
                type="button"
                className="ex-primary"
                disabled={busyId === selected.id}
                onClick={() => downloadFile(selected)}
              >
                ↓ Download original
              </button>
              <button
                type="button"
                className="ex-secondary"
                disabled={busyId === selected.id}
                onClick={() => deleteFile(selected)}
              >
                Delete dataset
              </button>
            </div>
          </section>
        )}

        <footer className="ex-footer">
          <span>DATAPILOT AI · DATA WORKSPACE</span>
          <span>YOUR FILES · YOUR ACCOUNT · PRIVATE STORAGE</span>
        </footer>
      </section>
    </main>
  );
}
