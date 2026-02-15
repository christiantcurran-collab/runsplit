import RequireAuth from "@/components/RequireAuth";
import SubscriptionGate from "@/components/SubscriptionGate";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <SubscriptionGate>{children}</SubscriptionGate>
    </RequireAuth>
  );
}


