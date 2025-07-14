
"use client";

import Link from 'next/link';
import { LogIn, Package2, Plus } from 'lucide-react';
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

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
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Connexion réussie." });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      toast({ title: "Erreur de connexion", description: "Veuillez vérifier vos identifiants.", variant: "destructive" });
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Inscription réussie.", description: "Vous pouvez maintenant vous connecter." });
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      toast({ title: "Erreur d'inscription", description: "Cette adresse e-mail est peut-être déjà utilisée.", variant: "destructive" });
    }
  };

  return (
    <header className="px-4 lg:px-6 h-14 flex items-center bg-background border-b">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Package2 className="h-6 w-6" />
        <span className="font-bold">Black Void</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
        <Dialog>
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
                    <DialogFooter className="justify-center pt-2">
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
                    <DialogFooter className="justify-center pt-2">
                      <Button type="submit" className="bg-black text-white hover:bg-black/80">S'inscrire</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
}
