
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { collection, onSnapshot, query, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const getStatusTranslation = (status: string) => {
    switch (status) {
        case 'approved': return 'Approuvée';
        case 'pending': return 'En attente';
        case 'rejected': return 'Rejetée';
        default: return status;
    }
};

export default function ModerationDashboardPage() {
  const { user, isModerator, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // La redirection est gérée par le layout
  }, [user, isModerator, authLoading, router]);

  useEffect(() => {
    const q = query(collection(db, "ads"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const adsData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        adsData.push({ id: doc.id, ...doc.data() });
      });
      setAds(adsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading || loading) {
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
            <TableCell>{ad.userEmail || 'N/A'}</TableCell>
            <TableCell className="font-medium">
              <Link href={`/ad/${ad.id}`} className="hover:underline">
                {ad.title}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(ad.status)}>
                {getStatusTranslation(ad.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right flex items-center justify-end gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>{ad.views || 0}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
