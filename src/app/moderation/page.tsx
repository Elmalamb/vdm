
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ads = [
  {
    id: "AD001",
    title: "Vélo de course vintage",
    user: "john.doe@example.com",
    status: "pending",
  },
  {
    id: "AD002",
    title: "Appareil photo reflex",
    user: "jane.smith@example.com",
    status: "approved",
  },
  {
    id: "AD003",
    title: "Table basse en chêne",
    user: "sam.wilson@example.com",
    status: "rejected",
  },
  {
    id: "AD004",
    title: "Collection de timbres rares",
    user: "lisa.ray@example.com",
    status: "pending",
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved":
      return "default";
    case "pending":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

export default function ModerationDashboardPage() {
  const { user, isModerator, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // La redirection est gérée par le layout
  }, [user, isModerator, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre de l'annonce</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell className="font-medium">{ad.title}</TableCell>
              <TableCell>{ad.user}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(ad.status)}>
                  {ad.status === 'pending' && 'En attente'}
                  {ad.status === 'approved' && 'Approuvée'}
                  {ad.status === 'rejected' && 'Rejetée'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/ad/${ad.id}`}>Voir</Link>
                  </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
