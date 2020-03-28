//Helper commands for BeBetterBot
module.exports = function () {
  const admin = require("firebase-admin");
  const serviceAccount = require("./secret/bebettertelegrambot-firebase-adminsdk-j5p2w-71e0813985.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bebettertelegrambot.firebaseio.com"
  });


  this.getVerses = function (val) {
    return '';
  };

  this.logWeight = async function (val) {
    const params = val.split(',').filter(Boolean).map((s) => { return s.trim() });
    let date = admin.firestore.Timestamp.now();
    let notes = '';

    for (var i = 1; i < params.length; i++) {
      if (params[i].charAt(0) === '#') {
        //Remove param from array and split into parts
        const param = params.splice(1, 1).toString();
        const command = param.slice(1, 2).toLowerCase();
        const content = param.slice(2, param.length);

        switch (command) {
          //Example #d4/19 to specify April 19 of current year
          case 'd':
            const year = new Date(Date.now()).getFullYear();
            const month = content.split('/')[0];
            const day = content.split('/')[1];
            date = admin.firestore.Timestamp.fromDate(new Date(year, month - 1, day, 12));
            break;
          default:
        }
      }
    }

    //If one more param, then it's notes
    if (params.length == 2) {
      notes = params[1];
    }
    else if (params.length > 2) {
      return "Error, invalid parameters."
    }

    let data = { type: 'weight', value: params[0], date: date, notes: notes };

    const retVal = admin.firestore().collection('healthStats').doc('w'+String(data.date.toMillis())).set(data)
      .then(function () {
        return "Success!"
      })
      .catch(function (error) {
        return "Error: " + error.message;
      });


    return retVal;
  };

  this.logHeartRate = async function (val) {
    const params = val.split(',').filter(Boolean).map((s) => { return s.trim() });
    let date = admin.firestore.Timestamp.now();
    let notes = '';

    //If one more param, then it's notes
    if (params.length == 2) {
      notes = params[1];
    }
    else if (params.length > 2) {
      return "Error, invalid parameters."
    }

    let data = { type: 'heartrate', value: params[0], date: date, notes: notes };

    const retVal = admin.firestore().collection('healthStats').doc('h'+String(data.date.toMillis())).set(data)
      .then(function () {
        return "Success!"
      })
      .catch(function (error) {
        return "Error: " + error.message;
      });


    return retVal;
  };
}