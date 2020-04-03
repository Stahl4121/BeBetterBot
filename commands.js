// Helper commands for BeBetterBot

// _ - {n, d}
// hr - {n, d (MMDD)}
// q - {t, n, nl, a, sa, s, ss, p }
// r - {t, n, na}

module.exports = function () {
  const admin = require("firebase-admin");
  const serviceAccount = require("./secret/bebettertelegrambot-firebase-adminsdk-j5p2w-71e0813985.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bebettertelegrambot.firebaseio.com"
  });

  const ABBR = {
    health: {
      db: 'healthStats',
      fields: { t: 'type' }
    },
    w: {
      type: 'weight', db: 'healthStats',
      fields: {}
    },
    hr: {
      type: 'heartrate', db: 'healthStats',
      fields: {}
    },
    q: {
      db: 'quotes', f: (p1, p2) => logQuoteHelper(p1, p2),
      fields: { t: 'type', a: 'author', sa: 'secondary_author', s: 'source', ss: 'secondary_source', p: 'page' }
    },
    r: {
      db: 'ratings',
      fields: { t: 'type', na: 'name', a: 'author', s: 'source' }
    },
    b: {
      db: 'bibleReadings', f: (p1, p2) => logBibleHelper(p1, p2),
      fields: {}
    }
  }

  this.logItem = async function (params) {
    const key = params[0];

    if (!ABBR.hasOwnProperty(key)) {
      return 'No command \'' + key + '\' exists.';
    }

    //Read in universal properties
    const value = params[1];
    const db = ABBR[key].db;
    const type = ABBR[key].type;
    const dbFields = ABBR[key].fields;
    const func = ABBR[key].f;
    const date = admin.firestore.Timestamp.now();
    const data = { value: value, date: date };

    if (type) data.type = type; //Set type if default exists

    //Handle extra parameters in the command
    for (var i = 2; i < params.length; i++) {
      const index = params[i].indexOf(' ');
      const command = (index === -1) ? params[i] : params[i].slice(0, index);
      const content = (index === -1) ? '' : params[i].slice(index + 1);

      switch (command.toLowerCase()) {
        //e.g. "/d 0419" to specify April 19 of current year
        case 'd':
          const year = new Date(Date.now()).getFullYear();
          const month = content.substring(0, 2);
          const day = content.substring(2, 4);
          const customDate = admin.firestore.Timestamp.fromDate(new Date(year, month - 1, day, 12));
          data.date = customDate;
          break;
        case 'n':
          data.notes = content;
          break;
        default:
          if (dbFields.hasOwnProperty(command)) data[dbFields[command]] = content; //Fields w/o processing
      }
    }

    if (func) func(data, params); //Isolate specific functionality
    console.log(data.value + " " + data.chapters);

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

  logQuoteHelper = function (data, params) {
    //Remove all line breaks in quote
    if (params.includes('nl')) data.value = data.value.replace(/(\r\n|\n|\r)/gm, " ");

    return data;
  };

  logBibleHelper = async function (data, params) {
    const len = Object.keys(BOOKS_OF_BIBLE).length;
    const numInSectionsRead = new Array(len).fill(0);
    if (data.value.charAt(0).toLowerCase() === 'a') numInSectionsRead.fill(1);

    for (var i = 2; i < params.length; i++) {
      const section = params[i].slice(0, 1);
      const numRead = params[i].slice(1);
      numInSectionsRead[section] = numRead;
    }
    data.value = numInSectionsRead;
    data.total = numInSectionsRead.reduce((a, b) => a + b, 0);
    data.chapters = '';

    const docRef = admin.firestore().collection('admin').doc('bibleReading');
    const promise = docRef.get().then(doc => {
      const data = doc.data();
      const c = data.current;
      const a = data.assigned;

      //For logging purposes
      const before = data.current.slice();
      const now = data.current.slice();

      Object.keys(BOOKS_OF_BIBLE).forEach((section, i) => {
        now[section] += (numInSectionsRead[i] - 1);
        c[section] += (numInSectionsRead[i]);
        //Do not allow assigned reading to follow behind current
        if (c[section] - 1 > a[section]) a[section] = c[section] - 1; 
      });
      data.chapters = formatBibleReading(before, now);

      docRef.update({ current: c, assigned: a }); //Update database with incremented values for day
    });

    return promise;
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

      if (secondary_source) {
        quote += ('\n(found in \"' + secondary_source + '\"');
        quote += (secondary_author) ? (' by ' + secondary_author) : '';
        quote += (page) ? (', p. ' + page + ')') : ')';
      }

      return quote;
    });

    return promise;
  };

  const BOOKS_OF_BIBLE = {
    1: { Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34 },
    2: { '1 Chronicles': 29, '2 Chronicles': 36, Joshua: 24, Judges: 21, Ruth: 4, '1 Samuel': 31, '2 Samuel': 24, '1 Kings': 22, '2 Kings': 25, Ezra: 10, Nehemiah: 13, Esther: 10 },
    3: { Job: 42, Psalms: 150, Proverbs: 31, Ecclesiastes: 12, 'Song of Solomon': 8 },
    4: { Isaiah: 66, Jeremiah: 52, Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4 },
    5: { Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28 },
    6: { Romans: 16, '1 Corinthians': 16, '2 Corinthians': 13, Galatians: 6, Ephesians: 6, Philippians: 4, Colossians: 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, Titus: 3, Philemon: 1, Hebrews: 13, James: 5, '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1, Jude: 1, Revelation: 22 }
  }

  formatBibleReading = function (start, end) {
    //Helper function
    numToBookAndChapter = function (section, num) {
      const b = BOOKS_OF_BIBLE[section];
      for (const k in b) {
        if (num <= b[k]) return [k, num];
        else num = num - b[k];
      }
      return numToBookAndChapter(section, num); //Wrap around if at end of section
    };

    let msg = '';

    Object.keys(BOOKS_OF_BIBLE).forEach((section, i) => {
      //Handle case needed for logging chapters read
      if (start[section] < end[section]) {
        const [startBook, startChapter] = numToBookAndChapter(section, start[section]);
        const [endBook, endChapter] = numToBookAndChapter(section, end[section]);
        msg += startBook + ' ' + startChapter;

        if (startBook === endBook) {
          if (startChapter !== endChapter) msg += '-' + endChapter;
        }
        else msg += ' - ' + endBook + ' ' + endChapter;

        if (i !== Object.keys(BOOKS_OF_BIBLE).length - 1) msg += ', ';
      }
    });
    return msg;
  }

  this.getBotd = async function () {
    const docRef = admin.firestore().collection('admin').doc('bibleReading');
    const promise = docRef.get().then(doc => {
      const data = doc.data();
      const c = data.current;
      const a = data.assigned;
      Object.keys(BOOKS_OF_BIBLE).forEach((section) => { a[section] += 1; }); //Increment chapter per day

      docRef.update({ assigned: a }); //Update database with incremented values for day

      return formatBibleReading(c, a);
    });

    return promise;
  };
};