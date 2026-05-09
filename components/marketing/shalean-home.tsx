import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, Headphones, ShieldCheck, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getServerSession } from "@/lib/auth/session";

const TRUST_ITEMS = [
  { title: "Vetted teams", body: "Professionals aligned with Shalean service standards." },
  { title: "Secure checkout", body: "Card payments handled by Paystack — industry-standard security." },
  { title: "Clear totals", body: "You review the full amount before any charge." },
  { title: "Human support", body: "Reach out if anything looks off — we reconcile every booking." },
] as const;

const STEPS = [
  { title: "Book", body: "Pick a time and tell us where to meet you." },
  { title: "Confirm & pay", body: "Review details, then complete checkout in seconds." },
  { title: "Cleaner assigned", body: "Operations matches the right cleaner to your slot." },
  { title: "Service completed", body: "Track progress and payment status in your dashboard." },
] as const;

const SERVICE_OVERVIEW = [
  {
    title: "Standard clean",
    body: "Regular upkeep — kitchens, baths, floors, and surfaces refreshed.",
  },
  {
    title: "Deep clean",
    body: "Extra attention for buildup, detail work, and hard-to-reach areas.",
  },
  {
    title: "Move-in / move-out",
    body: "Empty-home passes ideal for handovers and inspection-ready finishes.",
  },
  {
    title: "Office & small commercial",
    body: "Focused visits for tidy, presentable workspaces.",
  },
] as const;

export async function ShaleanHome() {
  const { user } = await getServerSession();
  const primaryHref = "/bookings/new";
  const googleReviewsUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_URL?.trim();
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="text-base font-semibold tracking-tight">Shalean</span>
          <nav className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
              >
                Sign in
              </Link>
            )}
            <Link href={primaryHref} className={cn(buttonVariants({ size: "sm" }), "touch-manipulation")}>
              Book a clean
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-background px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
              Operational cleaning, booked online
            </p>
            <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Premium home cleaning with clear scheduling and secure payment.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Book in minutes, pay with confidence, and follow every step from assignment to completion — without
              guesswork.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={primaryHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 px-6 text-base sm:w-auto sm:min-w-[200px]",
                )}
              >
                Book a clean
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {!user ? (
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "inline-flex h-11 w-full justify-center sm:w-auto",
                  )}
                >
                  Create account
                </Link>
              ) : null}
            </div>
            {googleReviewsUrl ? (
              <p className="mt-6 text-sm">
                <a
                  href={googleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Read reviews on Google
                </a>
              </p>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Trusted operations — every booking is tracked and reconciled in your dashboard.
              </p>
            )}
          </div>
        </section>

        <section className="border-b border-border/60 px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/70 bg-card/50 p-4 shadow-xs sm:p-5"
              >
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden />
                  <h2 className="text-sm font-semibold">{item.title}</h2>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-border/60 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
              <p className="mt-2 text-muted-foreground">
                The same operational flow our teams use — presented simply for you.
              </p>
            </div>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="relative rounded-xl border border-border/70 bg-card p-5 shadow-xs"
                >
                  <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-border/60 bg-muted/20 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Services</h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Overview only — you&apos;ll confirm scope and pricing before checkout. No surprise charges at
                  payment time.
                </p>
              </div>
              <CalendarCheck2 className="hidden size-10 text-muted-foreground/50 sm:block" aria-hidden />
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {SERVICE_OVERVIEW.map((s) => (
                <li
                  key={s.title}
                  className="flex gap-3 rounded-xl border border-border/70 bg-card p-5 shadow-xs"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <div>
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 rounded-2xl border border-border/80 bg-card p-8 shadow-sm sm:flex-row sm:items-center sm:p-10">
            <div className="flex gap-4">
              <Headphones className="size-10 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Questions before you book?</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {supportEmail ? (
                    <>
                      Email{" "}
                      <a className="font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${supportEmail}`}>
                        {supportEmail}
                      </a>{" "}
                      — we monitor operational issues closely.
                    </>
                  ) : (
                    <>Use your dashboard after sign-in — booking and payment status stay in sync.</>
                  )}
                </p>
              </div>
            </div>
            <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }), "w-full shrink-0 sm:w-auto")}>
              Start booking
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Shalean · Professional cleaning operations</p>
      </footer>
    </div>
  );
}
