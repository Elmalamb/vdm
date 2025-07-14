
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
import { Label } from "@/components/ui/label";
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email-login" className="text-right">
                      Email
                    </Label>
                    <Input id="email-login" type="email" placeholder="m@example.com" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password-login" className="text-right">
                      Mot de passe
                    </Label>
                    <Input id="password-login" type="password" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Se connecter</Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="signup">
                <div className="grid gap-4 py-4 pt-8">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email-signup" className="text-right">
                      Email
                    </Label>
                    <Input id="email-signup" type="email" placeholder="m@example.com" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password-signup" className="text-right">
                      Mot de passe
                    </Label>
                    <Input id="password-signup" type="password" className="col-span-3" />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirm-password-signup" className="text-right">
                      Confirmer
                    </Label>
                    <Input id="confirm-password-signup" type="password" className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">S'inscrire</Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
}
