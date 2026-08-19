"use client";

import Image from "next/image";
import { Building2, Camera, Check, CloudUpload, Pencil, Trash2, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { authRequest, type AuthUser } from "@/lib/api/client";

export function ProfileMenu({ user, onUserChange }: { user: AuthUser; onUserChange: (user: AuthUser) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [businessName, setBusinessName] = useState(user.businessName ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const name = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    setBusy(true);
    setError("");
    const formData = new FormData();
    formData.set("image", image);
    const response = await fetch("/api/profile-picture", { method: "POST", body: formData });
    const body = await response.json().catch(() => null);
    if (!response.ok) setError(body?.error?.message ?? "Unable to upload the profile picture.");
    else { onUserChange(body.user as AuthUser); setOpen(false); }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/profile-picture", { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) setError(body?.error?.message ?? "Unable to remove the profile picture.");
    else { onUserChange(body.user as AuthUser); setOpen(false); }
    setBusy(false);
  }

  async function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authRequest<{ user: AuthUser }>("me", { method: "PATCH", body: JSON.stringify({ businessName }) });
      onUserChange(result.user);
      window.dispatchEvent(new CustomEvent("kungahara:user-changed", { detail: result.user }));
      setBusinessName(result.user.businessName ?? "");
      setEditingBusiness(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update the business name.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="dashboard-profile-control" ref={rootRef}>
    <button className="dashboard-account" type="button" aria-label="Open profile options" aria-expanded={open} onClick={() => { setOpen(!open); setError(""); }}>
      <span className={`dashboard-account-mark${user.profileImageUrl ? " has-image" : ""}`} aria-hidden="true">{user.profileImageUrl ? <Image src={user.profileImageUrl} alt="" width={44} height={44} unoptimized /> : initials}</span>
      <span><strong>{name}</strong><small>{user.email}</small></span>
    </button>
    {open && <div className="dashboard-profile-menu">
      <div className="profile-menu-heading">
        <span className={`profile-menu-avatar${user.profileImageUrl ? " has-image" : ""}`}>{user.profileImageUrl ? <Image src={user.profileImageUrl} alt="" width={72} height={72} unoptimized /> : initials}</span>
        <span><strong>{name}</strong><small>{user.email}</small></span>
      </div>
      {editingBusiness ? <form className="profile-business-form" onSubmit={saveBusiness}>
        <label>Business name<input autoFocus required maxLength={200} value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label>
        <div><button type="submit" aria-label="Save business name" disabled={busy || !businessName.trim()}><Check aria-hidden="true" /></button><button type="button" aria-label="Cancel editing business name" onClick={() => { setEditingBusiness(false); setBusinessName(user.businessName ?? ""); }}><X aria-hidden="true" /></button></div>
      </form> : <button className="profile-menu-action" type="button" disabled={!['owner', 'admin'].includes(user.role)} onClick={() => setEditingBusiness(true)}><Building2 aria-hidden="true" /><span><small>Business name</small>{user.businessName ?? "Not set"}</span><Pencil aria-hidden="true" /></button>}
      <label className={`profile-menu-action${busy ? " disabled" : ""}`}>
        <CloudUpload aria-hidden="true" /><span>{busy ? "Uploading…" : user.profileImageUrl ? "Change profile picture" : "Upload profile picture"}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={upload} />
      </label>
      {user.profileImageUrl && <button className="profile-menu-action danger" type="button" disabled={busy} onClick={remove}><Trash2 aria-hidden="true" /><span>Remove profile picture</span></button>}
      {!user.profileImageUrl && <p className="profile-menu-hint"><Camera aria-hidden="true" /> JPEG, PNG or WebP, up to 5 MB.</p>}
      {error && <p className="profile-menu-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
