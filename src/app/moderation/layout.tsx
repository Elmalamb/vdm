
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ModerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isModerator, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isModerator) {
      router.push("/");
    }
  }, [user, isModerator, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isModerator) {
    return null;
  }

  const navItems = [
    { href: "/moderation", label: "Tableau de modération" },
    { href: "/moderation/messaging", label: "Messagerie" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-1.5 p-6">
         <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6" />
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Espace Modération</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gérez les annonces et communiquez avec les vendeurs.</p>
      </div>
      <div className="p-6 pt-0">
        <div className="flex border-b mb-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "py-2 px-4 -mb-px border-b-2 text-sm font-medium",
                pathname === item.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
