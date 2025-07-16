
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Eye, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { collection, getDocs, query, type DocumentData, doc, updateDoc } from "firebase/firestore";
import { db, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [ads, setAds] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // La redirection est gérée par le layout
  }, [user, isModerator, authLoading, router]);

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      const q = query(collection(db, "ads"));
      const querySnapshot = await getDocs(q);
      const adsData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        adsData.push({ id: doc.id, ...doc.data() });
      });
      setAds(adsData.filter(ad => ad.status !== 'rejected'));
      setLoading(false);
    }

    if (isModerator) {
      fetchAds();
    }
  }, [isModerator]);

  const handleUpdateStatus = async (adId: string, status: 'approved') => {
    const adRef = doc(db, "ads", adId);
    try {
      await updateDoc(adRef, { status });
      setAds(prevAds => prevAds.map(ad => ad.id === adId ? { ...ad, status } : ad));
      toast({
        title: "Statut mis à jour",
        description: `L'annonce a été approuvée.`,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toast({
        title: "Erreur",
        description: "La mise à jour du statut a échoué.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAd = async (adId: string, isRejection: boolean = false) => {
    const deleteAdFunction = httpsCallable(functions, 'deleteAd');
    try {
      await deleteAdFunction({ adId });
      setAds(prevAds => prevAds.filter(ad => ad.id !== adId));
      toast({
        title: isRejection ? "Annonce rejetée" : "Annonce supprimée",
        description: isRejection ? "L'annonce a été rejetée et supprimée." : "L'annonce a été supprimée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annonce:", error);
      toast({
        title: "Erreur",
        description: "La suppression de l'annonce a échoué.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const renderActions = (ad: DocumentData) => {
    switch (ad.status) {
      case 'pending':
        return (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="icon" onClick={() => handleUpdateStatus(ad.id, 'approved')}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => handleDeleteAd(ad.id, true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'approved':
        return (
          <Button variant="destructive" size="icon" onClick={() => handleDeleteAd(ad.id)}>
            <X className="h-4 w-4" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Utilisateur</TableHead>
          <TableHead>Titre de l'annonce</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Vues</TableHead>
          <TableHead className="text-right">Actions</TableHead>
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
             <TableCell>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>{ad.views || 0}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              {renderActions(ad)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
