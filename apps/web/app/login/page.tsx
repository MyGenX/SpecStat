import { signIn } from '@/auth'
import { GitHubIcon, CheckIcon } from '@/components/shared/Icons'

function LogoMark({ size = 48 }: { size?: number }) {
  const s = size
  const scale = s / 32
  return (
    <svg viewBox="0 0 32 32" fill="none" style={{ width: s, height: s }} aria-hidden>
      <rect width="32" height="32" rx="7" fill="#6366F1"/>
      <line x1="16" y1="11" x2="10" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
      <line x1="16" y1="11" x2="22" y2="21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55"/>
      <circle cx="16" cy="8.5" r="3.5" fill="white"/>
      <circle cx="10" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
      <circle cx="22" cy="23.5" r="2.75" fill="white" fillOpacity="0.88"/>
    </svg>
  )
}

const FEATURES = [
  { text: 'Track specs, decisions and proposals in git — versioned like code' },
  { text: 'Visualize spec relationships as graphs, timelines and boards' },
  { text: 'Drive changes through automated GitHub PRs with full audit trail' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Right column on mobile first → left on desktop */}
      <div className="order-first md:order-last flex items-center justify-center p-8 bg-background md:w-[420px] shrink-0">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center">
              <LogoMark size={40} />
            </div>
            <h1 className="text-xl font-semibold">Sign in to SpecStat</h1>
            <p className="text-sm text-muted-foreground">Continue with your GitHub account</p>
          </div>

          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: '/workspace' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <GitHubIcon className="w-5 h-5" />
              Continue with GitHub
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By signing in you agree to SpecStat connecting to your GitHub account
            to read repository data.
          </p>
        </div>
      </div>

      {/* Left column — product pitch */}
      <div className="flex-1 flex items-center justify-center p-10 bg-primary/5 dark:bg-primary/10 border-r border-border/60">
        <div className="max-w-md space-y-8">
          <div className="space-y-3">
            <LogoMark size={56} />
            <h2 className="text-3xl font-bold tracking-tight">SpecStat</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              GitHub-native spec management &amp; visualization for engineering teams.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <CheckIcon className="w-3 h-3 text-primary" />
                </span>
                <span className="text-sm text-foreground/80 leading-relaxed">{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-1.5">
              {['#6366F1', '#8B5CF6', '#06B6D4'].map((c) => (
                <span key={c} className="w-7 h-7 rounded-full border-2 border-background" style={{ background: c }} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Used by engineering teams that live in git</span>
          </div>
        </div>
      </div>
    </div>
  )
}
