
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, type DocumentData } from 'firebase/firestore';

const adEditSchema = z.object({
  title: z.string().min(5, { message: "Le titre doit contenir au moins 5 caractères." }),
  postalCode: z.string().regex(/^\d{5}$/, { message: "Le code postal doit contenir 5 chiffres." }),
});

type AdEditFormValues = z.infer<typeof adEditSchema>;

export default function EditAdPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const adId = typeof params.id === 'string' ? params.id : '';

  const [ad, setAd] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdEditFormValues>({
    resolver: zodResolver(adEditSchema),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!adId || !user) return;

    const fetchAd = async () => {
      setLoading(true);
      const adRef = doc(db, 'ads', adId);
      const adSnap = await getDoc(adRef);

      if (adSnap.exists()) {
        const adData = adSnap.data();
        if (adData.userId === user.uid) {
          setAd(adData);
          form.reset({
            title: adData.title,
            postalCode: adData.postalCode,
          });
        } else {
          toast({ title: "Accès non autorisé", variant: "destructive" });
          router.push('/my-ads');
        }
      } else {
        toast({ title: "Annonce non trouvée", variant: "destructive" });
        router.push('/my-ads');
      }
      setLoading(false);
    };

    fetchAd();
  }, [adId, user, router, toast, form]);

  const onSubmit = async (data: AdEditFormValues) => {
    if (!adId) return;
    setIsSubmitting(true);
    try {
      const adRef = doc(db, 'ads', adId);
      await updateDoc(adRef, {
        title: data.title,
        postalCode: data.postalCode,
      });
      toast({ title: "Annonce mise à jour avec succès!" });
      router.push('/my-ads');
    } catch (error) {
      console.error("Erreur de mise à jour:", error);
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="flex-1 w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!ad) {
    return null; 
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Modifier l'annonce</CardTitle>
          <CardDescription>Mettez à jour les informations de votre annonce.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Titre de l'annonce" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Postal</FormLabel>
                    <FormControl>
                      <Input placeholder="Code Postal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Mettre à jour
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
