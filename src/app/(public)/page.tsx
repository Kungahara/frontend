import Link from "next/link";

export default function HomePage() {
  return (
    <main className="blank-landing">
      <nav className="blank-landing-actions" aria-label="Authentication">
        <Link className="landing-login" href="/login">Log in</Link>
        <Link className="landing-signup" href="/signup">Sign up</Link>
      </nav>
    </main>
  );
}
