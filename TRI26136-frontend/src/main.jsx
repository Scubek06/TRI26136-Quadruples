
import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import App from "./App.jsx";
import Login from "./Pages/Login.jsx";
import ProtectedRoute from "./Pages/ProtectedRoute.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import Explore from "./Pages/Explore.jsx";
import Upload from "./Pages/Upload.jsx";
import "./index.css";

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>{children}</ProtectedRoute>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<ProtectedPage><Dashboard /></ProtectedPage>}
        />
        <Route
          path="/explore"
          element={<ProtectedPage><Explore /></ProtectedPage>}
        />
        <Route
          path="/upload"
          element={<ProtectedPage><Upload /></ProtectedPage>}
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
