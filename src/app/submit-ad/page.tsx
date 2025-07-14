
"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Film, ImageIcon } from "lucide-react";

const MAX_VIDEO_DURATION = 120; // 2 minutes in seconds
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const adSchema = z.object({
  title: z.string().min(5, { message: "Le titre doit contenir au moins 5 caractères." }),
  price: z.coerce.number().positive({ message: "Le prix doit être un nombre positif." }),
  postalCode: z.string().regex(/^\d{5}$/, { message: "Le code postal doit contenir 5 chiffres." }),
  image: z.instanceof(File).refine(file => file.size < MAX_FILE_SIZE, `La taille de l'image ne doit pas dépasser 100 Mo.`).refine(file => file.type.startsWith("image/"), "Le fichier doit être une image."),
  video: z.instanceof(File).refine(file => file.size < MAX_FILE_SIZE, `La taille de la vidéo ne doit pas dépasser 100 Mo.`).refine(file => file.type.startsWith("video/"), "Le fichier doit être une vidéo."),
});

type AdFormValues = z.infer<typeof adSchema>;

export default function SubmitAdPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      price: 0,
      postalCode: "",
    },
  });

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > MAX_VIDEO_DURATION) {
          form.setError("video", { type: "manual", message: `La vidéo ne doit pas dépasser ${MAX_VIDEO_DURATION / 60} minutes.` });
          setVideoPreview(null);
        } else {
          form.clearErrors("video");
          form.setValue("video", file);
          setVideoPreview(URL.createObjectURL(file));
        }
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const onSubmit = async (data: AdFormValues) => {
    setIsSubmitting(true);
    try {
      // Pour l'instant, on affiche juste les données.
      // Prochaines étapes : Uploader les fichiers sur Firebase Storage, puis sauvegarder les données dans Firestore.
      console.log("Données du formulaire soumises :", {
        title: data.title,
        price: data.price,
        postalCode: data.postalCode,
        imageName: data.image.name,
        videoName: data.video.name,
        userId: user?.uid,
      });

      toast({
        title: "Annonce Soumise !",
        description: "Votre annonce a été soumise avec succès pour examen.",
      });
      router.push("/");
    } catch (error) {
      console.error("Erreur lors de la soumission de l'annonce:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la soumission de votre annonce.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Soumettre une annonce</CardTitle>
          <CardDescription>Remplissez les informations ci-dessous pour publier votre annonce.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                          ) : (
                             <div className="text-muted-foreground flex flex-col items-center">
                               <ImageIcon className="h-16 w-16" />
                               <span className="mt-2 text-sm">Image de présentation</span>
                             </div>
                          )}
                        </div>
                      </FormControl>
                      <Input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="video"
                  render={({ field }) => (
                    <FormItem>
                       <FormControl>
                        <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {videoPreview ? (
                            <video ref={videoRef} src={videoPreview} controls className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-muted-foreground flex flex-col items-center">
                               <Film className="h-16 w-16" />
                               <span className="mt-2 text-sm">Vidéo (2min max)</span>
                             </div>
                          )}
                        </div>
                      </FormControl>
                      <Input type="file" accept="video/*" onChange={handleVideoChange} className="mt-2" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Titre de l'annonce" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" placeholder="Prix (€)" {...field} />
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
                      <FormControl>
                        <Input placeholder="Code Postal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Soumettre l'annonce
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
