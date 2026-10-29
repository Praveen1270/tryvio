"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /project/new is a legacy entry point — always land on Home so the
// user describes the project before anything is created.
export default function NewProjectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center bg-white">
      <p className="text-sm text-[#666666]">Opening home…</p>
    </div>
  );
}
