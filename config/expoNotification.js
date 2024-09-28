import { Expo } from 'expo-server-sdk';


let expo = new Expo();

// accessToken: process.env.EXPO_ACCESS_TOKEN,
//   useFcmV1: false // cela peut être défini sur true pour utiliser l'API FCM v1
// Crée les messages que vous souhaitez envoyer aux clients
let messages = [];
for (let pushToken of somePushTokens) {
  // Chaque jeton de notification ressemble à ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

  // Vérifie que tous vos jetons de notification semblent être des jetons de notification Expo valides
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Le jeton de notification ${pushToken} n'est pas un jeton de notification Expo valide`);
    continue;
  }

  // Construit un message (voir https://docs.expo.io/push-notifications/sending-notifications/)
  messages.push({
    to: pushToken,
    sound: 'default',
    body: 'Ceci est une notification de test',
    data: { withSome: 'data' },
  })
}

// Le service de notification push Expo accepte des lots de notifications de sorte que
// vous n'avez pas besoin d'envoyer 1000 requêtes pour envoyer 1000 notifications. Nous
// vous recommandons de regrouper vos notifications pour réduire le nombre de requêtes
// et les compresser (les notifications avec un contenu similaire seront
// compressées).
let chunks = expo.chunkPushNotifications(messages);
let tickets = [];
(async () => {
  // Envoie les lots au service de notification push Expo. Il existe
  // différentes stratégies que vous pourriez utiliser. Une stratégie simple consiste à envoyer un lot à la fois, ce qui répartit bien la charge sur le temps :
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
      // REMARQUE : Si un ticket contient un code d'erreur dans ticket.details.error, vous
      // devez le gérer correctement. Les codes d'erreur sont répertoriés dans la
      // documentation Expo :
      // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
    } catch (error) {
      console.error(error);
    }
  }
})();



// Plus tard, après que le service de notification push Expo ait distribué les
// notifications à Apple ou Google (habituellement rapidement, mais permettez au service
// jusqu'à 30 minutes en cas de charge), un "reçu" pour chaque notification est
// créé. Les reçus seront disponibles pendant au moins une journée ; les reçus périmés
// sont supprimés.
//
// L'identifiant de chaque reçu est renvoyé dans la réponse "ticket" pour chaque
// notification. En résumé, l'envoi d'une notification produit un ticket, qui
// contient un identifiant de reçu que vous utilisez ultérieurement pour obtenir le reçu.
//
// Les reçus peuvent contenir des codes d'erreur auxquels vous devez répondre. En
// particulier, Apple ou Google peuvent bloquer les applications qui continuent d'envoyer
// des notifications à des appareils ayant bloqué les notifications ou désinstallé
// votre application. Expo ne contrôle pas cette politique et renvoie les retours d'information d'Apple et de Google afin que vous puissiez les gérer correctement.
let receiptIds = [];
for (let ticket of tickets) {
  // REMARQUE : Tous les tickets n'ont pas d'identifiants ; par exemple, les tickets pour les notifications
  // qui n'ont pas pu être mis en file d'attente auront des informations sur l'erreur et aucun identifiant de reçu.
  if (ticket.id) {
    receiptIds.push(ticket.id);
  }
}

let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
(async () => {
  // Comme pour l'envoi de notifications, il existe différentes stratégies que vous pourriez utiliser
  // pour récupérer des lots de reçus auprès du service Expo.
  for (let chunk of receiptIdChunks) {
    try {
      let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      console.log(receipts);

      // Les reçus indiquent si Apple ou Google a reçu avec succès la
      // notification et des informations sur une erreur, le cas échéant.
      for (let receiptId in receipts) {
        let { status, message, details } = receipts[receiptId];
        if (status === 'ok') {
          continue;
        } else if (status === 'error') {
          console.error(
            `Une erreur s'est produite lors de l'envoi d'une notification : ${message}`
          );
          if (details && details.error) {
            // Les codes d'erreur sont répertoriés dans la documentation Expo :
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
            // Vous devez gérer les erreurs correctement.
            console.error(`Le code d'erreur est ${details.error}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
})();
