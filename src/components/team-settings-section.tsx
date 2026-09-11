"use client";

import { Check, Mail, MoreVertical, RefreshCw, Trash2, UserCheck, UserPlus, UserX, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import { PersonAvatar, type PersonSummary } from "@/components/person-avatar";
import { CustomSelect } from "@/components/custom-select";
import { apiErrorMessage, type AuthUser } from "@/lib/api/client";
import { inventoryFetch } from "@/lib/inventory-client";

export type TeamMember = PersonSummary & { status: "active" | "inactive"; joinedAt: string };
export type Invitation = { id: string; email: string; role: "owner" | "member"; status: "pending"; profileImageUrl: null; invitedAt: string; expiresAt: string };

export function TeamSettingsSection({ currentUser, initialMembers, initialInvitations }: { currentUser: AuthUser; initialMembers: TeamMember[]; initialInvitations: Invitation[] }) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "member">("member");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const menuArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) { if (!menuArea.current?.contains(event.target as Node)) setOpenMenu(null); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("invite"); setInviteError("");
    try {
      const response = await inventoryFetch("/api/team/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setInviteError(apiErrorMessage(body, "Unable to send the invitation.")); return; }
      setInviteOpen(false);
      setInvitations((current) => [body.invitation, ...current]);
      setEmail("");
      setRole("member");
    } catch (reason) {
      setInviteError(reason instanceof Error ? reason.message : "Unable to send the invitation.");
    } finally {
      setBusy("");
    }
  }

  async function changeMember(member: TeamMember, action: "active" | "inactive" | "remove") {
    setBusy(member.id); setError(""); setOpenMenu(null);
    const response = await inventoryFetch(`/api/team/members/${member.id}`, action === "remove" ? { method: "DELETE" } : { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: action }) });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (response.ok) {
      if (action === "remove") setMembers((current) => current.filter((item) => item.id !== member.id));
      else setMembers((current) => current.map((item) => item.id === member.id ? body.member : item));
    } else setError(apiErrorMessage(body, `Unable to ${action === "remove" ? "remove" : action === "active" ? "reactivate" : "suspend"} this user.`));
    setBusy("");
  }

  async function invitationAction(invitation: Invitation, action: "resend" | "cancel") {
    setBusy(invitation.id); setError(""); setOpenMenu(null);
    const response = await inventoryFetch(`/api/team/invitations/${invitation.id}`, { method: action === "resend" ? "POST" : "DELETE" });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (response.ok) {
      if (action === "cancel") setInvitations((current) => current.filter((item) => item.id !== invitation.id));
      else setInvitations((current) => current.map((item) => item.id === invitation.id ? body.invitation : item));
    } else setError(apiErrorMessage(body, `Unable to ${action} this invitation.`));
    setBusy("");
  }

  return <section className="settings-section team-settings-section" aria-labelledby="members-settings-title">
    <header className="team-settings-header"><div><h2 id="members-settings-title">Members</h2><p>Invite people and manage access to this business.</p></div><button className="settings-primary-button" type="button" onClick={() => { setInviteError(""); setInviteOpen(true); }}><UserPlus />Invite new member</button></header>
    {error && <p className="team-settings-error" role="alert">{error}</p>}
    <div className="team-member-list" ref={menuArea}>
      {members.map((member) => <article className="team-member-card" key={member.id}>
        <PersonAvatar person={member} />
        <div className="team-member-identity"><strong>{member.email}</strong><small>{member.role === "owner" ? "Owner" : "Member"}{member.id === currentUser.id ? " · You" : ""}</small></div>
        <span className={`team-member-status ${member.status}`}><i />{member.status === "active" ? "Active" : "Inactive"}</span>
        <div className="team-member-menu-wrap">
          <button className="team-member-menu-trigger" type="button" aria-label={`Actions for ${member.email}`} aria-expanded={openMenu === member.id} disabled={busy === member.id || member.id === currentUser.id} onClick={() => setOpenMenu((current) => current === member.id ? null : member.id)}><MoreVertical /></button>
          {openMenu === member.id && <div className="team-member-menu">{member.status === "active" ? <button type="button" onClick={() => void changeMember(member, "inactive")}><UserX />Suspend</button> : <button type="button" onClick={() => void changeMember(member, "active")}><UserCheck />Reactivate</button>}<button className="danger" type="button" onClick={() => void changeMember(member, "remove")}><Trash2 />Remove</button></div>}
        </div>
      </article>)}
      {invitations.map((invitation) => <article className="team-member-card pending" key={invitation.id}>
        <span className="team-invitation-avatar"><Mail /></span>
        <div className="team-member-identity"><strong>{invitation.email}</strong><small>{invitation.role === "owner" ? "Owner" : "Member"}</small></div>
        <span className="team-member-status pending"><i />Pending</span>
        <div className="team-member-menu-wrap"><button className="team-member-menu-trigger" type="button" aria-label={`Actions for ${invitation.email}`} aria-expanded={openMenu === invitation.id} disabled={busy === invitation.id} onClick={() => setOpenMenu((current) => current === invitation.id ? null : invitation.id)}><MoreVertical /></button>{openMenu === invitation.id && <div className="team-member-menu"><button type="button" onClick={() => void invitationAction(invitation, "resend")}><RefreshCw />Resend</button><button className="danger" type="button" onClick={() => void invitationAction(invitation, "cancel")}><X />Cancel</button></div>}</div>
      </article>)}
      {!members.length && !invitations.length && <p className="team-empty-state">No users or pending invitations yet.</p>}
    </div>
    {inviteOpen && <div className="settings-dialog-backdrop"><form className="settings-delete-dialog team-invite-dialog" onSubmit={invite}>
      <button className="team-dialog-close" type="button" aria-label="Close invitation" onClick={() => { setInviteOpen(false); setInviteError(""); }}><X /></button><span className="team-dialog-icon"><UserPlus /></span><h3>Invite a new user</h3><p>The invitation will remain pending until the recipient joins the business.</p>
      <div className="team-invite-fields"><label>Email address<input autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
      <CustomSelect className="team-role-custom-select" label="Role" value={role} options={[{ value: "member", label: "Member" }, { value: "owner", label: "Owner" }]} hideSelectedOption onChange={(value) => setRole(value as "owner" | "member")} /></div>
      {inviteError && <p className="team-invite-error" role="alert">{inviteError}</p>}
      <button className="settings-primary-button" type="submit" disabled={busy === "invite" || !email.trim()}>{busy === "invite" ? "Sending…" : <><Check />Send invitation</>}</button>
    </form></div>}
  </section>;
}
