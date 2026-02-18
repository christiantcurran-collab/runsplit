import RequireAuth from "@/components/RequireAuth";
import SubscriptionGate from "@/components/SubscriptionGate";
import CoachBubble from "@/components/CoachBubble";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <SubscriptionGate>
        {children}
        <CoachBubble />
      </SubscriptionGate>
    </RequireAuth>
  );
}






