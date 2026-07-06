export default function CyAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(220,25%,12%),_hsl(220,20%,7%))] text-white">
      {children}
    </div>
  );
}
