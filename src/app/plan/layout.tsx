import RequireAuth from "@/components/RequireAuth";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}


