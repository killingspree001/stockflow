import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-3xl" />
      </div>

      <div className="relative">
        <Nav />
        <Hero />
        <Logos />
        <Features />
        <Workflow />
        <CallToAction />
        <Footer />
      </div>
    </div>
  );
}

function Nav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2">
        <Logo />
        <span className="text-lg font-semibold">StockFlow</span>
      </div>
      <nav className="flex items-center gap-6 text-sm">
        <a href="#features" className="hidden text-slate-300 hover:text-white sm:block">
          Features
        </a>
        <a href="#how" className="hidden text-slate-300 hover:text-white sm:block">
          How it works
        </a>
        <Link href="/login" className="text-slate-300 hover:text-white">
          Sign in
        </Link>
        <Link
          href="/login"
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 text-center animate-in sm:pt-24">
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
        </span>
        Built for independent shops
      </span>

      <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
        Run your shop from one{" "}
        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          clean dashboard
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">
        Track stock, ring up sales at a fast till, and watch your revenue and
        margins in real time. No spreadsheets, no clutter.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:opacity-90 sm:w-auto"
        >
          Start free
        </Link>
        <a
          href="#features"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
        >
          See how it works
        </a>
      </div>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="float mx-auto mt-16 max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur">
        <div className="rounded-xl bg-slate-900/80 p-5">
          <div className="mb-4 flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <PreviewStat label="Revenue today" value="$1,284" />
            <PreviewStat label="Profit today" value="$496" accent />
            <PreviewStat label="This week" value="$7,910" />
            <PreviewStat label="Low stock" value="3 items" />
          </div>
          <div className="mt-3 flex h-32 items-end gap-2 rounded-lg bg-white/5 p-4">
            {[40, 65, 50, 80, 55, 95, 70].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%`, animationDelay: `${i * 140}ms` }}
                className="bar-rise flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-400"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-left">
      <p className="text-xs text-slate-400">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          accent ? "text-amber-300" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Logos() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-center text-xs uppercase tracking-widest text-slate-500">
        Everything a small retailer needs, nothing they don&apos;t
      </p>
    </section>
  );
}

function Features() {
  const items = [
    {
      title: "Smart inventory",
      body: "Add products by hand or import a whole CSV in seconds. Get low-stock alerts before you run out.",
    },
    {
      title: "Fast checkout",
      body: "Scan a barcode or tap to add. Stock updates the instant a sale goes through — it can never oversell.",
    },
    {
      title: "Live numbers",
      body: "Revenue, profit and best sellers update as you sell, across today, this week and this month.",
    },
    {
      title: "Roles that fit",
      body: "Owners and managers run the shop; cashiers only see the till. Permissions enforced on the server.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Built to run a counter, not impress a spreadsheet
        </h2>
        <p className="mt-3 text-slate-400">
          The essentials, done properly and fast.
        </p>
      </div>

      <div className="stagger mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              ◆
            </div>
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "1", title: "Add your stock", body: "Type products in or import a CSV — names, prices, quantities." },
    { n: "2", title: "Sell at the till", body: "Search or scan, build the cart, take the sale. Stock drops instantly." },
    { n: "3", title: "Watch it grow", body: "Your dashboard shows revenue, profit and what's selling best." },
  ];

  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Up and running in minutes</h2>
        <p className="mt-3 text-slate-400">Three steps from sign-up to your first sale.</p>
      </div>

      <div className="stagger mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.n} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-indigo-400/40 text-sm font-semibold text-indigo-300">
              {step.n}
            </div>
            <h3 className="font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 to-violet-600/20 px-6 py-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to take control of your shop?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-slate-300">
          Create a free account and have your inventory live in minutes.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Get started — it&apos;s free
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-slate-300">StockFlow</span>
        </div>
        <p>© {2026} StockFlow. Inventory & point of sale for small shops.</p>
      </div>
    </footer>
  );
}

function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white">
      S
    </div>
  );
}
