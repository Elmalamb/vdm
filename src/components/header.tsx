
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

export function Header() {
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
                <div className="grid gap-4 py-4 pt-8">
                  <Input id="email-login" type="email" placeholder="Email" />
                  <Input id="password-login" type="password" placeholder="Mot de passe" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-black text-white hover:bg-black/80">Se connecter</Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="signup">
                <div className="grid gap-4 py-4 pt-8">
                  <Input id="email-signup" type="email" placeholder="Email" />
                  <Input id="password-signup" type="password" placeholder="Mot de passe" />
                  <Input id="confirm-password-signup" type="password" placeholder="Confirmer le mot de passe" />
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-black text-white hover:bg-black/80">S'inscrire</Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
}
