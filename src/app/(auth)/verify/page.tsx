"use client";

import { Suspense } from "react";
import VerifyContent from "./VerifyContent";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
