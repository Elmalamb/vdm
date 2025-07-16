
"use client";

import Link from 'next/link';
import { LogIn, LogOut, LayoutList, Plus, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  password: z.string().min(1, { message: "Le mot de passe ne peut pas être vide." }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide." }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }),
});


export function Header() {
  const { toast } = useToast();
  const { user, loading, isModerator } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        toast({
          title: "Vérification requise",
          description: "Veuillez vérifier votre adresse e-mail avant de vous connecter. Un lien a été envoyé dans votre boîte de réception.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Connexion réussie." });
      setIsDialogOpen(false);
      loginForm.reset();
    } catch (error) {
      console.error("Erreur de connexion:", error);
      let description = "Une erreur inconnue s'est produite.";
      if ((error as AuthError).code === 'auth/invalid-credential') {
        description = "L'adresse e-mail ou le mot de passe est incorrect.";
      }
      toast({ title: "Erreur de connexion", description, variant: "destructive" });
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      
      // La création du document utilisateur est maintenant gérée par une Cloud Function.

      toast({ title: "Inscription réussie.", description: "Veuillez consulter votre boîte mail pour vérifier votre compte." });
      setIsDialogOpen(false);
      signupForm.reset();
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      if ((error as AuthError).code === 'auth/email-already-in-use') {
        toast({ title: "Erreur d'inscription", description: "Cette adresse e-mail est déjà utilisée.", variant: "destructive" });
      } else {
        toast({ title: "Erreur d'inscription", description: "Une erreur s'est produite lors de l'inscription.", variant: "destructive" });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Déconnexion réussie." });
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      toast({ title: "Erreur de déconnexion", variant: "destructive" });
    }
  };
  
  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-blue-950 text-white border-b sticky top-0 z-20">
      <Link href="/" className="flex items-center justify-center gap-2" aria-label="Retour à l'accueil">
        <span className="font-bold text-white">VenteDémo</span>
        <Handshake className="h-6 w-6 text-red-600" />
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        {!loading && (
          <>
            {user ? (
              <>
                {isModerator ? (
                   null
                ) : (
                  <>
                    <Button asChild variant="ghost" size="icon">
                       <Link href="/my-ads">
                          <LayoutList className="h-4 w-4" />
                       </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon">
                       <Link href="/submit-ad">
                          <Plus className="h-4 w-4" />
                       </Link>
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LogIn className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Authentification</DialogTitle>

                    <DialogDescription className="sr-only">
                      Choisissez votre méthode préférée pour vous connecter ou créer un compte.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="login">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Connexion</TabsTrigger>
                      <TabsTrigger value="signup">Inscription</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="grid gap-4 py-4 pt-8">
                          <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="email" placeholder="Email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="password" placeholder="Mot de passe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="flex-col sm:flex-row sm:justify-center pt-2">
                            <Button type="submit" className="bg-black text-white hover:bg-black/80">Se connecter</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </TabsContent>
                    <TabsContent value="signup">
                      <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="grid gap-4 py-4 pt-8">
                          <FormField
                            control={signupForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="email" placeholder="Email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signupForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="password" placeholder="Mot de passe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter className="flex-col sm:flex-row sm:justify-center pt-2">
                            <Button type="submit" className="bg-black text-white hover:bg-black/80">S'inscrire</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
