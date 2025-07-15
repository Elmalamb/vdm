
"use client";

import Link from 'next/link';
import { LogIn, Package2, Plus, LogOut, MessageSquare } from 'lucide-react';
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
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
  const { user, loading, isModerator, hasUnreadMessages } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      toast({ title: "Erreur de connexion", description: "Veuillez vérifier vos identifiants.", variant: "destructive" });
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "membre",
        uid: user.uid
      });

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

  const supportLink = isModerator ? "/moderation/messaging" : "/support";

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Package2 className="h-6 w-6" />
        <span className="font-bold">Black Void</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        {!loading && (
          <>
            {user ? (
              <>
                {!isModerator && (
                  <Button asChild variant="outline" size="icon">
                    <Link href="/submit-ad">
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="icon" className="relative">
                  <Link href={supportLink}>
                    <MessageSquare className="h-4 w-4" />
                     {hasUnreadMessages && (
                      <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </Link>
                </Button>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
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
