// "use client";
// // src/app/[locale]/(printer)/printer/page.tsx
// //
// // The production queue: ordinary cards by session, honour cards on their own.

// import { useEffect, useMemo, useState } from "react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";
// import {
//   Printer, FolderArchive, Loader2, Search, CalendarRange, Building2,
//   Briefcase, RotateCcw, Inbox, Award,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Skeleton } from "@/components/ui/skeleton";
// import { PaginationBar } from "@/components/ui/pagination-bar";
// import { Guilloche, OfficialSeal } from "@/components/public/patterns";
// import {
//   getPrintableSessions, getPrintableCards, getPrintableHonourCards,
//   getPrintableInstitutionalCards,
//   downloadPrinterArchive, downloadHonourArchive, downloadInstitutionalArchive,
//   printerKeys,
//   type PrintableCard, type PrintableHonourCard, type PrintableInstitutionalCard,
// } from "@/lib/api/printer";
// import { useAuthStore } from "@/lib/auth";

// type Tab = "session" | "honour" | "institutional";

// function longFr(iso?: string | null) {
//   if (!iso) return "—";
//   const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
//   return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
//     day: "numeric", month: "long", year: "numeric",
//   });
// }

// export default function PrinterPage() {
//   const qc = useQueryClient();
//   const token = useAuthStore((s) => s.token);

//   const [tab, setTab] = useState<Tab>("session");
//   const [sessionId, setSessionId] = useState<number | null>(null);
//   /**
//    * ⚠️ THE INSTITUTION IS TO A C CARD WHAT A SESSION IS TO AN A CARD.
//    *
//    * Both answer "which batch am I making". An institution's cards are
//    * collected together, by one body, in one envelope — so a producer picks
//    * the body first, exactly as they pick the cohort first.
//    */
//   const [institutionId, setInstitutionId] = useState<number | null>(null);
//   const [selected, setSelected] = useState<Set<number>>(new Set());
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(25);

//   const sessions = useQuery({
//     queryKey: printerKeys.sessions,
//     queryFn: getPrintableSessions,
//   });

//   /**
//    * The newest session, chosen for them.
//    *
//    * ⚠️ A producer opening this screen has one job, and it is almost always
//    * the current cohort. An empty select saying "choose a session" is a click
//    * that adds nothing — they would choose the same one every time.
//    */
//   useEffect(() => {
//     if (sessionId === null && sessions.data && sessions.data.length > 0) {
//       setSessionId(sessions.data[0].sessionId);
//     }
//   }, [sessions.data, sessionId]);

//   const cards = useQuery({
//     queryKey: printerKeys.cards(sessionId ?? 0),
//     queryFn: () => getPrintableCards(sessionId!),
//     enabled: tab === "session" && sessionId !== null,
//   });

//   const institutional = useQuery({
//     queryKey: printerKeys.institutional,
//     queryFn: getPrintableInstitutionalCards,
//     enabled: tab === "institutional",
//   });

//   /**
//    * The first body, chosen for them.
//    *
//    * ⚠️ The same reasoning as the session default above: a producer opening
//    * this tab has one job, and an empty select saying "choose an institution"
//    * is a click that adds nothing.
//    */
//   useEffect(() => {
//     if (institutionId === null && institutional.data && institutional.data.length > 0) {
//       setInstitutionId(institutional.data[0].institutionId);
//     }
//   }, [institutional.data, institutionId]);

//   const honour = useQuery({
//     queryKey: printerKeys.honour,
//     queryFn: getPrintableHonourCards,
//     enabled: tab === "honour",
//   });

//   /**
//    * ⚠️ ONE SELECTION SET, CLEARED ON EVERY TAB CHANGE.
//    *
//    * The two lists hold different ids in different tables — id 7 is one card
//    * here and another there. Carrying a selection across would produce an
//    * archive of cards nobody chose.
//    */
//   useEffect(() => {
//     setSelected(new Set());
//     setSearch("");
//     setPage(1);
//   }, [tab]);

//   const rows: Array<PrintableCard | PrintableHonourCard | PrintableInstitutionalCard> =
//     tab === "session" ? (cards.data ?? [])
//     : tab === "honour" ? (honour.data ?? [])
//     /* ⚠️ ONE BODY AT A TIME. The endpoint returns every institution's
//        producible cards, grouped; the tab shows the selected group. A run
//        spanning two bodies would be a ZIP nobody could hand to one person. */
//     : (institutional.data?.find((g) => g.institutionId === institutionId)?.cards ?? []);

//   const loading = tab === "session" ? cards.isLoading
//     : tab === "honour" ? honour.isLoading
//     : institutional.isLoading;

//     const filtered = useMemo(() => {
//     const term = search.trim().toLowerCase();
//     return rows.filter((c) => {
//       if (!term) return true;

//       /*
//        * ⚠️ THE THREE SERIES NAME THE BODY DIFFERENTLY, AND THAT IS RIGHT.
//        *
//        * An ordinary card and an honour card carry `institution` as free text
//        * — the outlet a journalist works for, typed into a dossier. An
//        * institutional card carries `institutionNameFr`, looked up from the
//        * body that filed it. One is a claim about employment; the other is the
//        * authority standing behind the card.
//        *
//        * A shared `institution` field would have made them the same thing, and
//        * a producer searching "HAPA" would not know which they had found.
//        */
//       const body = "institution" in c ? c.institution
//                  : "institutionNameFr" in c ? c.institutionNameFr
//                  : null;

//       const job = "jobTitle" in c ? c.jobTitle : null;

//       return c.holderFullName.toLowerCase().includes(term)
//           || c.cardNumber.toLowerCase().includes(term)
//           || (body ?? "").toLowerCase().includes(term)
//           || (job ?? "").toLowerCase().includes(term);
//     });
//   }, [rows, search]);

//   const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const safePage = Math.min(page, pageCount);
//   const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

//   const allSelected = filtered.length > 0
//     && filtered.every((c) => selected.has(c.cardId));

//   const reprints = useMemo(
//     () => filtered.filter((c) => selected.has(c.cardId) && c.producedCount > 0).length,
//     [filtered, selected]
//   );

//   const archive = useMutation({
//     mutationFn: () => tab === "session"
//       ? downloadPrinterArchive([...selected], sessionId, token)
//       : tab === "honour"
//         ? downloadHonourArchive([...selected], token)
//         : downloadInstitutionalArchive([...selected], token),
//     onSuccess: ({ included, skipped }) => {
//       qc.invalidateQueries({ queryKey: printerKeys.cards(sessionId ?? 0) });
//       qc.invalidateQueries({ queryKey: printerKeys.honour });
//       qc.invalidateQueries({ queryKey: printerKeys.institutional });
//       qc.invalidateQueries({ queryKey: printerKeys.history });
//       setSelected(new Set());

//       if (skipped > 0) {
//         // ⚠️ Omissions are NAMED. A producer who receives 37 folders instead
//         // of 40 must learn it here rather than by counting.
//         toast.warning(`${included} carte(s) exportée(s), ${skipped} sans pièces`, {
//           description: "Les cartes omises n'ont ni photographie ni code.",
//         });
//       } else {
//         toast.success(`${included} carte(s) exportée(s)`, {
//           description: tab === "session"
//             ? "L'archive contient un dossier par carte."
//             : "Photographie et code de vérification, un dossier par carte.",
//         });
//       }
//     },
//     onError: (e) => toast.error("Export impossible", {
//       description: e instanceof Error ? e.message : "Réessayez.",
//     }),
//   });

//   const toggle = (cardId: number) => {
//     const next = new Set(selected);
//     next.has(cardId) ? next.delete(cardId) : next.add(cardId);
//     setSelected(next);
//   };

//   const nothingAtAll = !sessions.isLoading
//     && (sessions.data?.length ?? 0) === 0
//     && (honour.data?.length ?? 0) === 0
//     && (institutional.data?.length ?? 0) === 0;

//   return (
//     <div className="mx-auto max-w-5xl space-y-6">
//       {/* ══ hero ══ */}
//             <section
//         className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
//         style={{
//           background:
//             "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
//         }}
//       >
//         <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
//           style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
//           aria-hidden="true" />
//         <Guilloche
//           className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white sm:-right-20 sm:-top-24 sm:h-[300px] sm:w-[300px]"
//           rings={34}
//           opacity={0.1}
//         />

//         <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:items-end sm:gap-6 sm:px-7 sm:pb-7 sm:pt-7">
//           <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
//             <span className="relative mt-1 hidden h-[54px] w-[54px] flex-none items-center justify-center sm:flex">
//               <span className="absolute inset-0 rounded-full"
//                 style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
//                 aria-hidden="true" />
//               <OfficialSeal className="relative h-full w-full"
//                 color="var(--gold-500)" id="printer-queue-seal" />
//             </span>

//             <div className="min-w-0">
//               <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
//                 Production
//               </p>
//               <h2 className="engraved-dark mt-2 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px] sm:leading-none">
//                 Cartes à produire
//               </h2>
//               <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
//                 Chaque carte est fournie avec sa photographie et son code de
//                 vérification.
//               </p>
//             </div>
//           </div>

//           <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:flex-none sm:items-end">
//             <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center sm:flex-none">
//               <p className="font-mono text-[28px] font-extrabold leading-none">
//                 {loading ? "—" : filtered.length}
//               </p>
//               <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
//                 {tab === "session" ? "dans la session" : "cartes d'honneur"}
//               </p>
//             </div>
//             {selected.size > 0 && (
//               <div className="flex flex-1 flex-col justify-center rounded-xl border border-[var(--gold-500)]/40 bg-black/25 px-5 py-3.5 text-center sm:flex-none">
//                 <p className="font-mono text-[28px] font-extrabold leading-none text-[var(--gold-500)]">
//                   {selected.size}
//                 </p>
//                 <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
//                   sélectionnées
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="flex h-1.5" aria-hidden="true">
//           <i className="flex-1 bg-[var(--green-500)]" />
//           <i className="flex-1 bg-[var(--gold-500)]" />
//           <i className="flex-1 bg-[var(--red-500)]" />
//         </div>
//       </section>

//       {/* ══ the two kinds ══
//           ⚠️ TABS, not one list with a column. They are different objects with
//           different numbers, produced for different reasons — and a producer
//           working a session should not have honour cards scattered through
//           their batch. */}
//       <div className="inline-flex rounded-xl bg-[#f2f5f3] p-1">
//         {([
//           { key: "session" as const, label: "Par session", Icon: CalendarRange },
//           { key: "honour" as const, label: "Cartes d'honneur", Icon: Award },
//           /* ⚠️ A third tab, because a third table. An institutional card
//              lives in institutional_cards with its own C sequence — unlike a
//              renewal, which produces an ordinary row in `cards` and needed no
//              tab at all. The tab count follows the tables, not the features. */
//           { key: "institutional" as const, label: "Institutions", Icon: Building2 },
//         ]).map((t) => {
//           const on = tab === t.key;
//           return (
//             <button
//               key={t.key}
//               type="button"
//               onClick={() => setTab(t.key)}
//               aria-pressed={on}
//               className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-all"
//               style={on
//                 ? { background: "#fff", color: "var(--green-900)",
//                     boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
//                 : { color: "var(--slate)" }}
//             >
//               <t.Icon className="h-3.5 w-3.5" />
//               {t.label}
//             </button>
//           );
//         })}
//       </div>

//       {nothingAtAll ? (
//         <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
//           <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
//           <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
//             Aucune carte à produire
//           </p>
//           <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
//             Les cartes apparaissent ici dès que le Ministère les a éditées.
//           </p>
//         </div>
//       ) : (
//         <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
//           <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
//             {/* ⚠️ The session select belongs to ONE tab. An honour card
//                 belongs to no cohort, so the control has nothing to offer
//                 there — hidden rather than disabled. */}
//             {tab === "session" && (sessions.data?.length ?? 0) > 0 && (
//               <div className="relative">
//                 <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
//                 <select
//                   value={sessionId ?? ""}
//                   onChange={(e) => {
//                     setSessionId(Number(e.target.value));
//                     setPage(1);
//                     setSelected(new Set());
//                   }}
//                   aria-label="Session"
//                   className="h-9 rounded-lg border border-[var(--green-500)] bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
//                 >
//                   {sessions.data?.map((s) => (
//                     <option key={s.sessionId} value={s.sessionId}>
//                       {s.label ?? `Session ${s.sessionId}`} — {s.cardCount}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {/* ⚠️ THE SAME CONTROL, FOR THE SAME REASON.
//                 An institution is the cohort of a C card: its staff are
//                 collected together, by one body, in one envelope. A producer
//                 picks the body before selecting, exactly as they pick the
//                 session. */}
//             {tab === "institutional" && (institutional.data?.length ?? 0) > 0 && (
//               <div className="relative">
//                 <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
//                 <select
//                   value={institutionId ?? ""}
//                   onChange={(e) => {
//                     setInstitutionId(Number(e.target.value));
//                     setPage(1);
//                     setSelected(new Set());
//                   }}
//                   aria-label="Institution"
//                   className="h-9 rounded-lg border border-[var(--green-500)] bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
//                 >
//                   {institutional.data?.map((g) => (
//                     <option key={g.institutionId} value={g.institutionId}>
//                       {g.institutionNameFr} ({g.cards.length})
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             <div className="relative">
//               <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
//               <input
//                 type="search"
//                 value={search}
//                 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
//                 placeholder="Nom, n° de carte, organe…"
//                 aria-label="Rechercher une carte"
//                 className="h-9 w-64 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
//               />
//             </div>

//             <Button
//               className="ml-auto"
//               size="sm"
//               disabled={selected.size === 0 || archive.isPending}
//               onClick={() => archive.mutate()}
//             >
//               {archive.isPending
//                 ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
//                 : <FolderArchive className="h-3.5 w-3.5" />}
//               Produire {selected.size > 0 && `(${selected.size})`}
//             </Button>
//           </div>

//           {loading ? (
//             <Skeleton className="m-5 h-32" />
//           ) : filtered.length === 0 ? (
//             <p className="px-5 py-12 text-center text-[13.5px] leading-relaxed text-[var(--slate)]">
//               {/*
//                 ⚠️ INSIDE THE ELEMENT, NOT BEFORE IT.

//                 This comment sat between the ternary's `?` and its <p>, which
//                 does not parse: a branch holds ONE expression, and a braced
//                 JSX comment is itself an expression. The compiler stopped at
//                 the second — "Expected '</', got 'ident'" — which names the
//                 symptom and not the cause.

//                 ⚠️ THREE TABS, THREE MESSAGES.

//                 The ternary had two branches: session, and everything else —
//                 so the institutional tab said "Aucune carte d'honneur à
//                 produire", naming the wrong series on the one screen whose
//                 whole job is to keep them apart.

//                 And the institutional message says WHY, because the reason is
//                 almost always the same and it is not the Ministry's to fix: a
//                 granted card with no photograph is valid and waits, and the
//                 institution is the only party holding the picture.
//               */}
//               {search
//                 ? "Aucune carte ne correspond à cette recherche."
//                 : tab === "session"
//                   ? "Aucune carte valable dans cette session."
//                   : tab === "honour"
//                     ? "Aucune carte d'honneur à produire."
//                     : (institutional.data?.length ?? 0) === 0
//                       ? "Aucune carte institutionnelle à produire. Une carte octroyée n'apparaît ici qu'une fois sa photographie fournie par l'institution."
//                       : "Aucune carte à produire pour cette institution."}
//             </p>
//           ) : (
//             <>
//               <div className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
//                 <Checkbox
//                   checked={allSelected}
//                   onCheckedChange={() => setSelected(
//                     allSelected ? new Set() : new Set(filtered.map((c) => c.cardId)))}
//                   aria-label="Tout sélectionner"
//                 />
//                 <span className="text-[12px] font-semibold text-[var(--slate)]">
//                   {allSelected
//                     ? "Tout désélectionner"
//                     : `Sélectionner les ${filtered.length} carte${filtered.length > 1 ? "s" : ""}`}
//                   {search && " correspondant à la recherche"}
//                 </span>

//                 {/* ⚠️ SAID, NOT BLOCKED. A reprint is normal — a jam, a spent
//                     ribbon. Nothing prevents it; this only makes sure it is not
//                     accidental. */}
//                 {reprints > 0 && (
//                   <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-tint)] px-3 py-1 text-[11.5px] font-bold text-[var(--gold-700)]">
//                     <RotateCcw className="h-3 w-3" />
//                     {reprints} déjà produite{reprints > 1 ? "s" : ""}
//                   </span>
//                 )}
//               </div>

//               <ul className="divide-y divide-[var(--line)]">
//                 {visible.map((card) => (
//                   <CardRow
//                     key={card.cardId}
//                     card={card}
//                     kind={tab}
//                     selected={selected.has(card.cardId)}
//                     onToggle={() => toggle(card.cardId)}
//                   />
//                 ))}
//               </ul>

//               <PaginationBar
//                 page={safePage}
//                 pageSize={pageSize}
//                 total={filtered.length}
//                 onPageChange={setPage}
//                 onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
//                 itemNounSingular="carte"
//                 itemNounPlural="cartes"
//               />
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ══ one card to produce ══ */

// function CardRow({
//   card, kind, selected, onToggle,
// }: {
//   card: PrintableCard | PrintableHonourCard | PrintableInstitutionalCard;
//   kind: Tab;
//   selected: boolean;
//   onToggle: () => void;
// }) {
//   const produced = card.producedCount > 0;
//   const specialisation = "specialisationFr" in card ? card.specialisationFr : null;
//   /* ⚠️ An institutional card carries a job title where an ordinary one
//      carries a specialisation. Printed on neither — it is what tells a
//      producer which of two people with one name is which. */
//   const jobTitle = "jobTitle" in card ? card.jobTitle : null;
//   const institutionName = "institutionNameFr" in card ? card.institutionNameFr : null;

//   return (
//     <li className="flex flex-wrap items-center gap-4 px-5 py-3.5"
//       style={{ background: selected ? "var(--green-tint)" : undefined }}>
//       <Checkbox
//         checked={selected}
//         onCheckedChange={onToggle}
//         aria-label={`Sélectionner la carte ${card.cardNumber}`}
//       />

//       <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
//         style={{ background: produced ? "var(--gold-tint)" : "var(--green-tint)" }}>
//         {/* The icon says which kind: the B in the number does too, but a
//             producer scanning a list reads shapes before digits. */}
//         {/* The icon says which series: the letter in the number does too, but
//             a producer scanning a list reads shapes before digits. */}
//         {kind === "honour"
//           ? <Award className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />
//           : kind === "institutional"
//             ? <Building2 className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />
//             : <Printer className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />}
//       </span>

//       <div className="min-w-0 flex-1">
//         <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
//           {card.holderFullName}
//           <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
//             {card.cardNumber}
//           </span>
//         </p>
//         <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--slate)]">
//           <span>{card.categoryLabelFr}</span>
//           {specialisation && (
//             <span className="flex items-center gap-1">
//               <Briefcase className="h-3 w-3 opacity-60" />
//               {specialisation}
//             </span>
//           )}
//           {jobTitle && (
//             <span className="flex items-center gap-1">
//               <Briefcase className="h-3 w-3 opacity-60" />
//               {jobTitle}
//             </span>
//           )}
//           {"institution" in card && card.institution && (
//             <span className="flex items-center gap-1">
//               <Building2 className="h-3 w-3 opacity-60" />
//               {card.institution}
//             </span>
//           )}
//           {/* ⚠️ Shown even though the tab is already filtered to one body:
//               a producer who exports, then changes the select, then looks back
//               at a downloaded manifest needs the name on the row too. */}
//           {institutionName && (
//             <span className="flex items-center gap-1">
//               <Building2 className="h-3 w-3 opacity-60" />
//               {institutionName}
//             </span>
//           )}
//           <span className="opacity-60">jusqu&apos;au {longFr(card.expiresAt)}</span>
//         </p>
//       </div>

//       {/* ⚠️ THE COUNT, BEFORE THE CHOICE — the control that needs no
//           permission gate behind it. */}
//       {produced && (
//         <span className="flex-none rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
//           produite {card.producedCount}×
//         </span>
//       )}
//     </li>
//   );
// }


"use client";
// src/app/[locale]/(printer)/printer/page.tsx
//
// The production queue: ordinary cards by session, honour cards on their own.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Printer, FolderArchive, Loader2, Search, CalendarRange, Building2,
  Briefcase, RotateCcw, Inbox, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Guilloche, OfficialSeal } from "@/components/public/patterns";
import {
  getPrintableSessions, getPrintableCards, getPrintableHonourCards,
  getPrintableInstitutionalCards,
  downloadPrinterArchive, downloadHonourArchive, downloadInstitutionalArchive,
  printerKeys,
  type PrintableCard, type PrintableHonourCard, type PrintableInstitutionalCard,
} from "@/lib/api/printer";
import { useAuthStore } from "@/lib/auth";

type Tab = "session" | "honour" | "institutional";

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PrinterPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [tab, setTab] = useState<Tab>("session");
  const [sessionId, setSessionId] = useState<number | null>(null);
  /**
   * ⚠️ THE INSTITUTION IS TO A C CARD WHAT A SESSION IS TO AN A CARD.
   *
   * Both answer "which batch am I making". An institution's cards are
   * collected together, by one body, in one envelope — so a producer picks
   * the body first, exactly as they pick the cohort first.
   */
  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const sessions = useQuery({
    queryKey: printerKeys.sessions,
    queryFn: getPrintableSessions,
  });

  /**
   * The newest session, chosen for them.
   *
   * ⚠️ A producer opening this screen has one job, and it is almost always
   * the current cohort. An empty select saying "choose a session" is a click
   * that adds nothing — they would choose the same one every time.
   */
  useEffect(() => {
    if (sessionId === null && sessions.data && sessions.data.length > 0) {
      setSessionId(sessions.data[0].sessionId);
    }
  }, [sessions.data, sessionId]);

  const cards = useQuery({
    queryKey: printerKeys.cards(sessionId ?? 0),
    queryFn: () => getPrintableCards(sessionId!),
    enabled: tab === "session" && sessionId !== null,
  });

  const institutional = useQuery({
    queryKey: printerKeys.institutional,
    queryFn: getPrintableInstitutionalCards,
    enabled: tab === "institutional",
  });

  /**
   * The first body, chosen for them.
   *
   * ⚠️ The same reasoning as the session default above: a producer opening
   * this tab has one job, and an empty select saying "choose an institution"
   * is a click that adds nothing.
   */
  useEffect(() => {
    if (institutionId === null && institutional.data && institutional.data.length > 0) {
      setInstitutionId(institutional.data[0].institutionId);
    }
  }, [institutional.data, institutionId]);

  const honour = useQuery({
    queryKey: printerKeys.honour,
    queryFn: getPrintableHonourCards,
    enabled: tab === "honour",
  });

  /**
   * ⚠️ ONE SELECTION SET, CLEARED ON EVERY TAB CHANGE.
   *
   * The two lists hold different ids in different tables — id 7 is one card
   * here and another there. Carrying a selection across would produce an
   * archive of cards nobody chose.
   */
  useEffect(() => {
    setSelected(new Set());
    setSearch("");
    setPage(1);
  }, [tab]);

  const rows: Array<PrintableCard | PrintableHonourCard | PrintableInstitutionalCard> =
    tab === "session" ? (cards.data ?? [])
    : tab === "honour" ? (honour.data ?? [])
    /* ⚠️ ONE BODY AT A TIME. The endpoint returns every institution's
       producible cards, grouped; the tab shows the selected group. A run
       spanning two bodies would be a ZIP nobody could hand to one person. */
    : (institutional.data?.find((g) => g.institutionId === institutionId)?.cards ?? []);

  const institutionalGroup = institutional.data
    ?.find((g) => g.institutionId === institutionId);

  const loading = tab === "session" ? cards.isLoading
    : tab === "honour" ? honour.isLoading
    : institutional.isLoading;

    const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (!term) return true;

      /*
       * ⚠️ THE THREE SERIES NAME THE BODY DIFFERENTLY, AND THAT IS RIGHT.
       *
       * An ordinary card and an honour card carry `institution` as free text
       * — the outlet a journalist works for, typed into a dossier. An
       * institutional card carries `institutionNameFr`, looked up from the
       * body that filed it. One is a claim about employment; the other is the
       * authority standing behind the card.
       *
       * A shared `institution` field would have made them the same thing, and
       * a producer searching "HAPA" would not know which they had found.
       */
      const body = "institution" in c ? c.institution
                 : "institutionNameFr" in c ? c.institutionNameFr
                 : null;

      const job = "jobTitle" in c ? c.jobTitle : null;

      return c.holderFullName.toLowerCase().includes(term)
          || c.cardNumber.toLowerCase().includes(term)
          || (body ?? "").toLowerCase().includes(term)
          || (job ?? "").toLowerCase().includes(term);
    });
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allSelected = filtered.length > 0
    && filtered.every((c) => selected.has(c.cardId));

  const reprints = useMemo(
    () => filtered.filter((c) => selected.has(c.cardId) && c.producedCount > 0).length,
    [filtered, selected]
  );

  const archive = useMutation({
    mutationFn: () => tab === "session"
      ? downloadPrinterArchive([...selected], sessionId, token)
      : tab === "honour"
        ? downloadHonourArchive([...selected], token)
        : downloadInstitutionalArchive([...selected], token),
    onSuccess: ({ included, skipped }) => {
      qc.invalidateQueries({ queryKey: printerKeys.cards(sessionId ?? 0) });
      qc.invalidateQueries({ queryKey: printerKeys.honour });
      qc.invalidateQueries({ queryKey: printerKeys.institutional });
      qc.invalidateQueries({ queryKey: printerKeys.history });
      setSelected(new Set());

      if (skipped > 0) {
        // ⚠️ Omissions are NAMED. A producer who receives 37 folders instead
        // of 40 must learn it here rather than by counting.
        toast.warning(`${included} carte(s) exportée(s), ${skipped} sans pièces`, {
          description: "Les cartes omises n'ont ni photographie ni code.",
        });
      } else {
        toast.success(`${included} carte(s) exportée(s)`, {
          description: tab === "session"
            ? "L'archive contient un dossier par carte."
            : "Photographie et code de vérification, un dossier par carte.",
        });
      }
    },
    onError: (e) => toast.error("Export impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  const toggle = (cardId: number) => {
    const next = new Set(selected);
    next.has(cardId) ? next.delete(cardId) : next.add(cardId);
    setSelected(next);
  };

  const nothingAtAll = !sessions.isLoading
    && (sessions.data?.length ?? 0) === 0
    && (honour.data?.length ?? 0) === 0
    && (institutional.data?.length ?? 0) === 0;

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * ⚠️ THE HERO SAYS WHICH SERIES, AND THE LETTER IS THE STRONGEST SIGNAL.
   *
   * A producer downloads an archive and makes cards from it. Which series
   * they are holding decides the stock, the layout and the batch — and the
   * hero was identical on all three tabs, saying only "Cartes à produire".
   *
   * The letter is what is PRINTED on the card they are about to make: A, B or
   * C. It cannot be confused with anything else on the screen, and it is the
   * same mark the register uses.
   *
   * ⚠️ COLOUR REINFORCES; IT DOES NOT CARRY.
   *
   * Gold for the honour series because gold is already this system's honour
   * colour — the seal, the rule, the foil. But a producer with a colour-blind
   * eye, or a screen set oddly, reads the LETTER and the WORDS; the ground is
   * the second signal, never the only one.
   * ═══════════════════════════════════════════════════════════════════════
   */
  const series = {
    session: {
      letter: "A",
      eyebrow: "Production",
      title: "Cartes à produire",
      lede: "Chaque carte est fournie avec sa photographie et son code de vérification.",
      countLabel: "dans la session",
      ground:
        "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), "
        + "linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
      accent: "var(--gold-500)",
    },
    honour: {
      letter: "B",
      eyebrow: "Série B · Cartes d'honneur",
      title: "Cartes d'honneur",
      lede: "Octroyées par le Ministère sans examen de la commission. Photographie et code de vérification.",
      countLabel: "cartes d'honneur",
      /* ⚠️ A warmer ground, not a different design. The guilloche, the seal
         and the tricolour are unchanged — only the gradient shifts, so the
         page is recognisably the same screen in a different register. */
      ground:
        "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.22), transparent 62%), "
        + "linear-gradient(155deg, #2b2208 0%, #3f3312 58%, #241d06 100%)",
      accent: "var(--gold-500)",
    },
    institutional: {
      letter: "C",
      eyebrow: "Série C · Cartes institutionnelles",
      /* ⚠️ THE BODY'S NAME IS THE TITLE.
         An institutional run is one body's batch — collected together, in one
         envelope, by one person. Naming it is what tells a producer which
         batch is on the bench. */
      title: institutionalGroup?.institutionNameFr ?? "Cartes institutionnelles",
      lede: "Déposées par l'institution, octroyées par le Ministère. Photographie et code de vérification.",
      countLabel: "pour cette institution",
      ground:
        "radial-gradient(760px 380px at 84% -30%, rgba(120,190,255,.12), transparent 62%), "
        + "linear-gradient(155deg, #0a2430 0%, #0d3242 58%, #08202b 100%)",
      accent: "#7fc4e8",
    },
  }[tab];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ══ hero ══ */}
            <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{ background: series.ground, transition: "background 240ms ease" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white sm:-right-20 sm:-top-24 sm:h-[300px] sm:w-[300px]"
          rings={34}
          opacity={0.1}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:items-end sm:gap-6 sm:px-7 sm:pb-7 sm:pt-7">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <span className="relative mt-1 hidden h-[54px] w-[54px] flex-none items-center justify-center sm:flex">
              <span className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true" />
              <OfficialSeal className="relative h-full w-full"
                color={series.accent} id="printer-queue-seal" />
            </span>

            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.24em]"
                style={{ color: series.accent }}>
                {/* ⚠️ THE LETTER, IN THE FACE IT IS PRINTED IN.
                    A - 0042 / 26 on the card; A here. A producer comparing the
                    screen to the stock on the bench is comparing the same
                    mark, not a label about it. */}
                <span
                  dir="ltr"
                  className="inline-flex h-[18px] w-[18px] flex-none items-center justify-center rounded font-mono text-[11px] font-extrabold"
                  style={{ background: series.accent, color: "#0b2e1f" }}
                  aria-hidden="true"
                >
                  {series.letter}
                </span>
                {series.eyebrow}
              </p>
              <h2 dir="auto" className="engraved-dark mt-2 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px] sm:leading-none">
                {series.title}
              </h2>
              <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
                {series.lede}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:flex-none sm:items-end">
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center sm:flex-none">
              <p className="font-mono text-[28px] font-extrabold leading-none">
                {loading ? "—" : filtered.length}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                {/* ⚠️ THREE TABS, THREE LABELS. This said "cartes d'honneur"
                    on the institutional tab — a two-branch ternary serving
                    three cases, the same shape as the empty-state bug. */}
                {series.countLabel}
              </p>
            </div>
            {selected.size > 0 && (
              <div className="flex flex-1 flex-col justify-center rounded-xl border bg-black/25 px-5 py-3.5 text-center sm:flex-none"
                style={{ borderColor: `color-mix(in srgb, ${series.accent} 40%, transparent)` }}>
                <p className="font-mono text-[28px] font-extrabold leading-none"
                  style={{ color: series.accent }}>
                  {selected.size}
                </p>
                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                  sélectionnées
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ the two kinds ══
          ⚠️ TABS, not one list with a column. They are different objects with
          different numbers, produced for different reasons — and a producer
          working a session should not have honour cards scattered through
          their batch. */}
      <div className="inline-flex rounded-xl bg-[#f2f5f3] p-1">
        {([
          { key: "session" as const, label: "Par session", Icon: CalendarRange },
          { key: "honour" as const, label: "Cartes d'honneur", Icon: Award },
          /* ⚠️ A third tab, because a third table. An institutional card
             lives in institutional_cards with its own C sequence — unlike a
             renewal, which produces an ordinary row in `cards` and needed no
             tab at all. The tab count follows the tables, not the features. */
          { key: "institutional" as const, label: "Institutions", Icon: Building2 },
        ]).map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={on}
              className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-all"
              style={on
                ? { background: "#fff", color: "var(--green-900)",
                    boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : { color: "var(--slate)" }}
            >
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {nothingAtAll ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucune carte à produire
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            Les cartes apparaissent ici dès que le Ministère les a éditées.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
            {/* ⚠️ The session select belongs to ONE tab. An honour card
                belongs to no cohort, so the control has nothing to offer
                there — hidden rather than disabled. */}
            {tab === "session" && (sessions.data?.length ?? 0) > 0 && (
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                <select
                  value={sessionId ?? ""}
                  onChange={(e) => {
                    setSessionId(Number(e.target.value));
                    setPage(1);
                    setSelected(new Set());
                  }}
                  aria-label="Session"
                  className="h-9 rounded-lg border border-[var(--green-500)] bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
                >
                  {sessions.data?.map((s) => (
                    <option key={s.sessionId} value={s.sessionId}>
                      {s.label ?? `Session ${s.sessionId}`} — {s.cardCount}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ⚠️ THE SAME CONTROL, FOR THE SAME REASON.
                An institution is the cohort of a C card: its staff are
                collected together, by one body, in one envelope. A producer
                picks the body before selecting, exactly as they pick the
                session. */}
            {tab === "institutional" && (institutional.data?.length ?? 0) > 0 && (
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                <select
                  value={institutionId ?? ""}
                  onChange={(e) => {
                    setInstitutionId(Number(e.target.value));
                    setPage(1);
                    setSelected(new Set());
                  }}
                  aria-label="Institution"
                  className="h-9 rounded-lg border border-[var(--green-500)] bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
                >
                  {institutional.data?.map((g) => (
                    <option key={g.institutionId} value={g.institutionId}>
                      {g.institutionNameFr} ({g.cards.length})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nom, n° de carte, organe…"
                aria-label="Rechercher une carte"
                className="h-9 w-64 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
              />
            </div>

            <Button
              className="ml-auto"
              size="sm"
              disabled={selected.size === 0 || archive.isPending}
              onClick={() => archive.mutate()}
            >
              {archive.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FolderArchive className="h-3.5 w-3.5" />}
              Produire {selected.size > 0 && `(${selected.size})`}
            </Button>
          </div>

          {loading ? (
            <Skeleton className="m-5 h-32" />
          ) : filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13.5px] leading-relaxed text-[var(--slate)]">
              {/*
                ⚠️ INSIDE THE ELEMENT, NOT BEFORE IT.

                This comment sat between the ternary's `?` and its <p>, which
                does not parse: a branch holds ONE expression, and a braced
                JSX comment is itself an expression. The compiler stopped at
                the second — "Expected '</', got 'ident'" — which names the
                symptom and not the cause.

                ⚠️ THREE TABS, THREE MESSAGES.

                The ternary had two branches: session, and everything else —
                so the institutional tab said "Aucune carte d'honneur à
                produire", naming the wrong series on the one screen whose
                whole job is to keep them apart.

                And the institutional message says WHY, because the reason is
                almost always the same and it is not the Ministry's to fix: a
                granted card with no photograph is valid and waits, and the
                institution is the only party holding the picture.
              */}
              {search
                ? "Aucune carte ne correspond à cette recherche."
                : tab === "session"
                  ? "Aucune carte valable dans cette session."
                  : tab === "honour"
                    ? "Aucune carte d'honneur à produire."
                    : (institutional.data?.length ?? 0) === 0
                      ? "Aucune carte institutionnelle à produire. Une carte octroyée n'apparaît ici qu'une fois sa photographie fournie par l'institution."
                      : "Aucune carte à produire pour cette institution."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => setSelected(
                    allSelected ? new Set() : new Set(filtered.map((c) => c.cardId)))}
                  aria-label="Tout sélectionner"
                />
                <span className="text-[12px] font-semibold text-[var(--slate)]">
                  {allSelected
                    ? "Tout désélectionner"
                    : `Sélectionner les ${filtered.length} carte${filtered.length > 1 ? "s" : ""}`}
                  {search && " correspondant à la recherche"}
                </span>

                {/* ⚠️ SAID, NOT BLOCKED. A reprint is normal — a jam, a spent
                    ribbon. Nothing prevents it; this only makes sure it is not
                    accidental. */}
                {reprints > 0 && (
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-tint)] px-3 py-1 text-[11.5px] font-bold text-[var(--gold-700)]">
                    <RotateCcw className="h-3 w-3" />
                    {reprints} déjà produite{reprints > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <ul className="divide-y divide-[var(--line)]">
                {visible.map((card) => (
                  <CardRow
                    key={card.cardId}
                    card={card}
                    kind={tab}
                    selected={selected.has(card.cardId)}
                    onToggle={() => toggle(card.cardId)}
                  />
                ))}
              </ul>

              <PaginationBar
                page={safePage}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                itemNounSingular="carte"
                itemNounPlural="cartes"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ one card to produce ══ */

function CardRow({
  card, kind, selected, onToggle,
}: {
  card: PrintableCard | PrintableHonourCard | PrintableInstitutionalCard;
  kind: Tab;
  selected: boolean;
  onToggle: () => void;
}) {
  const produced = card.producedCount > 0;
  const specialisation = "specialisationFr" in card ? card.specialisationFr : null;
  /* ⚠️ An institutional card carries a job title where an ordinary one
     carries a specialisation. Printed on neither — it is what tells a
     producer which of two people with one name is which. */
  const jobTitle = "jobTitle" in card ? card.jobTitle : null;
  const institutionName = "institutionNameFr" in card ? card.institutionNameFr : null;

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5"
      style={{ background: selected ? "var(--green-tint)" : undefined }}>
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Sélectionner la carte ${card.cardNumber}`}
      />

      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
        style={{ background: produced ? "var(--gold-tint)" : "var(--green-tint)" }}>
        {/* The icon says which kind: the B in the number does too, but a
            producer scanning a list reads shapes before digits. */}
        {/* The icon says which series: the letter in the number does too, but
            a producer scanning a list reads shapes before digits. */}
        {kind === "honour"
          ? <Award className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />
          : kind === "institutional"
            ? <Building2 className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />
            : <Printer className="h-4 w-4" style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
          {card.holderFullName}
          <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
            {card.cardNumber}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--slate)]">
          <span>{card.categoryLabelFr}</span>
          {specialisation && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 opacity-60" />
              {specialisation}
            </span>
          )}
          {jobTitle && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 opacity-60" />
              {jobTitle}
            </span>
          )}
          {"institution" in card && card.institution && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 opacity-60" />
              {card.institution}
            </span>
          )}
          {/* ⚠️ Shown even though the tab is already filtered to one body:
              a producer who exports, then changes the select, then looks back
              at a downloaded manifest needs the name on the row too. */}
          {institutionName && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 opacity-60" />
              {institutionName}
            </span>
          )}
          <span className="opacity-60">jusqu&apos;au {longFr(card.expiresAt)}</span>
        </p>
      </div>

      {/* ⚠️ THE COUNT, BEFORE THE CHOICE — the control that needs no
          permission gate behind it. */}
      {produced && (
        <span className="flex-none rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
          produite {card.producedCount}×
        </span>
      )}
    </li>
  );
}
