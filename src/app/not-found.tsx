// // src/app/not-found.tsx
// //
// // The ROOT fallback — reached when nothing matched at all, including cases
// // where the locale itself is unknown.
// //
// // ───────────────────────────────────────────────────────────────────────
// // ⚠️ NO HOOKS, NO TRANSLATIONS, NO LOCALISED Link.
// //
// // This file lives OUTSIDE [locale]. There is no request locale here, so
// // getTranslations() has nothing to resolve against and next-intl's Link
// // cannot build an href. Either one throws — turning a 404 into a 500, which
// // is the one thing worse than a missing page.
// //
// // So it carries BOTH languages statically and links with plain <a> to
// // explicit locale paths. It is a lifeboat: it must work when everything else
// // has failed, including the i18n layer.
// //
// // The localised 404 — the one people will actually see — is at
// // src/app/[locale]/not-found.tsx and has the full design.
// // ───────────────────────────────────────────────────────────────────────

// export const metadata = {
//   title: "Page introuvable · هذه الصفحة غير موجودة",
// };

// export default function RootNotFound() {
//   return (
//     <html lang="fr" dir="ltr">
//       <body
//         style={{
//           margin: 0,
//           minHeight: "100vh",
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           padding: "48px 24px",
//           background: "linear-gradient(168deg, #08251a 0%, #0b3524 100%)",
//           color: "#ffffff",
//           fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
//           textAlign: "center",
//         }}
//       >
//         {/* The tricolour, inline — no stylesheet is guaranteed here either. */}
//         <div style={{ display: "flex", width: 72, height: 5, marginBottom: 32 }}>
//           <i style={{ flex: 1, background: "#00a95c" }} />
//           <i style={{ flex: 1, background: "#ffd700" }} />
//           <i style={{ flex: 1, background: "#d01c1f" }} />
//         </div>

//         <p
//           style={{
//             margin: 0,
//             fontSize: 11,
//             letterSpacing: "0.3em",
//             textTransform: "uppercase",
//             color: "rgba(255,255,255,.35)",
//             fontFamily: "monospace",
//           }}
//         >
//           Erreur 404
//         </p>

//         {/* Both languages, always. Somebody who cannot read the page cannot
//             leave it — and here we do not know which one they read. */}
//         <h1 style={{ margin: "16px 0 0", fontSize: 30, lineHeight: 1.2 }}>
//           Cette page n&apos;existe pas
//         </h1>
//         <p
//           dir="rtl"
//           lang="ar"
//           style={{ margin: "10px 0 0", fontSize: 22, color: "rgba(255,255,255,.5)" }}
//         >
//           هذه الصفحة غير موجودة
//         </p>

//         <div
//           style={{
//             display: "flex",
//             gap: 12,
//             marginTop: 36,
//             flexWrap: "wrap",
//             justifyContent: "center",
//           }}
//         >
//           {/* ⚠️ Plain <a>, and an EXPLICIT locale in each path. next-intl's
//               Link would need a locale from context that does not exist here,
//               and a bare "/" would land on the same missing route again. */}
//           <a
//             href="/fr"
//             style={{
//               display: "inline-block",
//               padding: "12px 26px",
//               borderRadius: 10,
//               background: "#ffffff",
//               color: "#0b3524",
//               textDecoration: "none",
//               fontSize: 14,
//               fontWeight: 700,
//             }}
//           >
//             Accueil
//           </a>
//           <a
//             href="/ar"
//             dir="rtl"
//             lang="ar"
//             style={{
//               display: "inline-block",
//               padding: "12px 26px",
//               borderRadius: 10,
//               border: "1px solid rgba(255,255,255,.3)",
//               color: "#ffffff",
//               textDecoration: "none",
//               fontSize: 14,
//               fontWeight: 700,
//             }}
//           >
//             الرئيسية
//           </a>
//         </div>

//         <p
//           style={{
//             margin: "40px 0 0",
//             fontSize: 11,
//             letterSpacing: "0.14em",
//             textTransform: "uppercase",
//             color: "rgba(255,255,255,.28)",
//           }}
//         >
//           République Islamique de Mauritanie
//         </p>
//       </body>
//     </html>
//   );
// }


// src/app/not-found.tsx
//
// The ROOT fallback — reached when nothing matched at all, including cases
// where the locale itself is unknown.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ NO <html>, NO <body>.
//
// This file renders INSIDE RootLayout, which already owns the document. An
// earlier version wrapped itself in its own <html> and <body> — two nested
// documents, which is invalid HTML and breaks hydration outright.
//
// ⚠️ AND NO HOOKS EITHER.
//
// It lives outside [locale], so there is no request locale: getTranslations()
// has nothing to resolve against and next-intl's Link cannot build an href.
// Either one throws, turning a 404 into a 500 — the only thing worse than a
// missing page.
//
// So it carries BOTH languages statically and links with plain <a> to
// explicit locale paths. It is a lifeboat: it must work when everything else
// has failed, including the i18n layer.
//
// The localised 404 — the one people actually see — is at
// src/app/[locale]/not-found.tsx and has the full design.
// ───────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Page introuvable · هذه الصفحة غير موجودة",
};

export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "linear-gradient(168deg, #08251a 0%, #0b3524 100%)",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      {/* The tricolour, inline — this file must not depend on a stylesheet
          that may not have loaded when everything else has failed. */}
      <div style={{ display: "flex", width: 72, height: 5, marginBottom: 32 }}>
        <i style={{ flex: 1, background: "#00a95c" }} />
        <i style={{ flex: 1, background: "#ffd700" }} />
        <i style={{ flex: 1, background: "#d01c1f" }} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.35)",
          fontFamily: "monospace",
        }}
      >
        Erreur 404
      </p>

      {/* Both languages, always. Somebody who cannot read the page cannot
          leave it — and here we do not know which one they read. */}
      <h1 style={{ margin: "16px 0 0", fontSize: 30, lineHeight: 1.2 }}>
        Cette page n&apos;existe pas
      </h1>
      <p
        dir="rtl"
        lang="ar"
        style={{ margin: "10px 0 0", fontSize: 22, color: "rgba(255,255,255,.5)" }}
      >
        هذه الصفحة غير موجودة
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 36,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* ⚠️ Plain <a>, and an EXPLICIT locale in each path. next-intl's Link
            would need a locale from context that does not exist here, and a
            bare "/" would land on the same missing route again. */}
        <a
          href="/fr"
          style={{
            display: "inline-block",
            padding: "12px 26px",
            borderRadius: 10,
            background: "#ffffff",
            color: "#0b3524",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Accueil
        </a>
        <a
          href="/ar"
          dir="rtl"
          lang="ar"
          style={{
            display: "inline-block",
            padding: "12px 26px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.3)",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          الرئيسية
        </a>
      </div>

      <p
        style={{
          margin: "40px 0 0",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.28)",
        }}
      >
        République Islamique de Mauritanie
      </p>
    </main>
  );
}