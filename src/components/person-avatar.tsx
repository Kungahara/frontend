"use client";

import Image from "next/image";
import { useState } from "react";

export type PersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "owner" | "member";
  profileImageUrl: string | null;
};

export function PersonAvatar({ person, label }: { person: PersonSummary | null | undefined; label?: string }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  if (!person) return <span className="person-avatar-empty" aria-label={`${label ?? "User"} unavailable`}>—</span>;
  const initials = `${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`.toUpperCase() || person.email[0]?.toUpperCase() || "?";
  const imageUrl = person.profileImageUrl && person.profileImageUrl !== failedImageUrl ? person.profileImageUrl : null;
  return <span className="person-avatar" tabIndex={0} title={person.email} aria-label={`${label ? `${label}: ` : ""}${person.email}`}>
    {imageUrl ? <Image src={imageUrl} alt="" width={30} height={30} unoptimized onError={() => setFailedImageUrl(imageUrl)} /> : <span>{initials}</span>}
    <span className="person-avatar-tooltip" role="tooltip">{person.email}</span>
  </span>;
}
