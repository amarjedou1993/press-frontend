"use client";
// src/components/reviewer/CandidateIdentityCard.tsx
// Who the commission is deciding about.
//
// The photograph is shown LARGE and first, for two reasons: it is what the
// credential will carry, and the commission must judge whether it is fit to
// print — a judgment nobody can make from a thumbnail. It is fetched with
// the session token, because a bare <img src> to a protected endpoint just
// returns 401.

import { User, Mail, Phone, IdCard, CalendarDays, MapPin, AlertTriangle, Briefcase, Building2 } from "lucide-react";
import { useAuthenticatedFile } from "@/lib/api/files";
import { reviewerPhotoPath, type CandidateIdentity } from "@/lib/api/review";

function Row({ icon: Icon, label, value, mono = false }: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {label}
        </p>
        <p className={`truncate text-[13.5px] text-[var(--ink)] ${mono ? "font-mono" : "font-medium"}`}>
          {value?.trim() ? value : "—"}
        </p>
      </div>
    </div>
  );
}

export function CandidateIdentityCard({
  applicationId,
  candidate,
  photoNeedsCorrection,
  photoObservation,
}: {
  applicationId: number;
  candidate: CandidateIdentity;
  photoNeedsCorrection: boolean;
  photoObservation?: string | null;
}) {
  const { url: photoUrl, loading } = useAuthenticatedFile(
    candidate.hasPhoto ? reviewerPhotoPath(applicationId) : null
  );

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <User className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div>
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Identité du candidat
          </p>
          <p className="text-[12px] text-[var(--slate)]">
            Telle qu&apos;elle figurera sur la carte
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-6">
        {/* ── the photograph, large enough to judge ── */}
        <div className="flex-none">
          <div
            className="relative aspect-[3/4] w-[150px] overflow-hidden rounded-xl border-2"
            style={{
              borderColor: photoNeedsCorrection
                ? "var(--gold-500)"
                : candidate.hasPhoto ? "var(--green-500)" : "var(--line)",
              background: "var(--green-tint)",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={`Photographie de ${candidate.fullName}`}
                className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--muted-fg)]">
                <User className="h-8 w-8 opacity-40" />
                <span className="px-3 text-center text-[10.5px] font-semibold">
                  {loading ? "Chargement…" : "Aucune photo"}
                </span>
              </div>
            )}
          </div>

          {candidate.photoAgeing && (
            <p className="mt-2 w-[150px] rounded-lg bg-[var(--gold-tint)] px-2 py-1.5 text-[11px] leading-snug text-[var(--gold-700)]">
              Photo de plus de 2 ans
            </p>
          )}
          {photoNeedsCorrection && (
            <p className="mt-2 w-[150px] rounded-lg bg-[var(--gold-tint)] px-2 py-1.5 text-[11px] font-semibold leading-snug text-[var(--gold-700)]">
              Correction demandée
              {photoObservation && (
                <span className="mt-0.5 block font-normal">{photoObservation}</span>
              )}
            </p>
          )}
        </div>

        {/* ── the record ── */}
        <div className="min-w-[260px] flex-1">
          <p className="text-[17px] font-extrabold leading-tight text-[var(--green-900)]">
            {candidate.fullName}
          </p>

          <div className="mt-2 grid gap-x-6 sm:grid-cols-2">
            <Row icon={IdCard} label="NNI"
              value={candidate.nni ?? candidate.passportNo} mono />
            <Row icon={CalendarDays} label="Naissance"
              value={candidate.birthdate
                ? new Date(candidate.birthdate).toLocaleDateString("fr-FR")
                : null} />
            <Row icon={MapPin} label="Lieu" value={candidate.birthplace} />
            <Row icon={Briefcase} label="Spécialité"
              value={candidate.specialisationLabelFr} />
            <Row icon={Building2} label="Organe de presse"
              value={candidate.institution} />
            <Row icon={Phone} label="Téléphone" value={candidate.phone} mono />
            <Row icon={Mail} label="E-mail" value={candidate.email} />
          </div>

          {!candidate.hasPhoto && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Aucune photographie : la carte ne pourra pas être éditée.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
