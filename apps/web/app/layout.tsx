import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { QueryProvider } from '@/lib/queryClient'
import { auth } from '@/auth'
import { NavBar } from '@/components/layout/NavBar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpecStat',
  description: 'GitHub-native spec management & visualization',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en">
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
