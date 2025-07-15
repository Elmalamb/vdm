
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Données statiques pour les conversations.
// Idéalement, elles proviendraient de Firestore, en listant les documents de la collection 'chats'.
const conversations = [
  {
    adId: "AD001",
    adTitle: "Vélo de course vintage",
    sellerEmail: "john.doe@example.com",
    lastMessage: "Bonjour, est-ce que vous pouvez ajouter une photo du dérailleur ?",
    unreadCount: 2,
  },
  {
    adId: "AD004",
    adTitle: "Collection de timbres rares",
    sellerEmail: "lisa.ray@example.com",
    lastMessage: "Votre annonce a été approuvée !",
    unreadCount: 0,
  },
];

export default function MessagingPage() {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Annonce</TableHead>
            <TableHead>Vendeur</TableHead>
            <TableHead>Dernier Message</TableHead>
            <TableHead className="text-center">Notifications</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.map((conv) => (
            <TableRow key={conv.adId}>
              <TableCell className="font-medium">{conv.adTitle}</TableCell>
              <TableCell>{conv.sellerEmail}</TableCell>
              <TableCell className="text-muted-foreground truncate max-w-xs">{conv.lastMessage}</TableCell>
              <TableCell className="text-center">
                {conv.unreadCount > 0 && (
                  <Badge variant="destructive">{conv.unreadCount}</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/ad/${conv.adId}`}>Ouvrir le chat</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
