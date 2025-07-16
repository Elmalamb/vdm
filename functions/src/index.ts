
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const deleteAd = onCall(async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
  
    const { adId } = request.data;
    if (!adId || typeof adId !== 'string') {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a string 'adId' argument."
      );
    }
  
    const uid = request.auth.uid;
    const userDocRef = db.collection("users").doc(uid);
    
    try {
        const userDoc = await userDocRef.get();
        if (!userDoc.exists || userDoc.data()?.role !== 'moderateur') {
            throw new HttpsError(
                "permission-denied",
                "You must be a moderator to perform this action."
            );
        }

        await db.collection("ads").doc(adId).delete();
        logger.info(`Ad ${adId} successfully deleted by moderator ${uid}.`);
        return { success: true };

    } catch (error) {
      logger.error(`Error processing deleteAd for ad ${adId} by user ${uid}:`, error);
      if (error instanceof HttpsError) {
          throw error;
      }
      throw new HttpsError(
        "internal",
        "An unexpected error occurred."
      );
    }
});
