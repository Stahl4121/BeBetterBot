//Reset

const admin = require("firebase-admin");
const serviceAccount = require("./secret/bebettertelegrambot-firebase-adminsdk-j5p2w-71e0813985.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bebettertelegrambot.firebaseio.com"
});

const docRef = admin.firestore().collection('admin').doc('bibleReading');
const promise = docRef.get().then(doc => {
  const docData = doc.data();
  const c = {1:1,2:1,3:1,4:1,5:1,6:1};
  const a = {1:1,2:1,3:1,4:1,5:1,6:1};
  
  docRef.update({ current: c, assigned: a }); //Update database with incremented values for day
});