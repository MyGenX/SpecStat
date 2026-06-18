import { auth } from '@/auth'
import { signIn } from '@/auth'
import {
  GitHubIcon, CheckIcon, FileTextIcon, GitPullRequestIcon,
  LayersIcon, CircleDotIcon, CalendarIcon, ArchiveIcon,
  ArrowRightIcon, PackageIcon, CheckCircleIcon, ZapIcon,
} from '@/components/shared/Icons'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { GitHubRepoBadge } from '@/components/layout/GitHubRepoBadge'

// ─── Logo ─────────────────────────────────────────────────────────────────────

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: size, height: size }} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#6366F1"/>
      <line x1="16" y1="11" x2="10" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
      <line x1="16" y1="11" x2="22" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
      <circle cx="16" cy="8.5" r="3.5" fill="white"/>
      <circle cx="10" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
      <circle cx="22" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
    </svg>
  )
}

// ─── Sign in action ───────────────────────────────────────────────────────────

async function handleSignIn() {
  'use server'
  await signIn('github', { redirectTo: '/workspace' })
}

// ─── CTA button ───────────────────────────────────────────────────────────────

function SignInButton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  }[size]

  return (
    <form action={handleSignIn}>
      <button
        type="submit"
        className={`inline-flex items-center ${cls} bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer`}
      >
        <GitHubIcon className="w-4 h-4" />
        Sign in with GitHub — it's free
      </button>
    </form>
  )
}

// ─── Visualization modes ──────────────────────────────────────────────────────

const MODES = [
  {
    icon: FileTextIcon,
    name: 'Stories',
    desc: 'Read specs as structured stories with full detail, status, contributors and linked resources.',
  },
  {
    icon: GitPullRequestIcon,
    name: 'Proposals',
    desc: 'Track proposed changes and design decisions before they become spec.',
  },
  {
    icon: LayersIcon,
    name: 'Tree',
    desc: 'Navigate your spec index in a collapsible folder hierarchy — just like your repo.',
  },
  {
    icon: CircleDotIcon,
    name: 'Graph',
    desc: 'See spec relationships as an interactive node graph. Zoom, pan, click to explore.',
  },
  {
    icon: CalendarIcon,
    name: 'Timeline',
    desc: 'View how specs evolved over time — who changed what and when.',
  },
  {
    icon: ArchiveIcon,
    name: 'Archive',
    desc: 'Explore historical and deprecated specs without losing context.',
  },
]

// ─── How it works ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    n: '1',
    icon: GitHubIcon,
    label: 'Connect GitHub',
    desc: 'Sign in with OAuth. SpecStat only requests read access — no write permissions ever.',
  },
  {
    n: '2',
    icon: PackageIcon,
    label: 'Select a repo',
    desc: 'Pick any repository you have access to. Private repos are fully supported.',
  },
  {
    n: '3',
    icon: FileTextIcon,
    label: 'OpenSpec analysis',
    desc: 'SpecStat finds openspec/index.json and parses all referenced spec files in real time.',
  },
  {
    n: '4',
    icon: LayersIcon,
    label: 'Explore & visualize',
    desc: 'Switch between 6 views — Stories, Graph, Tree, Timeline, Proposals or Archive.',
  },
]

// ─── App mock (browser frame) ─────────────────────────────────────────────────

function AppMock() {
  const mockSpecs = [
    { id: 'SPEC-001', title: 'User Authentication Flow', statusColor: 'bg-green-500' },
    { id: 'SPEC-002', title: 'Notification System', statusColor: 'bg-blue-400' },
    { id: 'SPEC-003', title: 'Payment Integration', statusColor: 'bg-amber-500' },
    { id: 'SPEC-004', title: 'Search & Indexing', statusColor: 'bg-green-500' },
    { id: 'SPEC-005', title: 'Webhook Events', statusColor: 'bg-blue-400' },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
      {/* Browser chrome */}
      <div className="bg-muted/80 border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400/80"/>
          <span className="w-3 h-3 rounded-full bg-yellow-400/80"/>
          <span className="w-3 h-3 rounded-full bg-green-400/80"/>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-background/70 border border-border rounded-md px-3 py-1 text-xs text-muted-foreground font-mono max-w-xs w-full text-center">
            specstat.app/stories?repo=acme/backend
          </div>
        </div>
      </div>

      {/* App shell */}
      <div className="flex bg-background" style={{ height: 420 }}>
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-border flex flex-col">
          <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Specs</span>
            <span className="text-xs text-muted-foreground">{mockSpecs.length}</span>
          </div>
          <div className="px-3 py-2 border-b border-border">
            <div className="bg-muted/60 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Search specs…
            </div>
          </div>
          <div className="flex-1 overflow-hidden py-1">
            {mockSpecs.map((spec, i) => (
              <div
                key={spec.id}
                className={`px-3 py-2.5 text-xs border-b border-border/40 ${i === 0 ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/40'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-muted-foreground/70">{spec.id}</span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${spec.statusColor}`}/>
                </div>
                <div className={`font-medium ${i === 0 ? 'text-primary' : 'text-foreground'} truncate`}>{spec.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
            {['Overview', 'Changes', 'Raw'].map((tab, i) => (
              <button key={tab} className={`px-3 py-1 text-xs rounded-md font-medium ${i === 0 ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 px-6 py-4 space-y-4 overflow-hidden">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">SPEC-001</span>
                  <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium border border-green-500/20">active</span>
                </div>
                <h3 className="text-lg font-bold">User Authentication Flow</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['auth', 'security', 'core'].map((tag) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground border border-border">{tag}</span>
                ))}
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-muted rounded w-full"/>
                <div className="h-2.5 bg-muted rounded w-5/6"/>
                <div className="h-2.5 bg-muted rounded w-4/6"/>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground">Requirements</div>
                {[1,2,3].map((n) => (
                  <div key={n} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-border flex-shrink-0"/>
                    <div className={`h-2 bg-muted rounded ${n === 1 ? 'w-48' : n === 2 ? 'w-36' : 'w-52'}`}/>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-44 border-l border-border px-3 py-4 shrink-0 space-y-3 text-xs">
              {[
                { label: 'Status', value: 'Active', valueClass: 'text-green-600' },
                { label: 'Owner', value: 'auth-team', valueClass: 'text-foreground' },
                { label: 'Version', value: '2.1.0', valueClass: 'text-muted-foreground' },
                { label: 'Updated', value: '3 days ago', valueClass: 'text-muted-foreground' },
              ].map(({ label, value, valueClass }) => (
                <div key={label}>
                  <div className="text-muted-foreground/70 mb-0.5">{label}</div>
                  <div className={`font-medium ${valueClass}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Lightweight nav ── */}
      <nav className="fixed top-0 inset-x-0 h-14 border-b bg-background/80 backdrop-blur-sm z-40 flex items-center px-6 justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold text-base tracking-tight">
          <LogoMark size={26} />
          SpecStat
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <GitHubRepoBadge />
          <ThemeToggle />
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  className="w-7 h-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <a
                href="/workspace"
                className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Open Workspace
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm font-medium bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                <GitHubIcon className="w-4 h-4" />
                Sign in
              </button>
            </form>
          )}
        </div>
      </nav>

      <main className="pt-14">

        {/* ── Preview banner ── */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-400 flex items-center justify-center gap-2">
          <ZapIcon className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Early preview</strong> — SpecStat is currently a <strong>read-only visualizer</strong>. It never writes to your repositories.
          </span>
        </div>

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <a
            href="https://openspec.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 border border-primary/20 rounded-full px-3 py-1 mb-6 hover:bg-primary/15 transition-colors cursor-pointer"
          >
            Inspired by OpenSpec
            <ArrowRightIcon className="w-3 h-3" />
          </a>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5">
            Visualize your specs,<br />
            <span className="text-primary">live from GitHub</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            GitHub-native spec management &amp; visualization for engineering teams.
            Connect your repo, and explore stories, graphs, timelines and more — instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            {session ? (
              <a
                href="/workspace"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Open Workspace
                <ArrowRightIcon className="w-4 h-4" />
              </a>
            ) : (
              <SignInButton size="lg" />
            )}
            <a
              href="https://openspec.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Learn about OpenSpec
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground/70">
            {session
              ? `Signed in as ${session.user?.name ?? session.user?.email ?? 'you'} · Read-only visualizer`
              : 'Read-only · No write access · No credit card needed'
            }
          </p>
        </section>

        {/* ── App mock ── */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <AppMock />
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3">How it works</h2>
              <p className="text-muted-foreground">From sign-in to your first spec visualization in under a minute.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {HOW_STEPS.map(({ n, icon: Icon, label, desc }, i) => (
                <div key={n} className="relative flex flex-col items-start gap-4">
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute left-full top-6 w-8 border-t-2 border-dashed border-border/60 -translate-y-1/2" style={{ marginLeft: '-4px' }} />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/10 border border-primary/20 shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-muted-foreground/50">Step {n}</span>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{label}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Visualization modes ── */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">6 ways to explore your specs</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every visualization mode is purpose-built for a different part of how engineering teams use specs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODES.map(({ icon: Icon, name, desc }) => (
              <div
                key={name}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="font-semibold mb-1.5">{name}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── OpenSpec callout ── */}
        <section className="border-t border-border bg-foreground text-background">
          <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1">
              <div className="text-xs font-mono font-semibold text-background/50 uppercase tracking-widest mb-3">
                Built on the OpenSpec standard
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Your specs live in git — SpecStat just reads them.
              </h2>
              <p className="text-background/70 leading-relaxed max-w-xl">
                SpecStat reads{' '}
                <code className="font-mono text-sm bg-background/10 px-1.5 py-0.5 rounded">openspec/index.json</code>
                {' '}— a vendor-neutral, git-native format for documenting software specifications.
                No proprietary database. No lock-in. Your specs are always yours, in your repo.
              </p>
            </div>
            <a
              href="https://openspec.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-background/10 hover:bg-background/20 border border-background/20 text-background px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 cursor-pointer"
            >
              openspec.dev
              <ArrowRightIcon className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* ── Free / guarantees ── */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {[
                'Free forever',
                'No credit card',
                'Read-only · zero write access',
                'Works with private repos',
                'Open standard (OpenSpec)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ── */}
        <section className="border-t border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-6 py-20 text-center">
            <LogoMark size={48} />
            {session ? (
              <>
                <h2 className="text-3xl font-bold mt-6 mb-3">Back to your specs</h2>
                <p className="text-muted-foreground mb-8">
                  You're signed in. Head to the workspace to explore your repositories.
                </p>
                <a
                  href="/workspace"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-base bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Open Workspace
                  <ArrowRightIcon className="w-4 h-4" />
                </a>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mt-6 mb-3">Ready to explore your specs?</h2>
                <p className="text-muted-foreground mb-8">
                  Connect GitHub and get a live visualization of your OpenSpec files in seconds.
                </p>
                <SignInButton size="lg" />
              </>
            )}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border px-6 py-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <LogoMark size={16} />
              <span>SpecStat</span>
            </div>
            <div className="flex items-center gap-4">
              <span>© 2025 SpecStat</span>
              <span>·</span>
              <a
                href="https://openspec.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Built on OpenSpec
              </a>
            </div>
          </div>
        </footer>

      </main>
    </div>
  )
}
