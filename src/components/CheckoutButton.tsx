"use client";

import { useState } from "react";

interface CheckoutButtonProps {
  children: React.ReactNode;
  className?: string;
  plan?: "monthly" | "annual";
  onClick?: () => void;
}

export default function CheckoutButton({
  children,
  className = "",
  plan = "monthly",
  onClick,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick();
    
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

