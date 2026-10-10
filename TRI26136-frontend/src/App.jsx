
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const starterFiles = [
  { name: "customer_behavior.csv", rows: "24,580", status: "Ready" },
  { name: "quarterly_sales.csv", rows: "12,840", status: "Ready" },
  { name: "marketing_campaign.csv", rows: "8,320", status: "Processing" },
];

const features = [
  {
    number: "01",
    symbol: "◈",
    title: "Understand your data",
    description:
      "Explore unfamiliar datasets with clean previews, useful summaries, and quality checks that make the next step obvious.",
  },
  {
    number: "02",
    symbol: "⌁",
    title: "See the bigger picture",
    description:
      "Turn rows and columns into visual patterns that help you understand what is changing and where to look closer.",
  },
  {
    number: "03",
    symbol: "✳",
    title: "Move from data to insight",
    description:
      "Build toward AI-assisted explanations that make findings easier to understand, share, and act on.",
  },
];

function ArrowIcon() {
  return <span aria-hidden="true" className="dp-arrow">↗</span>;
}

export default function App() {
  const navigate = useNavigate();

  const [files, setFiles] = useState(starterFiles);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);

  // Send users to login before opening protected features.
  // The intended destination is passed to the login page.
  function openFeature(path) {
    const isAuthenticated =
      localStorage.getItem("datapilot_authenticated") === "true";

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: { pathname: path } },
      });
      return;
    }

    navigate(path);
  }

  const filteredFiles = useMemo(
    () =>
      files.filter((file) =>
        file.name.toLowerCase().includes(search.toLowerCase())
      ),
    [files, search]
  );

  function uploadFiles(event) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const csvFiles = selected.filter((file) =>
      file.name.toLowerCase().endsWith(".csv")
    );

    if (!csvFiles.length) {
      setNotice("Please select a CSV file.");
      event.target.value = "";
      return;
    }

    setFiles((current) => {
      const additions = csvFiles
        .filter((file) => !current.some((item) => item.name === file.name))
        .map((file) => ({
          name: file.name,
          rows: "Pending",
          status: "Uploaded",
        }));

      return [...additions, ...current];
    });

    setNotice(
      `${csvFiles.length} CSV file${csvFiles.length === 1 ? "" : "s"} added to this session.`
    );

    document.getElementById("workspace")?.scrollIntoView({
      behavior: "smooth",
    });

    event.target.value = "";
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <main className="dp-site">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
        .dp-site {
          --paper:#f5f6f0; --white:#fff; --ink:#17211c; --muted:#70776f;
          --line:#dfe3d8; --lime:#d7ff55; --green:#a5cc3b; --dark:#15201b;
          --mono:'DM Mono',monospace;
          min-width:320px; overflow:hidden; background:var(--paper); color:var(--ink);
          font-family:'Manrope','Segoe UI',sans-serif; font-size:16px; line-height:1.65;
          -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
        }
        .dp-site * { box-sizing:border-box; }
        .dp-site a { color:inherit; text-decoration:none; }
        .dp-site button,.dp-site input { font:inherit; }
        .dp-site button { border:0; cursor:pointer; -webkit-tap-highlight-color:transparent; }
        .dp-site button:focus-visible,.dp-site a:focus-visible,.dp-site input:focus-visible { outline:2px solid #719d22; outline-offset:4px; }
        .dp-wrap { width:min(1320px,calc(100% - 100px)); margin-inline:auto; }
        .dp-hidden { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; clip-path:inset(50%); }
        .dp-topbar { position:relative; z-index:5; display:flex; min-height:82px; align-items:center; justify-content:space-between; gap:24px; padding:0 max(50px,calc((100vw - 1320px)/2)); border-bottom:1px solid rgba(23,33,28,.09); background:rgba(245,246,240,.93); }
        .dp-brand { display:inline-flex; align-items:center; gap:10px; color:var(--ink); font-size:20px; font-weight:800; letter-spacing:-1.1px; white-space:nowrap; }
        .dp-brand-light { font-weight:500; }
        .dp-brand sup { margin-left:2px; color:#66852b; font-family:var(--mono); font-size:11px; letter-spacing:0; vertical-align:top; }
        .dp-brand-mark { position:relative; display:grid; width:30px; height:30px; place-items:center; transform:rotate(-12deg); border-radius:9px; background:var(--lime); }
        .dp-brand-mark:before,.dp-brand-mark:after,.dp-brand-mark span { position:absolute; display:block; width:13px; height:13px; border:1.5px solid var(--ink); content:""; }
        .dp-brand-mark:before { transform:translate(-3px,-2px); }
        .dp-brand-mark:after { transform:translate(2px,3px); }
        .dp-brand-mark span { width:5px; height:5px; border:0; background:var(--ink); }
        .dp-navlinks { display:flex; align-items:center; gap:clamp(20px,3.2vw,48px); }
        .dp-navlinks a { color:#4e5a50; font-size:14px; font-weight:700; transition:color 180ms ease; }
        .dp-navlinks a:hover { color:#161e18; }
        .dp-cta,.dp-button,.dp-button-dark { display:inline-flex; min-height:46px; align-items:center; justify-content:center; gap:18px; padding:0 19px; border-radius:5px; background:var(--dark); color:#fff; font-size:14px; font-weight:700; transition:background 180ms ease,transform 180ms ease; }
        .dp-cta:hover,.dp-button:hover { transform:translateY(-2px); background:#304333; }
        .dp-arrow { display:inline-block; font-size:18px; font-weight:400; line-height:1; transition:transform 180ms ease; }
        .dp-site button:hover .dp-arrow { transform:translate(2px,-2px); }
        .dp-hero { position:relative; display:grid; min-height:690px; grid-template-columns:1fr .95fr; align-items:center; gap:24px; padding-top:58px; padding-bottom:85px; }
        .dp-hero-copy { position:relative; z-index:2; padding-bottom:15px; }
        .dp-eyebrow { display:flex; align-items:center; gap:9px; color:#46553f; font-family:var(--mono); font-size:12px; font-weight:500; letter-spacing:1.2px; line-height:1.8; text-transform:uppercase; }
        .dp-dot { width:7px; height:7px; flex:0 0 auto; border-radius:50%; background:#91b52d; box-shadow:0 0 0 3px rgba(145,181,45,.14); }
        .dp-hero h1 { margin:30px 0 24px; font-size:clamp(52px,6.1vw,86px); font-weight:600; letter-spacing:-6px; line-height:.99; }
        .dp-hero h1 .dp-muted { color:#7a8277; }
        .dp-accent { color:#71942a; }
        .dp-description { max-width:465px; margin:0; color:#465148; font-size:16px; line-height:1.9; }
        .dp-hero-actions { display:flex; flex-wrap:wrap; align-items:center; gap:23px; margin-top:30px; }
        .dp-hero-actions .dp-button { min-height:52px; padding-inline:21px; }
        .dp-quiet { display:inline-flex; align-items:center; gap:10px; padding:10px 0; background:transparent; color:#465148; font-size:14px; font-weight:700; }
        .dp-quiet span { font-size:18px; }
        .dp-quiet:hover { color:#1b271c; }
        .dp-footnote { display:flex; align-items:center; gap:8px; margin-top:36px; color:#515b50; font-size:13px; }
        .dp-check { display:grid; width:19px; height:19px; place-items:center; border:1px solid #cbd8ad; border-radius:50%; color:#658425; font-size:12px; }
        .dp-art { position:relative; min-width:0; height:500px; isolation:isolate; perspective:1100px; }
        .dp-art-grid { position:absolute; inset:6% -8% 2% -4%; z-index:-2; background-image:linear-gradient(rgba(92,111,75,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(92,111,75,.11) 1px,transparent 1px); background-position:center; background-size:30px 30px; mask-image:radial-gradient(ellipse at center,#000 8%,transparent 70%); transform:rotate(-14deg) skewY(4deg); }
        .dp-art:before { position:absolute; top:50%; left:50%; z-index:-1; width:350px; height:350px; border-radius:50%; background:rgba(205,231,133,.24); content:""; filter:blur(50px); transform:translate(-50%,-50%); }
        .dp-orbit { position:absolute; top:50%; left:50%; width:345px; height:345px; border:1px solid rgba(92,111,75,.24); border-radius:50%; transform:translate(-50%,-50%) rotateX(65deg) rotateZ(-25deg); }
        .dp-orbit-two { width:430px; height:430px; border-color:rgba(92,111,75,.13); transform:translate(-50%,-50%) rotateX(65deg) rotateZ(30deg); }
        .dp-orbit-three { width:250px; height:250px; border-style:dashed; border-color:rgba(92,111,75,.18); transform:translate(-50%,-50%) rotateX(67deg) rotateZ(75deg); }
        .dp-cube { position:absolute; top:50%; left:50%; width:172px; height:172px; transform:translate(-50%,-52%) rotateX(-24deg) rotateY(-35deg); transform-style:preserve-3d; animation:dp-cube-float 7s ease-in-out infinite; }
        .dp-cube-face { position:absolute; display:flex; width:172px; height:172px; flex-direction:column; justify-content:space-between; overflow:hidden; border:1px solid rgba(255,255,255,.8); backface-visibility:visible; }
        .dp-cube-front { padding:18px; background:linear-gradient(135deg,rgba(255,255,255,.15),transparent 60%),#d8fa68; box-shadow:inset 0 0 30px rgba(255,255,255,.25); transform:translateZ(86px); }
        .dp-cube-back { background:#8da947; transform:rotateY(180deg) translateZ(86px); }
        .dp-cube-right { background:linear-gradient(145deg,#6f853e,#354a2d); transform:rotateY(90deg) translateZ(86px); }
        .dp-cube-left { background:#c1df70; transform:rotateY(-90deg) translateZ(86px); }
        .dp-cube-top { background:linear-gradient(135deg,#efffc0,#bfe95a); transform:rotateX(90deg) translateZ(86px); }
        .dp-cube-bottom { background:#687f37; transform:rotateX(-90deg) translateZ(86px); }
        .dp-cube-label,.dp-cube-index { color:#344522; font-family:var(--mono); font-size:12px; letter-spacing:1.5px; }
        .dp-cube-bars { display:flex; height:72px; align-items:end; gap:7px; }
        .dp-cube-bars i { width:20px; border:1px solid rgba(49,70,28,.24); background:rgba(255,255,255,.48); }
        .dp-cube-bars i:nth-child(1) { height:32%; } .dp-cube-bars i:nth-child(2) { height:66%; } .dp-cube-bars i:nth-child(3) { height:46%; } .dp-cube-bars i:nth-child(4) { height:100%; background:#f7ffe1; } .dp-cube-bars i:nth-child(5) { height:78%; }
        .dp-float-card { position:absolute; z-index:2; border:1px solid rgba(255,255,255,.88); background:rgba(255,255,252,.86); color:#26352c; box-shadow:0 18px 55px rgba(51,62,35,.1); backdrop-filter:blur(15px); }
        .dp-quality { top:74px; right:0; width:185px; padding:16px; border-radius:8px; animation:dp-card-float 6s ease-in-out infinite; }
        .dp-float-top { display:flex; align-items:center; gap:8px; color:#46513f; font-family:var(--mono); font-size:11px; letter-spacing:.6px; }
        .dp-mini-symbol { display:grid; width:23px; height:23px; place-items:center; border-radius:5px; background:#edf5d8; color:#69852e; font-size:14px; }
        .dp-quality-number { margin-top:15px; font-size:34px; font-weight:600; letter-spacing:-2px; line-height:1.2; }
        .dp-quality-number span { margin-left:2px; color:#718a40; font-size:17px; }
        .dp-quality-track { height:4px; margin-top:12px; overflow:hidden; border-radius:5px; background:#e7e9e1; }
        .dp-quality-track span { display:block; width:98.4%; height:100%; border-radius:inherit; background:#9dbd42; }
        .dp-float-caption { margin-top:9px; color:#505b4c; font-size:12px; line-height:1.6; }
        .dp-insight { bottom:68px; left:-7px; display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:7px; animation:dp-card-float 7s ease-in-out -2s infinite; }
        .dp-insight-icon { display:grid; width:37px; height:37px; place-items:center; border-radius:7px; background:#1a271b; color:var(--lime); font-size:19px; }
        .dp-insight-title { font-size:14px; font-weight:800; white-space:nowrap; }
        .dp-insight-caption { margin-top:4px; color:#505b4c; font-size:12px; }
        .dp-art-caption { position:absolute; right:0; bottom:10px; left:0; display:flex; justify-content:space-between; gap:12px; color:#59664f; font-family:var(--mono); font-size:10px; letter-spacing:1px; }
        .dp-bottomline { position:absolute; right:0; bottom:23px; left:0; display:flex; align-items:center; justify-content:space-between; gap:20px; padding-top:18px; border-top:1px solid var(--line); color:#59644f; font-family:var(--mono); font-size:10px; letter-spacing:1.2px; }
        .dp-bottom-symbol { color:#78982f; font-size:19px; }
        .dp-proof { border-block:1px solid var(--line); background:#eef0e7; }
        .dp-proof-inner { display:flex; min-height:77px; align-items:center; justify-content:space-between; gap:24px; width:min(1320px,calc(100% - 100px)); margin-inline:auto; }
        .dp-proof p { margin:0; color:#53604d; font-family:var(--mono); font-size:11px; letter-spacing:1px; }
        .dp-proof p:nth-child(2) { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:14px; color:#303b30; font-family:'Manrope',sans-serif; font-size:14px; font-weight:800; letter-spacing:0; }
        .dp-proof b { color:#8ba44d; font-size:17px; font-weight:400; }
        .dp-platform { padding-top:125px; padding-bottom:125px; }
        .dp-section-intro { display:grid; grid-template-columns:1.2fr .65fr; align-items:end; gap:70px; }
        .dp-section-intro h2,.dp-workflow-copy h2,.dp-workspace-heading h2 { margin:23px 0 0; font-size:clamp(36px,4.4vw,57px); font-weight:600; letter-spacing:-3.1px; line-height:1.12; }
        .dp-section-intro h2 span,.dp-workspace-heading h2 span { color:#7c8679; }
        .dp-section-intro>p { max-width:420px; margin:0 0 4px; color:#4e5a50; font-size:15px; line-height:1.9; }
        .dp-feature-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:15px; margin-top:54px; }
        .dp-feature-card { display:flex; min-height:245px; flex-direction:column; padding:24px; border:1px solid #e0e4d9; border-radius:5px; background:rgba(255,255,255,.48); transition:transform 220ms ease,border-color 220ms ease,background 220ms ease; }
        .dp-feature-card:hover { transform:translateY(-5px); border-color:#c5d69a; background:#fff; }
        .dp-feature-top { display:flex; align-items:center; justify-content:space-between; }
        .dp-feature-number { color:#53604e; font-family:var(--mono); font-size:12px; letter-spacing:1px; }
        .dp-feature-symbol { display:grid; width:39px; height:39px; place-items:center; border:1px solid #e0e7d0; border-radius:7px; background:#eff4e3; color:#708b36; font-size:22px; }
        .dp-feature-card h3 { margin:31px 0 10px; font-size:20px; font-weight:800; letter-spacing:-.6px; line-height:1.35; }
        .dp-feature-card p { margin:0; color:#465148; font-size:15px; line-height:1.8; }
        .dp-feature-rule { height:2px; margin-top:auto; padding-top:20px; }
        .dp-feature-rule span { display:block; width:32px; height:2px; background:#b1cf5c; transition:width 220ms ease; }
        .dp-feature-card:hover .dp-feature-rule span { width:70px; }
        .dp-workflow { position:relative; overflow:hidden; background:#e9ede2; }
        .dp-workflow:before { position:absolute; top:-240px; right:-180px; width:520px; height:520px; border:1px solid rgba(91,113,69,.12); border-radius:50%; box-shadow:0 0 0 55px rgba(91,113,69,.025),0 0 0 110px rgba(91,113,69,.025); content:""; }
        .dp-workflow-inner { position:relative; display:grid; grid-template-columns:.85fr 1fr; gap:100px; padding-top:105px; padding-bottom:105px; }
        .dp-workflow-copy h2 { font-size:clamp(36px,4.2vw,54px); }
        .dp-workflow-copy h2 span { color:#718c35; }
        .dp-workflow-copy>p { max-width:400px; margin:22px 0 27px; color:#465148; font-size:15px; line-height:1.9; }
        .dp-workflow-steps { border-top:1px solid #cfd7c7; }
        .dp-workflow-step { display:grid; grid-template-columns:42px 1fr 24px; align-items:start; gap:18px; padding:23px 0; border-bottom:1px solid #cfd7c7; }
        .dp-step-index { padding-top:2px; color:#647c36; font-family:var(--mono); font-size:12px; }
        .dp-workflow-step h3 { margin:0; font-size:17px; font-weight:800; }
        .dp-workflow-step p { margin:8px 0 0; color:#465148; font-size:14px; line-height:1.8; }
        .dp-step-mark { color:#718c35; font-size:19px; }
        .dp-workspace { padding-top:115px; padding-bottom:120px; }
        .dp-workspace-heading { display:flex; align-items:end; justify-content:space-between; gap:28px; }
        .dp-workspace-heading h2 { font-size:clamp(35px,4vw,50px); }
        .dp-workspace-heading>div>p { margin:14px 0 0; color:#465148; font-size:15px; }
        .dp-workspace-heading .dp-button { flex:0 0 auto; }
        .dp-notice { display:flex; align-items:center; justify-content:space-between; gap:15px; margin-top:25px; padding:14px 17px; border:1px solid #d6e2b7; border-radius:5px; background:#edf4dd; color:#465b27; font-size:14px; }
        .dp-notice button { background:transparent; color:inherit; font-size:22px; }
        .dp-dataset-panel { margin-top:40px; border:1px solid #e0e4da; border-radius:5px; background:rgba(255,255,255,.63); }
        .dp-dataset-head { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:23px 25px; border-bottom:1px solid #e6e9e1; }
        .dp-dataset-head h3 { margin:0; font-size:18px; font-weight:800; }
        .dp-dataset-head h3 span { margin-left:5px; color:#65705f; font-family:var(--mono); font-size:13px; font-weight:400; }
        .dp-dataset-head p { margin:6px 0 0; color:#535e50; font-size:13px; }
        .dp-search { display:flex; min-width:220px; align-items:center; gap:9px; padding:10px 12px; border:1px solid #e0e4da; border-radius:4px; background:#fbfcf8; color:#65705f; }
        .dp-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--ink); font-size:14px; }
        .dp-search input::placeholder { color:#737d70; }
        .dp-dataset-row { display:grid; grid-template-columns:minmax(0,1.8fr) minmax(80px,.5fr) minmax(110px,.55fr); align-items:center; gap:15px; min-height:68px; padding:12px 25px; border-bottom:1px solid #eaede6; font-size:14px; }
        .dp-dataset-row:last-child { border-bottom:0; }
        .dp-dataset-labels { min-height:43px; background:#f8f9f4; color:#53604d; font-family:var(--mono); font-size:12px; letter-spacing:.7px; }
        .dp-dataset-name { display:flex; min-width:0; align-items:center; gap:12px; font-weight:800; overflow-wrap:anywhere; }
        .dp-file-icon { display:grid; width:33px; height:35px; flex:0 0 auto; place-items:center; border:1px solid #dce7c8; border-radius:4px; background:#f0f6e4; color:#718d3b; font-family:var(--mono); font-size:10px; }
        .dp-dataset-rows { color:#465148; font-family:var(--mono); font-size:13px; }
        .dp-status { display:inline-flex; width:fit-content; align-items:center; gap:7px; padding:6px 9px; border-radius:3px; background:#eef5e1; color:#536d28; font-size:12px; font-weight:800; line-height:1.5; }
        .dp-status i { width:6px; height:6px; border-radius:50%; background:currentColor; }
        .dp-status-processing { background:#f7f0db; color:#80651d; }
        .dp-status-uploaded { background:#e9eefb; color:#435b95; }
        .dp-empty { padding:38px 20px; color:#465148; text-align:center; font-size:14px; }
        .dp-dataset-note { display:flex; align-items:flex-start; gap:9px; padding:15px 25px; border-top:1px solid #e6e9e1; color:#505b4c; font-size:12px; line-height:1.8; }
        .dp-dataset-note span { color:#718c35; }
        .dp-closing { position:relative; display:grid; min-height:370px; place-items:center; overflow:hidden; background:var(--lime); }
        .dp-closing-content { position:relative; z-index:1; width:min(1320px,calc(100% - 100px)); padding-block:75px; text-align:center; }
        .dp-closing-content .dp-eyebrow { justify-content:center; color:#344725; }
        .dp-closing-content h2 { margin:22px 0 27px; font-size:clamp(36px,5vw,65px); font-weight:600; letter-spacing:-3.5px; line-height:1.1; }
        .dp-closing-content h2 span { color:#5b722e; }
        .dp-button-dark { min-height:49px; padding-inline:22px; background:#17211c; }
        .dp-button-dark:hover { transform:translateY(-2px); background:#34452f; }
        .dp-closing-shape { position:absolute; top:50%; left:50%; width:400px; height:300px; pointer-events:none; transform:translate(-50%,-50%); }
        .dp-closing-shape div { position:absolute; top:50%; left:50%; width:260px; height:150px; border:1px solid rgba(44,69,29,.12); transform:translate(-50%,-50%) rotate(-35deg) skewX(25deg); }
        .dp-closing-shape div:nth-child(2) { transform:translate(-50%,-50%) rotate(35deg) skewX(-25deg); }
        .dp-closing-shape div:nth-child(3) { width:180px; height:180px; transform:translate(-50%,-50%) rotate(45deg); }
        .dp-footer { display:grid; min-height:100px; grid-template-columns:auto 1fr auto; align-items:center; gap:20px; }
        .dp-footer>p { margin:0 0 0 25px; color:#4f5a4c; font-size:13px; }
        .dp-footer> a:nth-of-type(2) { color:#4f5c49; font-family:var(--mono); font-size:11px; letter-spacing:1px; }
        .dp-copyright { grid-column:1/-1; padding:14px 0 19px; border-top:1px solid var(--line); color:#58634f; font-family:var(--mono); font-size:11px; letter-spacing:1px; }
        @keyframes dp-cube-float { 0%,100% { transform:translate(-50%,-52%) rotateX(-24deg) rotateY(-35deg) translateY(0); } 50% { transform:translate(-50%,-52%) rotateX(-19deg) rotateY(-25deg) translateY(-12px); } }
        @keyframes dp-card-float { 0%,100% { translate:0 0; } 50% { translate:0 -8px; } }
        @media (min-width:1500px) { .dp-hero { min-height:740px; } .dp-art { height:550px; } }
        @media (max-width:1050px) {
          .dp-wrap,.dp-proof-inner,.dp-closing-content { width:calc(100% - 60px); }
          .dp-topbar { padding-inline:30px; }
          .dp-hero { min-height:610px; grid-template-columns:1fr .85fr; }
          .dp-hero h1 { font-size:clamp(48px,6.5vw,69px); letter-spacing:-4px; }
          .dp-art { height:430px; }
          .dp-cube { transform:translate(-50%,-52%) scale(.83) rotateX(-24deg) rotateY(-35deg); }
          .dp-orbit { width:290px; height:290px; } .dp-orbit-two { width:365px; height:365px; }
          .dp-quality { right:-3px; transform:scale(.9); transform-origin:right top; }
          .dp-insight { left:-6px; transform:scale(.9); transform-origin:left bottom; }
          .dp-workflow-inner { gap:50px; }
        }
        @media (max-width:760px) {
          .dp-wrap,.dp-proof-inner,.dp-closing-content { width:calc(100% - 40px); }
          .dp-topbar { min-height:72px; padding-inline:20px; }
          .dp-brand { font-size:18px; }
          .dp-navlinks { display:none; }
          .dp-cta { min-height:40px; gap:8px; padding-inline:12px; font-size:13px; }
          .dp-hero { min-height:auto; grid-template-columns:1fr; gap:0; padding-top:60px; padding-bottom:80px; }
          .dp-hero h1 { margin-top:24px; font-size:clamp(50px,10.7vw,76px); letter-spacing:-4px; }
          .dp-description { max-width:520px; font-size:15px; }
          .dp-footnote { margin-top:28px; }
          .dp-art { height:405px; margin-top:20px; }
          .dp-cube { transform:translate(-50%,-52%) scale(.8) rotateX(-24deg) rotateY(-35deg); }
          .dp-quality { top:40px; right:2px; }
          .dp-insight { bottom:55px; left:0; }
          .dp-bottomline { bottom:23px; font-size:9px; letter-spacing:.8px; }
          .dp-proof-inner { min-height:90px; flex-wrap:wrap; justify-content:center; gap:12px 20px; padding-block:20px; }
          .dp-proof .dp-proof-right { display:none; }
          .dp-proof p:nth-child(2) { gap:9px; font-size:12px; }
          .dp-platform { padding-top:80px; padding-bottom:80px; }
          .dp-section-intro { grid-template-columns:1fr; gap:22px; }
          .dp-section-intro h2,.dp-workflow-copy h2,.dp-workspace-heading h2 { font-size:clamp(36px,8vw,52px); letter-spacing:-2.5px; }
          .dp-section-intro>p { max-width:540px; }
          .dp-feature-grid { grid-template-columns:1fr; gap:10px; margin-top:35px; }
          .dp-feature-card { min-height:210px; }
          .dp-feature-card h3 { margin-top:23px; }
          .dp-workflow-inner { grid-template-columns:1fr; gap:45px; padding-top:80px; padding-bottom:80px; }
          .dp-workflow-copy>p { max-width:500px; }
          .dp-workspace { padding-top:80px; padding-bottom:80px; }
          .dp-workspace-heading { align-items:flex-start; flex-direction:column; }
          .dp-dataset-head { align-items:stretch; flex-direction:column; padding:20px; }
          .dp-search { min-width:0; }
          .dp-dataset-row { grid-template-columns:minmax(0,1.6fr) 65px 85px; gap:8px; padding-inline:15px; font-size:12px; }
          .dp-dataset-labels { font-size:10px; }
          .dp-dataset-name { gap:8px; overflow-wrap:anywhere; }
          .dp-file-icon { width:29px; height:31px; }
          .dp-dataset-note { padding-inline:15px; }
          .dp-closing { min-height:320px; }
          .dp-closing-content { padding-block:65px; }
          .dp-closing-content h2 { font-size:clamp(35px,8vw,54px); letter-spacing:-2.5px; }
          .dp-footer { grid-template-columns:1fr auto; gap:15px; padding-top:24px; }
          .dp-footer>p { display:none; }
          .dp-copyright { margin-top:5px; }
        }
        @media (max-width:400px) {
          .dp-wrap,.dp-proof-inner,.dp-closing-content { width:calc(100% - 30px); }
          .dp-topbar { padding-inline:15px; }
          .dp-hero h1 { font-size:47px; letter-spacing:-3.5px; }
          .dp-hero-actions { align-items:flex-start; flex-direction:column; gap:12px; }
          .dp-art { height:345px; }
          .dp-cube { transform:translate(-50%,-52%) scale(.65) rotateX(-24deg) rotateY(-35deg); }
          .dp-orbit { width:235px; height:235px; } .dp-orbit-two { width:295px; height:295px; }
          .dp-quality { top:23px; transform:scale(.76); }
          .dp-insight { bottom:40px; transform:scale(.78); }
          .dp-art-caption { font-size:9px; }
          .dp-bottomline { gap:8px; font-size:8px; }
          .dp-dataset-row { grid-template-columns:minmax(0,1fr) 50px 76px; gap:6px; padding-inline:10px; font-size:11px; }
          .dp-dataset-labels { font-size:9px; }
          .dp-status { gap:4px; padding:5px; font-size:10px; }
        }
        @media (prefers-reduced-motion:reduce) {
          .dp-site *, .dp-site *:before, .dp-site *:after { scroll-behavior:auto!important; animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; }
        }
      `}</style>

      <input
        ref={fileInput}
        className="dp-hidden"
        type="file"
        accept=".csv,text/csv"
        multiple
        onChange={uploadFiles}
      />

      <nav className="dp-topbar">
        <a className="dp-brand" href="#home" aria-label="DataPilot AI home">
          <span className="dp-brand-mark"><span /></span>
          <span>data<span className="dp-brand-light">pilot</span><sup>AI</sup></span>
        </a>

        <div className="dp-navlinks">
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <a href="#workspace">Your workspace</a>
        </div>

        <Link
          to="/login"
          className="group inline-flex min-h-[43px] items-center gap-3 rounded-[5px] bg-[#17291d] px-4 text-sm font-bold !text-white transition hover:-translate-y-0.5 hover:bg-[#304333] sm:px-5"
        >
          Get started <ArrowIcon />
        </Link>
      </nav>

      <section id="home" className="dp-hero dp-wrap">
        <div className="dp-hero-copy">
          <div className="dp-eyebrow"><span className="dp-dot" /> A clearer way to work with data</div>
          <h1>Data has a story.<br /><span className="dp-muted">Find your</span><br /><span className="dp-accent">next insight.</span></h1>
          <p className="dp-description">Meet your new data workspace. Bring your datasets in, make sense of the numbers, and move from raw information to clearer decisions.</p>

          <div className="dp-hero-actions">
            <button
              className="dp-button"
              onClick={() => openFeature("/explore")}
            >
              Explore your data <ArrowIcon />
            </button>
            <button className="dp-quiet" onClick={() => scrollTo("platform")}>
              Discover the platform <span>↓</span>
            </button>
          </div>

          <div className="dp-footnote"><span className="dp-check">✓</span> Built for curious minds and data-driven teams</div>
        </div>

        <div className="dp-art" aria-label="Abstract three-dimensional data visualization">
          <div className="dp-art-grid" />
          <div className="dp-orbit dp-orbit-one" />
          <div className="dp-orbit dp-orbit-two" />
          <div className="dp-orbit dp-orbit-three" />
          <div className="dp-cube">
            <div className="dp-cube-face dp-cube-front">
              <span className="dp-cube-label">DATA</span>
              <div className="dp-cube-bars"><i /><i /><i /><i /><i /></div>
              <span className="dp-cube-index">01 — 05</span>
            </div>
            <div className="dp-cube-face dp-cube-back" />
            <div className="dp-cube-face dp-cube-right" />
            <div className="dp-cube-face dp-cube-left" />
            <div className="dp-cube-face dp-cube-top" />
            <div className="dp-cube-face dp-cube-bottom" />
          </div>

          <div className="dp-float-card dp-quality">
            <div className="dp-float-top"><span className="dp-mini-symbol">◉</span><span>DATA QUALITY</span></div>
            <div className="dp-quality-number">98.4<span>%</span></div>
            <div className="dp-quality-track"><span /></div>
            <div className="dp-float-caption">A clearer picture starts here</div>
          </div>

          <div className="dp-float-card dp-insight">
            <div className="dp-insight-icon">✳</div>
            <div>
              <div className="dp-insight-title">Patterns, revealed.</div>
              <div className="dp-insight-caption">From complexity to clarity</div>
            </div>
          </div>

          <div className="dp-art-caption"><span>FIG. 001</span><span>THE SHAPE OF YOUR DATA</span></div>
        </div>

        <div className="dp-bottomline"><span>LESS GUESSWORK.</span><span>MORE UNDERSTANDING.</span><span className="dp-bottom-symbol">✳</span></div>
      </section>

      <section className="dp-proof">
        <div className="dp-proof-inner">
          <p>ONE WORKSPACE.</p>
          <p><span>Raw data</span><b>→</b><span>Clear context</span><b>→</b><span>Better questions</span></p>
          <p className="dp-proof-right">YOUR NEXT MOVE STARTS HERE.</p>
        </div>
      </section>

      <section id="platform" className="dp-platform dp-wrap">
        <div className="dp-section-intro">
          <div>
            <div className="dp-eyebrow"><span className="dp-dot" /> THE PLATFORM</div>
            <h2>Less time decoding.<br /><span>More time discovering.</span></h2>
          </div>
          <p>Data work should feel less like navigating a maze and more like seeing the shape of a problem. DataPilot brings the essential steps together in one thoughtful workspace.</p>
        </div>

        <div className="dp-feature-grid">
          {features.map((feature) => (
            <article className="dp-feature-card" key={feature.number}>
              <div className="dp-feature-top">
                <span className="dp-feature-number">{feature.number} / 03</span>
                <span className="dp-feature-symbol">{feature.symbol}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="dp-feature-rule"><span /></div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="dp-workflow">
        <div className="dp-wrap dp-workflow-inner">
          <div className="dp-workflow-copy">
            <div className="dp-eyebrow"><span className="dp-dot" /> A SIMPLE WORKFLOW</div>
            <h2>From first upload<br />to <span>fresh perspective.</span></h2>
            <p>Start with the files you already have. Build a better understanding of what is inside them. Keep the path from question to insight simple.</p>
            <button
              className="dp-button"
              onClick={() => openFeature("/upload")}
            >
              Bring in a dataset <ArrowIcon />
            </button>
          </div>

          <div className="dp-workflow-steps">
            <div className="dp-workflow-step"><div className="dp-step-index">01</div><div><h3>Bring it in</h3><p>Choose a CSV file and add it to your workspace.</p></div><span className="dp-step-mark">↗</span></div>
            <div className="dp-workflow-step"><div className="dp-step-index">02</div><div><h3>Make sense of it</h3><p>Prepare to inspect the structure, quality, and patterns.</p></div><span className="dp-step-mark">⌁</span></div>
            <div className="dp-workflow-step"><div className="dp-step-index">03</div><div><h3>Find the signal</h3><p>Build toward useful visual analysis and AI-assisted insights.</p></div><span className="dp-step-mark">✳</span></div>
          </div>
        </div>
      </section>

      <section id="workspace" className="dp-workspace dp-wrap">
        <div className="dp-workspace-heading">
          <div>
            <div className="dp-eyebrow"><span className="dp-dot" /> YOUR WORKSPACE</div>
            <h2>Your data, <span>all in one place.</span></h2>
            <p>Try the file picker to add CSV files to this session.</p>
          </div>

          <button
            className="dp-button"
            onClick={() => openFeature("/upload")}
          >
            + Upload CSV
          </button>
        </div>

        {notice && (
          <div className="dp-notice" role="status">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
          </div>
        )}

        <div className="dp-dataset-panel">
          <div className="dp-dataset-head">
            <div>
              <h3>Recent datasets <span>{files.length}</span></h3>
              <p>Files in this browser session</p>
            </div>
            <label className="dp-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a dataset"
                aria-label="Search datasets"
              />
            </label>
          </div>

          <div className="dp-dataset-list">
            <div className="dp-dataset-row dp-dataset-labels">
              <span>FILE NAME</span><span>ROWS</span><span>STATUS</span>
            </div>

            {filteredFiles.map((file) => (
              <div className="dp-dataset-row" key={file.name}>
                <div className="dp-dataset-name">
                  <span className="dp-file-icon">CSV</span>
                  <span>{file.name}</span>
                </div>
                <span className="dp-dataset-rows">{file.rows}</span>
                <span className={`dp-status dp-status-${file.status.toLowerCase()}`}>
                  <i />{file.status}
                </span>
              </div>
            ))}

            {filteredFiles.length === 0 && (
              <div className="dp-empty">No datasets match that search.</div>
            )}
          </div>

          <div className="dp-dataset-note">
            <span>ⓘ</span> Demo files use sample metadata. Uploaded files are listed locally and are not yet saved to a server.
          </div>
        </div>
      </section>

      <section className="dp-closing">
        <div className="dp-closing-shape" aria-hidden="true"><div /><div /><div /></div>
        <div className="dp-closing-content">
          <div className="dp-eyebrow"><span className="dp-dot" /> START WITH WHAT YOU HAVE</div>
          <h2>Your next insight<br /><span>is waiting in the data.</span></h2>
          <button
            className="dp-button-dark"
            onClick={() => openFeature("/explore")}
          >
            Start exploring <ArrowIcon />
          </button>
        </div>
      </section>

      <footer className="dp-footer dp-wrap">
        <a className="dp-brand" href="#home">
          <span className="dp-brand-mark"><span /></span>
          <span>data<span className="dp-brand-light">pilot</span><sup>AI</sup></span>
        </a>
        <p>Clarity in every column.</p>
        <a href="#home">BACK TO TOP ↑</a>
        <span className="dp-copyright">© 2026 DATAPILOT AI · HACKATHON MVP</span>
      </footer>
    </main>
  );
}
