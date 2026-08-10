import Link from "next/link";
import { cookies } from "next/headers";

import { LogoutButton } from "@/components/logout-button";

export default async function HomePage() {
  const hasSession = (await cookies()).has("kungahara_session");

  return (
    <main className="blank-landing">
      <nav className="blank-landing-actions" aria-label="Authentication">
        {hasSession ? <>
          <Link className="landing-login" href="/dashboard">Return to dashboard</Link>
          <LogoutButton className="landing-logout" label="Log out" redirectTo="/" />
        </> : <>
          <Link className="landing-login" href="/login">Log in</Link>
          <Link className="landing-signup" href="/signup">Sign up</Link>
        </>}
      </nav>
    </main>
  );
}
