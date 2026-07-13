import { LayoutGrid } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--shell-page-bg)] p-4">
      <div className="w-full max-w-sm rounded-[18px] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-14px_rgba(0,0,0,.12)]">
        <div className="flex flex-col items-center gap-3 pb-6 text-center">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-[var(--shell-accent)]">
            <LayoutGrid className="size-5 text-[#0E0F11]" />
          </div>
          <div>
            <h1 className="text-[19px] font-bold tracking-tight text-[#17181B]">Northgate LMS</h1>
            <p className="mt-1 text-[13px] text-[#17181B]/50">Sign in to your account</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
