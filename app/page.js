"use client";

import { useState } from "react";
import Discover from "@/components/Discover";
import TabBar from "@/components/TabBar";

export default function App() {
  const [tab, setTab] = useState("discover");
  return (
    <div className="shell">
      <main className="screen">
        {/* Home is intentionally blank: it stands in for Coy's existing experience. */}
        {tab === "home" ? <section className="home" aria-label="Home" /> : <Discover />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
