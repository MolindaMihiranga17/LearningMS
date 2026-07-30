import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <AuthCard title="Northgate LMS" description="Sign in to your account">
      <LoginForm />
    </AuthCard>
  );
}
