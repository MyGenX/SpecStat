import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/lib/queryClient'
import { auth } from '@/auth'
import { NavBar } from '@/components/layout/NavBar'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'SpecStat',
  description: 'GitHub-native spec management & visualization',
}

// Runs before React hydration to prevent dark-mode flash
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <QueryProvider>
            {session && <NavBar />}
            <main className={session ? 'pt-14' : ''}>{children}</main>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
