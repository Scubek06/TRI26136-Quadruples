
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#f5f6f0] p-8 text-[#17211c]">
      <h1 className="text-3xl font-bold">Your DataPilot Workspace</h1>
      <p className="mt-3">Welcome! Your dashboard starts here.</p>
      <nav className="mt-6 flex flex-wrap gap-4">
        <Link className="underline" to="/explore">Explore data</Link>
        <Link className="underline" to="/upload">Upload CSV</Link>
      </nav>
    </main>
  );
}
