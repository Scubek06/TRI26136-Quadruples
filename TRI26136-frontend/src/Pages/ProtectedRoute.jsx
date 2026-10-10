
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          console.error("Session check failed:", error.message);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(Boolean(data.session?.user));
        }
      } catch (error) {
        if (!active) return;

        console.error("Unable to check session:", error);
        setIsAuthenticated(false);
      } finally {
        if (active) {
          setSessionChecked(true);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setIsAuthenticated(Boolean(session?.user));
      setSessionChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Wait until Supabase has checked the session.
  if (!sessionChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f0] text-[#17211c]">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#dfe4d8] border-t-[#547525]"
            aria-label="Loading"
          />
          <p className="text-sm font-medium">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  // Preserve the destination so login can return the user there.
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // An authenticated user can access the requested page.
  return children;
}
