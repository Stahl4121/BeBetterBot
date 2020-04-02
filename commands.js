// Helper commands for BeBetterBot

// w - Log weight { n: notes, d: date (MMDD)}
// hr - Log heartrate { n: notes, d: date (MMDD)}
// q - Log quote  {t: type, n: notes, nl: remove newlines, a: author, sa: secondary_author, s: source, ss: secondary_source, p: page }
// r - Log rating {t: type, n: notes, na: name}

module.exports = function () {
  const admin = require("firebase-admin");
  const serviceAccount = require("./secret/bebettertelegrambot-firebase-adminsdk-j5p2w-71e0813985.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bebettertelegrambot.firebaseio.com"
  });

  const abbr = {
    w: { type: 'weight', db: 'healthStats' },
    hr: { type: 'heartrate', db: 'healthStats' },
    q: { db: 'quotes', f: (p1,p2,p3) => logQuoteHelper(p1,p2,p3) },
    r: { db: 'ratings' }
  }
  const dbFields = { t: 'type', n: 'notes', na: 'name', a: 'author', sa: 'secondary_author', s: 'source', ss: 'secondary_source', p: 'page' }

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
    const data = { value: value, date: date };

    if (type) data.type = type;

    //Handle extra parameters in the command
    for (var i = 2; i < params.length; i++) {
      const index = params[i].indexOf(' ');
      const command = (index === -1) ? params[i] : params[i].slice(0, index);
      const content = (index === -1) ? '' : params[i].slice(index + 1);

      switch (command) {
        //e.g. "/d 0419" to specify April 19 of current year
        case 'd':
          const year = new Date(Date.now()).getFullYear();
          const month = content.substring(0, 2);
          const day = content.substring(2, 4);
          const customDate = admin.firestore.Timestamp.fromDate(new Date(year, month - 1, day, 12));
          data.date = customDate;
          break;
        default:
          if (dbFields.hasOwnProperty(command)) data[dbFields[command]] = content; //Fields w/o processing
          else if (func) func(data, command, content); //Isolate specific functionality
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

  logQuoteHelper = function (data, command, content) {
    switch (command) {
      case 'nl':
        data.value = data.value.replace(/(\r\n|\n|\r)/gm, " "); //Remove all line breaks in quote
        break;
      default:
    }
    return data;
  };

  this.getRandomQuote = async function () {
    //TODO: Refactor to solution that uses fewer firebase reads 
    //(sort by date, where 'used' = false, limit 1 ; update used property)
    //https://stackoverflow.com/questions/46554091/cloud-firestore-collection-count
    const promise = admin.firestore().collection('quotes').get().then(snap => {
      const idx = Math.floor(Math.random() * snap.size);
      const { value, author, source, date, page, secondary_author, secondary_source } = snap.docs[idx].data();
      let quote = value + '\n -- ';
      quote += (author) ? author : '?';
      quote += (source) ? (' in \"' + source + '\"') : '';
      
      if(secondary_source){
        quote += ('\n(found in \"' + secondary_source + '\"');
        quote += (secondary_author) ? (' by ' + secondary_author) : '';
        quote += (page) ? (', p. ' + page + ')') : ')';
      }

      return quote;
    });

    return promise;
  };
};