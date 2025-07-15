
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Eye } from "lucide-react";
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
    views: 128,
  },
  {
    id: "AD002",
    title: "Appareil photo reflex",
    user: "jane.smith@example.com",
    status: "approved",
    views: 742,
  },
  {
    id: "AD003",
    title: "Table basse en chêne",
    user: "sam.wilson@example.com",
    status: "rejected",
    views: 54,
  },
  {
    id: "AD004",
    title: "Collection de timbres rares",
    user: "lisa.ray@example.com",
    status: "pending",
    views: 320,
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
            <TableHead>Utilisateur</TableHead>
            <TableHead>Titre de l'annonce</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Vues</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell>{ad.user}</TableCell>
              <TableCell className="font-medium">
                <Link href={`/ad/${ad.id}`} className="hover:underline">
                  {ad.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(ad.status)}>
                  {ad.status === 'pending' && 'En attente'}
                  {ad.status === 'approved' && 'Approuvée'}
                  {ad.status === 'rejected' && 'Rejetée'}
                </Badge>
              </TableCell>
              <TableCell className="text-right flex items-center justify-end gap-2">
                 <Eye className="h-4 w-4 text-muted-foreground" />
                 <span>{ad.views}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
