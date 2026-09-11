"use client";

import Image from "next/image";

export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "member";
  profileImageUrl: string | null;
};

export function PersonAvatar({ person, label }: { person: PersonSummary | null | undefined; label?: string }) {
  if (!person) return <span className="person-avatar-empty" aria-label={`${label ?? "User"} unavailable`}>—</span>;
  const initials = `${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`.toUpperCase() || person.email[0]?.toUpperCase() || "?";
  return <span className="person-avatar" tabIndex={0} title={person.email} aria-label={`${label ? `${label}: ` : ""}${person.email}`}>
    {person.profileImageUrl ? <Image src={person.profileImageUrl} alt="" width={30} height={30} unoptimized /> : <span>{initials}</span>}
    <span className="person-avatar-tooltip" role="tooltip">{person.email}</span>
  </span>;
}
