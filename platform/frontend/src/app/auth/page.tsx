"use client";

import { useEffect } from "react";
import { initiateLogin } from "@/lib/auth";

export default function AuthPage() {
  useEffect(() => {
    initiateLogin(`${window.location.origin}/auth/callback`);
  }, []);

  return (
    <div className="login-container" role="main" aria-label="Redirecting to login">
      <div className="login-card glass-card">
        <h1>CyberCom</h1>
        <p className="login-subtitle">جاري تحويلك لصفحة تسجيل الدخول...</p>
        <p className="login-subtitle">Redirecting to secure login...</p>
      </div>
    </div>
  );
}
