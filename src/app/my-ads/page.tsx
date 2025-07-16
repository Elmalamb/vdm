
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { collection, query, where, onSnapshot, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

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

export default function MyAdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const q = query(collection(db, "ads"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const adsData: DocumentData[] = [];
        querySnapshot.forEach((doc) => {
          adsData.push({ id: doc.id, ...doc.data() });
        });
        setAds(adsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching ads:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Mes Annonces</CardTitle>
          <CardDescription>Consultez le statut et les performances de vos annonces.</CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Vous n'avez aucune annonce pour le moment.</p>
                <Button asChild className="mt-4">
                    <Link href="/submit-ad">Publier ma première annonce</Link>
                </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.price}€</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ad.status)}>
                        {getStatusTranslation(ad.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{ad.views || 0}</span>
                      </div>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
