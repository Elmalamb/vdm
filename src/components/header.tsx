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
              <DialogTitle>Login</DialogTitle>
              <DialogDescription>
                Enter your credentials to access your account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" placeholder="m@example.com" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" type="password" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Login</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
}