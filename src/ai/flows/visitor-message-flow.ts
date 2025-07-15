'use server';
/**
 * @fileOverview Un agent IA pour transmettre les messages des visiteurs aux vendeurs.
 * 
 * - forwardVisitorMessage - Une fonction qui gère la transmission du message.
 * - VisitorMessageInput - Le type d'entrée pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Schéma pour les entrées de la fonction de transmission de message.
const VisitorMessageInputSchema = z.object({
  visitorEmail: z.string().email().describe("L'adresse e-mail du visiteur."),
  visitorMessage: z.string().describe("Le message du visiteur pour le vendeur."),
  adTitle: z.string().describe("Le titre de l'annonce concernée."),
  sellerEmail: z.string().email().describe("L'adresse e-mail du vendeur."),
});
export type VisitorMessageInput = z.infer<typeof VisitorMessageInputSchema>;

// Schéma pour la sortie (simple confirmation).
const VisitorMessageOutputSchema = z.object({
  success: z.boolean().describe("Indique si le message a été traité avec succès."),
});
export type VisitorMessageOutput = z.infer<typeof VisitorMessageOutputSchema>;


/**
 * Transmet le message d'un visiteur à un vendeur via un agent IA.
 * @param input Les détails du message du visiteur.
 * @returns Une promesse qui se résout avec le résultat de l'opération.
 */
export async function forwardVisitorMessage(input: VisitorMessageInput): Promise<VisitorMessageOutput> {
  return visitorMessageFlow(input);
}

// Définition du prompt pour l'agent IA.
const visitorMessagePrompt = ai.definePrompt({
  name: 'visitorMessagePrompt',
  input: { schema: VisitorMessageInputSchema },
  output: { schema: z.object({ analysis: z.string() }) }, // Sortie simple pour l'analyse interne
  prompt: `
    Vous êtes un assistant de modération pour un site de petites annonces.
    Un visiteur souhaite contacter un vendeur. Analysez le message suivant et déterminez s'il est approprié et non un spam.

    Titre de l'annonce : {{{adTitle}}}
    Email du visiteur : {{{visitorEmail}}}
    Message du visiteur :
    "{{{visitorMessage}}}"

    Répondez uniquement par "approprié" si le message semble légitime, ou "inapproprié" s'il s'agit de spam, de contenu offensant ou d'une tentative de phishing. Ne donnez aucune autre explication.
  `,
});

// Définition du flow Genkit.
const visitorMessageFlow = ai.defineFlow(
  {
    name: 'visitorMessageFlow',
    inputSchema: VisitorMessageInputSchema,
    outputSchema: VisitorMessageOutputSchema,
  },
  async (input) => {
    console.log("Transmission du message du visiteur:", input.visitorEmail);

    // Étape 1: Analyser le message avec l'IA.
    const { output } = await visitorMessagePrompt(input);
    const analysis = output?.analysis?.trim().toLowerCase();

    console.log("Analyse de l'IA:", analysis);

    // Étape 2: Si le message est approprié, simuler l'envoi d'un e-mail.
    // Dans une application réelle, ici on appellerait un service d'envoi d'e-mails (ex: SendGrid, Resend).
    if (analysis === 'approprié') {
      console.log(`SIMULATION: Envoi d'un e-mail à ${input.sellerEmail}`);
      console.log(`De: ${input.visitorEmail}`);
      console.log(`Sujet: Nouveau message pour votre annonce "${input.adTitle}"`);
      console.log(`Corps du message: \n${input.visitorMessage}`);
      
      // Retourner succès.
      return { success: true };
    } else {
      // Si le message est inapproprié, ne rien faire et consigner l'incident.
      console.warn("Message du visiteur jugé inapproprié. Aucune action prise.", {
        visitorEmail: input.visitorEmail,
        adTitle: input.adTitle,
      });
      // Nous pouvons retourner `success: true` pour ne pas indiquer une erreur au spammeur potentiel.
      return { success: true };
    }
  }
);
