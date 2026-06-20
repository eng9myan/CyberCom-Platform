import './globals.css'

export const metadata = {
  title: 'CYShop Commerce OS',
  description: 'Enterprise Tenant Core Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
