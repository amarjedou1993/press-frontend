// "use client";
// // src/app/(admin)/layout.tsx — guard + chrome for SUPER_ADMIN.

// // import { usePathname } from "next/navigation";
// import { usePathname } from "@/i18n/navigation";
// import { LayoutDashboard, CalendarDays, Users, IdCard, Gavel } from "lucide-react";
// import { AppShell } from "@/components/AppShell";
// import { navMatcher } from "@/lib/nav";
// import { routes } from "@/lib/routes";

// /**
//  * Every destination in this sidebar, in one list.
//  *
//  * Declared OUTSIDE the component and separately from the groups, because
//  * `navMatcher` decides which entry is current by comparing all of them
//  * against each other — specificity is a property of the whole set, not of one
//  * group. Splitting the list across groups would let "/admin/cards" and
//  * "/admin/cards/revocations" be compared only within their own group, which
//  * is the collision this exists to prevent.
//  */
// const NAV_HREFS = [
//   routes.admin.home,
//   routes.admin.sessions,
//   routes.admin.reviewers,
//   routes.admin.cards,
//   routes.admin.revocations,
// ] as const;

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const path = usePathname();

//   // Longest match wins: exactly one entry is ever active, and adding a nested
//   // route can never light two at once. No per-entry rule to remember.
//   const isActive = navMatcher(path, NAV_HREFS);

//   return (
//     <AppShell
//       requireRole="SUPER_ADMIN"
//       title="Administration"
//       subtitle="Sessions, commission d'examen et cartes de presse"
//       groups={[
//         {
//           items: [
//             {
//               label: "Tableau de bord",
//               href: routes.admin.home,
//               icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
//               active: isActive(routes.admin.home),
//             },
//           ],
//         },
//         {
//           label: "Accréditation",
//           items: [
//             {
//               label: "Sessions",
//               href: routes.admin.sessions,
//               icon: <CalendarDays className="h-[17px] w-[17px]" />,
//               active: isActive(routes.admin.sessions),
//             },
//             {
//               label: "Réviseurs",
//               href: routes.admin.reviewers,
//               icon: <Users className="h-[17px] w-[17px]" />,
//               active: isActive(routes.admin.reviewers),
//             },
//             {
//               label: "Cartes",
//               href: routes.admin.cards,
//               icon: <IdCard className="h-[17px] w-[17px]" />,
//               active: isActive(routes.admin.cards),
//             },
//             {
//               label: "Retraits de cartes",
//               href: routes.admin.revocations,
//               icon: <Gavel className="h-[17px] w-[17px]" />,
//               active: isActive(routes.admin.revocations),
//             },
//           ],
//         },
//       ]}
//     >
//       {children}
//     </AppShell>
//   );
// }


"use client";
// src/app/[locale]/(admin)/layout.tsx — guard + chrome for SUPER_ADMIN.

import { usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard, CalendarDays, Users, IdCard, Gavel, Printer,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navMatcher } from "@/lib/nav";
import { routes } from "@/lib/routes";

/**
 * Every destination in this sidebar, in one list.
 *
 * Declared OUTSIDE the component and separately from the groups, because
 * `navMatcher` decides which entry is current by comparing all of them
 * against each other — specificity is a property of the whole set, not of one
 * group. Splitting the list across groups would let "/admin/cards" and
 * "/admin/cards/revocations" be compared only within their own group, which
 * is the collision this exists to prevent.
 *
 * ⚠️ AN ENTRY ADDED TO A GROUP MUST BE ADDED HERE TOO. Omitted, it can never
 * win against "/admin", which is a prefix of every path in this space — so
 * "Tableau de bord" would stay lit while the reader is somewhere else.
 */
const NAV_HREFS = [
  routes.admin.home,
  routes.admin.sessions,
  routes.admin.reviewers,
  routes.admin.printers,
  routes.admin.cards,
  routes.admin.revocations,
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  // Longest match wins: exactly one entry is ever active, and adding a nested
  // route can never light two at once. No per-entry rule to remember.
  const isActive = navMatcher(path, NAV_HREFS);

  return (
    <AppShell
      requireRole="SUPER_ADMIN"
      title="Administration"
      subtitle="Sessions, commission d'examen et cartes de presse"
      /**
       * ⚠️ The proxy redirects /ar/admin to /fr/admin, so a language choice
       * here would reload the page in French and the control would look
       * broken. One line to reverse when the staff catalogues exist.
       */
      canSwitchLanguage={false}
      groups={[
        {
          items: [
            {
              label: "Tableau de bord",
              href: routes.admin.home,
              icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.home),
            },
          ],
        },
        {
          label: "Accréditation",
          items: [
            {
              label: "Sessions",
              href: routes.admin.sessions,
              icon: <CalendarDays className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.sessions),
            },
            {
              label: "Réviseurs",
              href: routes.admin.reviewers,
              icon: <Users className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.reviewers),
            },
            {
              label: "Cartes",
              href: routes.admin.cards,
              icon: <IdCard className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.cards),
            },
            {
              label: "Retraits de cartes",
              href: routes.admin.revocations,
              icon: <Gavel className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.revocations),
            },
          ],
        },
        {
          /**
           * ⚠️ ITS OWN GROUP, not folded into "Accréditation".
           *
           * Everything above concerns deciding who is a journalist. This
           * concerns who manufactures the object — a contractor with an
           * account, whose access begins and ends on that screen. Grouping
           * them together would suggest the printer takes part in the
           * accreditation, which is precisely what they do not do.
           */
          label: "Production",
          items: [
            {
              label: "Comptes d'impression",
              href: routes.admin.printers,
              icon: <Printer className="h-[17px] w-[17px]" />,
              active: isActive(routes.admin.printers),
            },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
