
import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED = ["csv", "xls", "xlsx"];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function validateFile(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!ALLOWED.includes(extension)) {
    return "Only CSV, XLS, and XLSX files are supported.";
  }

  if (file.size > MAX_SIZE) {
    return "File exceeds the 50 MB limit.";
  }

  if (file.size === 0) {
    return "This file is empty.";
  }

  return "";
}

function FileIcon({ extension }) {
  return (
    <div className={`up-file-icon up-${extension}`}>
      {extension?.toUpperCase()}
    </div>
  );
}

export default function Upload() {
  const inputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const updateItem = (id, patch) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );
  };

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const newItems = incoming.map((file) => {
      const error = validateFile(file);

      return {
        id: makeId(),
        file,
        name: file.name,
        size: file.size,
        extension: file.name.split(".").pop()?.toLowerCase(),
        status: error ? "invalid" : "ready",
        progress: 0,
        error,
      };
    });

    setItems((current) => [...current, ...newItems]);
    setNotice(null);
  }, []);

  const removeItem = (id) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const uploadFiles = async () => {
    const ready = items.filter(
      (item) =>
        ["ready", "failed"].includes(item.status) &&
        !item.error
    );

    if (!ready.length || busy) return;

    setBusy(true);
    setNotice(null);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData.session?.user;

      if (!user) {
        setNotice({
          type: "error",
          text: "Your session has expired. Please sign in again.",
        });
        return;
      }

      let succeeded = 0;
      let failed = 0;

      for (const item of ready) {
        updateItem(item.id, {
          status: "uploading",
          progress: 10,
          error: "",
        });

        let uploadedPath = null;

        try {
          const safeName = item.file.name
            .normalize("NFKD")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .slice(-140);

          const filePath = `${user.id}/${makeId()}-${safeName}`;

          const { error: storageError } = await supabase.storage
            .from("datasets")
            .upload(filePath, item.file, {
              contentType:
                item.file.type || "application/octet-stream",
              upsert: false,
            });

          if (storageError) throw storageError;

          uploadedPath = filePath;
          updateItem(item.id, { progress: 75 });

          const { error: databaseError } = await supabase
            .from("datasets")
            .insert({
              user_id: user.id,
              name: item.file.name,
              original_filename: item.file.name,
              file_path: filePath,
              mime_type: item.file.type || null,
              size_bytes: item.file.size,
              status: "uploaded",
            });

          if (databaseError) throw databaseError;

          updateItem(item.id, {
            status: "uploaded",
            progress: 100,
            error: "",
          });

          succeeded += 1;
        } catch (error) {
          if (uploadedPath) {
            const { error: cleanupError } = await supabase.storage
              .from("datasets")
              .remove([uploadedPath]);

            if (cleanupError) {
              console.error("Storage cleanup failed:", cleanupError);
            }
          }

          updateItem(item.id, {
            status: "failed",
            progress: 0,
            error:
              error.message || "Upload failed. Please try again.",
          });

          failed += 1;
        }
      }

      setNotice({
        type: failed ? "error" : "success",
        text: `${succeeded} file${succeeded === 1 ? "" : "s"} uploaded successfully${
          failed ? ` · ${failed} failed` : ""
        }.`,
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: error.message || "Something went wrong. Please retry.",
      });
    } finally {
      setBusy(false);
    }
  };

  const totalSize = items.reduce(
    (sum, item) => sum + item.size,
    0
  );

  const validCount = items.filter(
    (item) =>
      ["ready", "failed"].includes(item.status) &&
      !item.error
  ).length;

  const uploadedCount = items.filter(
    (item) => item.status === "uploaded"
  ).length;

  return (
    <main className="dp-site dp-upload-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');

        .dp-upload-page {
          --up-bg: #f5f6f0;
          --up-ink: #17211c;
          --up-muted: #5e695f;
          --up-line: #dce2d7;
          --up-green: #d7ff55;

          min-height: 100vh;
          background: var(--up-bg);
          color: var(--up-ink);
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          padding: 0 5%;
          line-height: 1.6;
        }

        .dp-upload-page * {
          box-sizing: border-box;
        }

        .dp-upload-page button,
        .dp-upload-page input {
          font: inherit;
        }

        .up-nav {
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid var(--up-line);
        }

        .up-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--up-ink);
          text-decoration: none;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .up-brand-mark {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          background: var(--up-ink);
          color: var(--up-green);
          border-radius: 11px;
          font-size: 22px;
        }

        .up-nav-right {
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .up-nav-link {
          color: #58655b;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          transition: color .2s;
        }

        .up-nav-link:hover,
        .up-nav-link.active {
          color: var(--up-ink);
        }

        .up-avatar {
          display: grid;
          place-items: center;
          width: 41px;
          height: 41px;
          border-radius: 50%;
          background: #e3e9dc;
          color: #314338;
          font-size: 14px;
          font-weight: 800;
        }

        .up-main {
          max-width: 1220px;
          margin: 0 auto;
          padding: 55px 0 80px;
        }

        .up-eyebrow {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #59665c;
          font: 12px 'DM Mono', monospace;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .up-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #8bbd32;
          box-shadow: 0 0 0 5px #e8f2d8;
        }

        .up-heading-row {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
          margin: 21px 0 38px;
        }

        .up-heading {
          font-size: clamp(42px, 5.5vw, 66px);
          letter-spacing: -3px;
          line-height: 1.08;
          font-weight: 800;
          margin: 0;
        }

        .up-heading span {
          color: #7a887c;
          font-weight: 500;
        }

        .up-subtitle {
          color: #59665d;
          max-width: 650px;
          font-size: 16px;
          line-height: 1.9;
          margin: 18px 0 0;
        }

        .up-secure {
          display: flex;
          align-items: center;
          gap: 9px;
          white-space: nowrap;
          color: #526055;
          font: 12px 'DM Mono', monospace;
          padding-bottom: 9px;
        }

        .up-secure svg {
          width: 19px;
          height: 19px;
        }

        .up-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, .78fr);
          gap: 23px;
          align-items: start;
        }

        .up-panel {
          background: #fff;
          border: 1px solid var(--up-line);
          border-radius: 19px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(30, 45, 30, .035);
        }

        .up-panel-head {
          padding: 24px 27px;
          border-bottom: 1px solid #e9ede5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .up-panel-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .up-panel-kicker {
          margin-top: 7px;
          color: #606d62;
          font: 12px 'DM Mono', monospace;
          letter-spacing: .3px;
        }

        .up-counter {
          border-radius: 8px;
          background: #f0f3e9;
          padding: 8px 11px;
          font: 12px 'DM Mono', monospace;
          color: #435143;
          white-space: nowrap;
        }

        .up-drop {
          position: relative;
          margin: 25px;
          min-height: 335px;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border: 2px dashed #c6d1be;
          border-radius: 16px;
          background: #fafbf7;
          transition: border-color .25s, background .25s, transform .25s;
          overflow: hidden;
          cursor: pointer;
          outline: none;
        }

        .up-drop:hover,
        .up-drop:focus-visible,
        .up-drop.dragging {
          border-color: #829c4b;
          background: #f5f9ed;
        }

        .up-drop.dragging {
          transform: scale(.993);
        }

        .up-visual {
          width: 110px;
          height: 104px;
          display: grid;
          place-items: center;
          perspective: 500px;
          margin-bottom: 19px;
        }

        .up-cube {
          width: 62px;
          height: 62px;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateX(-24deg) rotateY(-35deg);
          animation: up-cube-float 5s ease-in-out infinite;
        }

        .up-cube-face {
          position: absolute;
          width: 62px;
          height: 62px;
          border: 1px solid #84956e;
          display: grid;
          place-items: center;
          font: 12px 'DM Mono', monospace;
          font-weight: 500;
          color: #273a2d;
          background: rgba(215,255,85,.82);
          box-shadow: inset 0 0 20px rgba(255,255,255,.25);
        }

        .up-cube-face.front { transform: translateZ(31px); }
        .up-cube-face.back { transform: rotateY(180deg) translateZ(31px); }
        .up-cube-face.right { transform: rotateY(90deg) translateZ(31px); background: #c3e65d; }
        .up-cube-face.left { transform: rotateY(-90deg) translateZ(31px); background: #e8f6c7; }
        .up-cube-face.top { transform: rotateX(90deg) translateZ(31px); background: #edf8d8; }
        .up-cube-face.bottom { transform: rotateX(-90deg) translateZ(31px); background: #9fbe4c; }

        @keyframes up-cube-float {
          0%, 100% { transform: translateY(0) rotateX(-24deg) rotateY(-35deg); }
          50% { transform: translateY(-8px) rotateX(-17deg) rotateY(0deg); }
        }

        .up-drop-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -.5px;
        }

        .up-drop-copy {
          margin: 11px 0 20px;
          color: #59665d;
          font-size: 14px;
          line-height: 1.9;
        }

        .up-browse {
          border: 0;
          background: var(--up-ink);
          color: white;
          border-radius: 10px;
          padding: 14px 22px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: background .2s, transform .2s;
        }

        .up-browse:hover {
          background: #34463a;
          transform: translateY(-1px);
        }

        .up-formats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }

        .up-format {
          border: 1px solid #dce3d5;
          background: white;
          color: #4d5a4e;
          border-radius: 6px;
          padding: 6px 10px;
          font: 11px 'DM Mono', monospace;
        }

        .up-max {
          color: #687468;
          font: 11px 'DM Mono', monospace;
          margin-top: 14px;
        }

        .up-list {
          padding: 0 25px 25px;
        }

        .up-list-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 12px;
        }

        .up-list-label {
          font-size: 15px;
          font-weight: 800;
        }

        .up-clear {
          border: 0;
          background: transparent;
          color: #58655b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 5px;
        }

        .up-clear:hover:not(:disabled) {
          color: #ad4848;
        }

        .up-clear:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .up-file {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 13px;
          border: 1px solid #e3e8df;
          border-radius: 12px;
          margin-top: 10px;
          min-width: 0;
          animation: up-appear .25s ease both;
        }

        @keyframes up-appear {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .up-file-icon {
          flex: 0 0 47px;
          width: 47px;
          height: 49px;
          border-radius: 9px;
          background: #edf4dd;
          color: #425d25;
          display: grid;
          place-items: center;
          font: 11px 'DM Mono', monospace;
          font-weight: 500;
          border: 1px solid #dce8cc;
        }

        .up-xls {
          background: #e4f2e8;
          color: #28683d;
          border-color: #d0e6d7;
        }

        .up-csv {
          background: #f0f0e2;
          color: #6d6b2b;
          border-color: #e4e3cd;
        }

        .up-file-info {
          flex: 1;
          min-width: 0;
        }

        .up-file-name {
          overflow-wrap: anywhere;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.5;
        }

        .up-file-meta {
          color: #5e6b60;
          font: 11px 'DM Mono', monospace;
          margin-top: 6px;
        }

        .up-progress {
          height: 6px;
          background: #e9eee4;
          border-radius: 10px;
          margin-top: 10px;
          overflow: hidden;
        }

        .up-progress-bar {
          height: 100%;
          background: #a6cb45;
          border-radius: 10px;
          transition: width .35s ease;
        }

        .up-status {
          flex: 0 0 auto;
          text-align: right;
          font: 11px 'DM Mono', monospace;
          font-weight: 500;
          color: #526052;
        }

        .up-status.uploaded { color: #287641; }
        .up-status.failed,
        .up-status.invalid { color: #a83434; }

        .up-error {
          font-size: 12px;
          color: #a83434;
          line-height: 1.65;
          margin-top: 7px;
          overflow-wrap: anywhere;
        }

        .up-remove {
          border: 0;
          background: transparent;
          color: #758075;
          cursor: pointer;
          padding: 4px;
          font-size: 23px;
          line-height: 1;
        }

        .up-remove:hover { color: #b54b4b; }

        .up-upload-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 19px;
          border: 0;
          border-radius: 11px;
          padding: 17px;
          background: var(--up-green);
          color: #1d291d;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: transform .2s, background .2s;
        }

        .up-upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: #c9f344;
        }

        .up-upload-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .up-notice {
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.7;
          margin-top: 15px;
          overflow-wrap: anywhere;
        }

        .up-notice.success {
          background: #edf7e9;
          color: #285f31;
        }

        .up-notice.error {
          background: #fff0ed;
          color: #92342c;
        }

        .up-side {
          display: grid;
          gap: 18px;
        }

        .up-side-card {
          border: 1px solid var(--up-line);
          border-radius: 17px;
          background: white;
          padding: 25px;
          box-shadow: 0 8px 28px rgba(30, 45, 30, .025);
        }

        .up-side-label {
          color: #5b695d;
          font: 12px 'DM Mono', monospace;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .up-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 19px;
        }

        .up-stat {
          border-radius: 12px;
          background: #f3f6ed;
          padding: 16px 14px;
          min-width: 0;
        }

        .up-stat-number {
          font-size: 30px;
          letter-spacing: -1px;
          font-weight: 800;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .up-stat-caption {
          color: #58665a;
          font-size: 12px;
          line-height: 1.6;
          margin-top: 7px;
        }

        .up-storage-row {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 21px;
          padding-top: 18px;
          border-top: 1px solid #e8ece4;
        }

        .up-storage-icon {
          display: grid;
          place-items: center;
          flex: 0 0 44px;
          height: 44px;
          border-radius: 11px;
          background: #edf4df;
          color: #496d2b;
          font-size: 23px;
        }

        .up-storage-title {
          font-size: 14px;
          font-weight: 800;
        }

        .up-storage-copy {
          color: #5b685d;
          font-size: 12px;
          line-height: 1.8;
          margin-top: 5px;
        }

        .up-check-list {
          list-style: none;
          margin: 19px 0 0;
          padding: 0;
          display: grid;
          gap: 17px;
        }

        .up-check-list li {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 13px;
          line-height: 1.8;
          color: #48564a;
        }

        .up-check {
          display: grid;
          place-items: center;
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
          border-radius: 50%;
          background: #edf5df;
          color: #527a2a;
          font-size: 14px;
          font-weight: 800;
          margin-top: 1px;
        }

        .up-side-note {
          margin: 17px 0 0;
          color: #59665c;
          font-size: 12px;
          line-height: 1.9;
          border-top: 1px solid #e8ece4;
          padding-top: 15px;
        }

        .up-footer {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          border-top: 1px solid var(--up-line);
          padding-top: 22px;
          margin-top: 36px;
          color: #58665b;
          font: 11px 'DM Mono', monospace;
          line-height: 1.8;
        }

        .dp-upload-page button:focus-visible,
        .dp-upload-page a:focus-visible {
          outline: 3px solid #9abd45;
          outline-offset: 4px;
        }

        @media (max-width: 900px) {
          .dp-upload-page { padding: 0 4%; }
          .up-layout { grid-template-columns: 1fr; }
          .up-side { grid-template-columns: 1fr 1fr; }
          .up-heading-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 18px;
          }
          .up-secure { padding: 0; }
        }

        @media (max-width: 600px) {
          .dp-upload-page { padding: 0 18px; }
          .up-nav { min-height: 72px; }
          .up-brand { font-size: 18px; gap: 8px; }
          .up-brand-mark { width: 34px; height: 34px; }
          .up-nav-right { gap: 13px; }
          .up-nav-link { font-size: 12px; }
          .up-avatar { display: none; }
          .up-main { padding-top: 37px; }
          .up-heading { font-size: clamp(38px, 10vw, 51px); letter-spacing: -2px; }
          .up-subtitle { font-size: 15px; }
          .up-heading-row { margin-bottom: 27px; }
          .up-panel-head { padding: 20px 17px; }
          .up-panel-title { font-size: 17px; }
          .up-panel-kicker { font-size: 11px; }
          .up-drop { margin: 15px; padding: 24px 12px; min-height: 315px; }
          .up-drop-title { font-size: 20px; }
          .up-drop-copy { font-size: 13px; }
          .up-list { padding: 0 15px 17px; }
          .up-file { gap: 10px; padding: 13px 9px; }
          .up-file-icon { flex-basis: 39px; width: 39px; height: 42px; font-size: 10px; }
          .up-file-name { font-size: 13px; }
          .up-file-meta { font-size: 10px; }
          .up-status { font-size: 9px; }
          .up-side { grid-template-columns: 1fr; }
          .up-side-card { padding: 21px; }
          .up-footer { flex-direction: column; gap: 8px; }
        }

        @media (max-width: 390px) {
          .dp-upload-page { padding: 0 12px; }
          .up-nav-right { gap: 9px; }
          .up-nav-link { font-size: 11px; }
          .up-brand { font-size: 16px; }
          .up-panel-head { padding: 17px 12px; }
          .up-counter { font-size: 10px; }
          .up-file { flex-wrap: wrap; }
          .up-file-info { min-width: calc(100% - 65px); }
          .up-status { margin-left: 48px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .dp-upload-page *,
          .dp-upload-page *::before,
          .dp-upload-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <header className="up-nav">
        <Link to="/" className="up-brand">
          <span className="up-brand-mark">✳</span>
          DataPilot<span style={{ color: "#819078" }}>AI</span>
        </Link>

        <nav className="up-nav-right" aria-label="Main navigation">
          <Link to="/dashboard" className="up-nav-link">
            Dashboard
          </Link>
          <Link to="/explore" className="up-nav-link">
            Explore
          </Link>
          <Link to="/upload" className="up-nav-link active">
            Upload
          </Link>
          <div className="up-avatar" title="Your workspace">
            DP
          </div>
        </nav>
      </header>

      <section className="up-main">
        <div className="up-eyebrow">
          <span className="up-dot" />
          DATA WORKSPACE / INGESTION
        </div>

        <div className="up-heading-row">
          <div>
            <h1 className="up-heading">
              Bring your data.
              <br />
              <span>Find your signal.</span>
            </h1>

            <p className="up-subtitle">
              Upload your spreadsheets and datasets. DataPilot keeps
              your files in your private workspace, ready for your
              next analysis.
            </p>
          </div>

          <div className="up-secure">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
            PRIVATE WORKSPACE
          </div>
        </div>

        <div className="up-layout">
          <section className="up-panel">
            <div className="up-panel-head">
              <div>
                <h2 className="up-panel-title">Upload your files</h2>
                <div className="up-panel-kicker">
                  Step 01 — Add your source data
                </div>
              </div>
              <span className="up-counter">
                {items.length} FILES
              </span>
            </div>

            <div
              className={`up-drop ${dragging ? "dragging" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Choose or drop CSV and Excel files"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                multiple
                hidden
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />

              <div className="up-visual" aria-hidden="true">
                <div className="up-cube">
                  <div className="up-cube-face front">CSV</div>
                  <div className="up-cube-face back">XLS</div>
                  <div className="up-cube-face right">AI</div>
                  <div className="up-cube-face left">01</div>
                  <div className="up-cube-face top">+</div>
                  <div className="up-cube-face bottom">DATA</div>
                </div>
              </div>

              <h3 className="up-drop-title">
                {dragging ? "Drop your files here" : "Drop your data here"}
              </h3>

              <p className="up-drop-copy">
                Drag and drop your files, or browse your computer
                <br />
                to select one or multiple datasets.
              </p>

              <button
                type="button"
                className="up-browse"
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Browse files ↗
              </button>

              <div className="up-formats">
                <span className="up-format">.CSV</span>
                <span className="up-format">.XLS</span>
                <span className="up-format">.XLSX</span>
              </div>

              <div className="up-max">
                MAXIMUM FILE SIZE · 50 MB EACH
              </div>
            </div>

            <div className="up-list">
              <div className="up-list-top">
                <div className="up-list-label">Selected files</div>

                {items.length > 0 && (
                  <button
                    type="button"
                    className="up-clear"
                    disabled={busy}
                    onClick={() =>
                      setItems((current) =>
                        current.filter((item) =>
                          ["uploaded", "uploading"].includes(item.status)
                        )
                      )
                    }
                  >
                    Clear pending
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#647064",
                    padding: "17px 0 10px",
                    fontSize: 14,
                  }}
                >
                  Your selected files will appear here.
                </div>
              ) : (
                items.map((item) => (
                  <div className="up-file" key={item.id}>
                    <FileIcon extension={item.extension} />

                    <div className="up-file-info">
                      <div className="up-file-name" title={item.name}>
                        {item.name}
                      </div>

                      <div className="up-file-meta">
                        {formatSize(item.size)} ·{" "}
                        {item.extension?.toUpperCase()}
                      </div>

                      {["uploading", "uploaded"].includes(item.status) && (
                        <div
                          className="up-progress"
                          aria-label={`Upload progress ${item.progress}%`}
                        >
                          <div
                            className="up-progress-bar"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}

                      {item.error && (
                        <div className="up-error">{item.error}</div>
                      )}
                    </div>

                    <div className={`up-status ${item.status}`}>
                      {item.status === "ready" && "READY"}
                      {item.status === "invalid" && "INVALID"}
                      {item.status === "uploading" && "UPLOADING"}
                      {item.status === "uploaded" && "✓ SAVED"}
                      {item.status === "failed" && "FAILED"}
                    </div>

                    {!busy && item.status !== "uploaded" && (
                      <button
                        type="button"
                        className="up-remove"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}

              <button
                type="button"
                className="up-upload-btn"
                onClick={uploadFiles}
                disabled={busy || validCount === 0}
              >
                {busy
                  ? "Uploading your files…"
                  : "↑  Upload to workspace"}
              </button>

              {notice && (
                <div
                  className={`up-notice ${notice.type}`}
                  role="status"
                >
                  {notice.text}
                </div>
              )}
            </div>
          </section>

          <aside className="up-side">
            <section className="up-side-card">
              <div className="up-side-label">
                Your upload session
              </div>

              <div className="up-stat-grid">
                <div className="up-stat">
                  <div className="up-stat-number">{items.length}</div>
                  <div className="up-stat-caption">Files selected</div>
                </div>

                <div className="up-stat">
                  <div className="up-stat-number">{uploadedCount}</div>
                  <div className="up-stat-caption">Files saved</div>
                </div>

                <div className="up-stat">
                  <div className="up-stat-number">
                    {items.length ? formatSize(totalSize) : "0 B"}
                  </div>
                  <div className="up-stat-caption">Total selected</div>
                </div>

                <div className="up-stat">
                  <div className="up-stat-number">
                    50<span style={{ fontSize: 16 }}> MB</span>
                  </div>
                  <div className="up-stat-caption">Limit per file</div>
                </div>
              </div>

              <div className="up-storage-row">
                <div className="up-storage-icon">⌁</div>
                <div>
                  <div className="up-storage-title">
                    Supabase storage
                  </div>
                  <div className="up-storage-copy">
                    Files and metadata are saved to your authenticated
                    workspace.
                  </div>
                </div>
              </div>
            </section>

            <section className="up-side-card">
              <div className="up-side-label">Before you upload</div>

              <ul className="up-check-list">
                <li>
                  <span className="up-check">✓</span>
                  <span>Use CSV or Excel spreadsheet files.</span>
                </li>
                <li>
                  <span className="up-check">✓</span>
                  <span>Keep each file under 50 MB.</span>
                </li>
                <li>
                  <span className="up-check">✓</span>
                  <span>Sign in to save files to your account.</span>
                </li>
                <li>
                  <span className="up-check">✓</span>
                  <span>
                    Configure storage policies so only authorized users
                    can access their stored files.
                  </span>
                </li>
              </ul>

              <p className="up-side-note">
                Uploading stores the original file. Data parsing and AI
                analysis are separate steps.
              </p>
            </section>
          </aside>
        </div>

        <footer className="up-footer">
          <span>DATAPILOT AI · DATA WORKSPACE</span>
          <span>CSV / XLS / XLSX · SECURE UPLOAD</span>
        </footer>
      </section>
    </main>
  );
}
