import './globals.css'
import { Bowlby_One_SC, Inter } from 'next/font/google'
import StoreSidebar from '@/components/StoreSidebar'
import MobileNav from '@/components/MobileNav'
import PageWrapper from '@/components/PageWrapper'
import Providers from '@/components/Providers'
import MaintenanceGuard from '@/components/MaintenanceGuard'
import ChatBot from '@/components/ChatBot'

const bowlby = Bowlby_One_SC({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cartoon',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata = {
  title: 'StreamCartoon - Assinaturas Premium',
  description: 'Sua loja de assinaturas de streaming com os melhores preços. Netflix, Disney+, HBO Max e muito mais!',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🎬</text></svg>',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${bowlby.variable} ${inter.variable}`}>
      <body className="scrollbar-custom min-h-screen">
        <Providers>
          <MaintenanceGuard>
            <StoreSidebar />
            <PageWrapper>
              {children}
            </PageWrapper>
            <MobileNav />
            <ChatBot />
          </MaintenanceGuard>
        </Providers>
      </body>
    </html>
  )
}
