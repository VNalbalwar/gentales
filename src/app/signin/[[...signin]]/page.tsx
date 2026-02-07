import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Sign In — GenTales",
  description: "Sign in to GenTales to start creating and discovering stories.",
};

export default function SignInPage() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-primary/10 blur-[80px]" />
        <div className="absolute bottom-20 left-20 w-72 h-72 rounded-full bg-pink-500/10 blur-[80px]" />
      </div>

      <div className="relative">
        <SignIn
          forceRedirectUrl="/feed"
          appearance={{
            variables: {
              colorPrimary: "#7c3aed",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "shadow-xl border border-[var(--border)]",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted",
              socialButtonsBlockButton:
                "border-[var(--border)] hover:bg-[var(--primary-soft)]",
              formButtonPrimary:
                "bg-[var(--primary)] hover:bg-[var(--primary-hover)]",
              footerActionLink: "text-[var(--primary)] hover:text-[var(--primary-hover)]",
            },
          }}
        />
      </div>
    </section>
  );
}
