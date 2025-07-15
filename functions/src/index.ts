/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface VisitorMessageData {
    visitorEmail: string;
    adId: string;
    adTitle: string;
    sellerEmail: string;
    message: string;
}

export const sendVisitorMessage = onCall({ cors: true }, async (request) => {
    const { visitorEmail, adId, adTitle, sellerEmail, message } = request.data as VisitorMessageData;

    logger.info("Received visitor message:", { visitorEmail, adId });

    if (!visitorEmail || !adId || !message) {
        throw new Error("Missing required fields");
    }

    try {
        const supportChatId = `visitor_${visitorEmail.replace(/[^a-zA-Z0-9]/g, '_')}_ad_${adId}`;
        const supportChatRef = db.doc(`supportChats/${supportChatId}`);

        const initialMessage = `
          Nouveau message d'un visiteur pour l'annonce : "${adTitle}" (ID: ${adId})
          Vendeur: ${sellerEmail}
          Email du visiteur: ${visitorEmail}
          
          Message:
          ${message}
        `;

        await supportChatRef.set({
            userEmail: `Visiteur: ${visitorEmail}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await supportChatRef.collection('messages').add({
            text: initialMessage,
            senderId: 'visitor',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        logger.info("Successfully created support chat and message for visitor:", visitorEmail);
        return { success: true };

    } catch (error) {
        logger.error("Error sending visitor message:", error);
        throw new Error("Failed to send message.");
    }
});
