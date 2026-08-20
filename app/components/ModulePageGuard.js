"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "@/app/components/BrandingProvider";
import {
  modulErisilebilir,
  varsayilanDashboardYolu,
} from "@/lib/ozellikler";
import { pathnameModulAnahtari } from "@/lib/modulePaths";

export default function ModulePageGuard({ userRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const branding = useBranding();

  useEffect(() => {
    if (userRole === "developer") return;

    const anahtar = pathnameModulAnahtari(pathname);
    if (!anahtar) return;

    const erisilebilir = modulErisilebilir(
      { rol: userRole },
      branding.ozellikler,
      anahtar,
    );

    if (!erisilebilir) {
      router.replace(varsayilanDashboardYolu(branding.ozellikler));
    }
  }, [pathname, branding.ozellikler, userRole, router]);

  return null;
}
