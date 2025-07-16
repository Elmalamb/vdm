
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  ];

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
           <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6" />
            <CardTitle>Espace Modération</CardTitle>
          </div>
          <CardDescription>Gérez les annonces et communiquez avec les vendeurs.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
