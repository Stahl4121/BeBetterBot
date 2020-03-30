//Helper commands for BeBetterBot
module.exports = function () {
  const admin = require("firebase-admin");
  const serviceAccount = require("./secret/bebettertelegrambot-firebase-adminsdk-j5p2w-71e0813985.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bebettertelegrambot.firebaseio.com"
  });

  const abbr = {
    w: { type: 'weight', db: 'healthStats' },
    h: { type: 'heartrate', db: 'healthStats' },
    q: { db: 'quotes', f: () => { } },
    r: { db: 'ratings' }
  }
  const dbFields = { t: 'type', n: 'notes', 'na': name, a: 'author', sa: 'secondary_author', s: 'source', ss: 'secondary_source', p: 'page' }

  this.logItem = async function (params) {
    const key = params[0];

    if (!abbr.hasOwnProperty(key)) {
      return 'No command \'' + key + '\' exists.';
    }

    //Read in universal properties
    const value = params[1];
    const db = abbr[key].db;
    const type = abbr[key].type;
    const func = abbr[key].f;
    const date = admin.firestore.Timestamp.now();
    let data = { value: value, date: date };

    if (type) data = { ...data, type: type };

    //Handle extra parameters in the command
    for (var i = 2; i < params.length; i++) {
      const index = params[i].indexOf(' ');
      const command = params[i].slice(0, index);
      const content = params[i].slice(index + 1);

      switch (command) {
        //e.g. "/d 0419" to specify April 19 of current year
        case 'd':
          const year = new Date(Date.now()).getFullYear();
          const month = content.substring(0, 2);
          const day = content.substring(2, 4);
          const customDate = admin.firestore.Timestamp.fromDate(new Date(year, month - 1, day, 12));
          data = { ...data, date: customDate };
          break;
        default:
          if (dbFields.hasOwnProperty(command)) { data = { ...data, [dbFields[command]]: content } } //Fields w/o processing
          else if (func) data = func(data, command, content); //Isolate specific functionality
      }
    }

    const docId = key + String(data.date.toMillis());
    const promise = admin.firestore().collection(db).doc(docId).set(data)
      .then(function () {
        return "Success!"
      })
      .catch(function (error) {
        return "Error: " + error.message;
      });

    return promise;
  };

  this.getRandomQuote = async function () {
    //TODO: Refactor to solution that uses fewer firebase reads
    //https://stackoverflow.com/questions/46554091/cloud-firestore-collection-count
    const promise = admin.firestore().collection('quotes').get().then(snap => {
      const idx = Math.floor(Math.random() * snap.size);
      const { value, author, source, date, page, secondary_author, secondary_source } = snap.docs[idx].data();
      
      return value + '\n' +
        ' --' + author + ' in ' + source + '\n' +
        '(found in ' + secondary_source + ' by ' + secondary_author + ', p. ' + page + ')';
    });

    return promise;
  };
};