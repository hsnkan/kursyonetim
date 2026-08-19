"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_BRANDING } from "@/lib/brandingConstants";

const BrandingContext = createContext(DEFAULT_BRANDING);

export function useBranding() {
  return useContext(BrandingContext);
}

export default function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.branding) {
          setBranding({ ...DEFAULT_BRANDING, ...data.branding });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
