export async function sendPushNotification(token: string, title: string, body: string) {
  if (!token) return;

  const message = {
    to: token,
    notification: {
      title,
      body,
    }
  };

  await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      "Authorization": "key=" + process.env.FCM_SERVER_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
