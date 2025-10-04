
// Route group layout for (public) – intentionally minimal to avoid duplicating global layout.
// The root `src/app/layout.tsx` already renders AnnouncementBar, Header, Footer, etc.
// Keeping this file (rather than deleting) preserves the route group while preventing double UI.
export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
