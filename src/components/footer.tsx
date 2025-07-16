import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full bg-background border-t py-4 text-center text-sm text-muted-foreground">
      <div className="container mx-auto">
        <p>&copy; {new Date().getFullYear()} VenteDémo. Tous droits réservés.</p>
      </div>
    </footer>
  );
};
