require('./commands')(); //import helper commands
require('./secret/telegramkeys')(); //import api keys

const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');

app.listen(process.env.PORT);
app.use(bodyParser.json());

const baseURL = 'https://api.telegram.org/bot' + token + '/';

app.post('/', (request, response) => {
  try {
    const message = request.body.message;
    if (message) {
      const command = message.text;
      const chat_id = message.chat.id;
      runCommand(command).then(
        (text) => { sendTextMessage({ text: text, chat_id: chat_id }, response) });
    }
  } catch (e) {
    response.status(204).send(JSON.stringify({ status: 'failed to process and send message', error: e }));
  }
});

app.get('/qotd', (request, response) => {
  try {
    getRandomQuote().then(
      (text) => { sendTextMessage({ text: text, chat_id: my_chat_id }, response) });
  } catch (e) {
    response.status(400).send(JSON.stringify({ status: 'failed to send qotd', error: e }));
  }
});

app.get('/botd', (request, response) => {
  try {
    getBotd().then(
      (text) => { sendTextMessage({ text: text, chat_id: my_chat_id }, response) });
  } catch (e) {
    response.status(400).send(JSON.stringify({ status: 'failed to send botd', error: e }));
  }
});

app.get('/lotd', (request, response) => {
  try {
    const text = "Valley of Vision\nMy Utmost for His Highest";
    const entities = [
      { type: 'text_link', url: 'https://banneroftruth.org/us/valley/', offset: 0, length: 16 },
      { type: 'text_link', url: 'https://utmost.org/', offset: 17, length: 25 }
    ];
    sendTextMessage({ text: text, chat_id: my_chat_id, entities: entities, disable_web_page_preview: true }, response);
  } catch (e) {
    response.status(204).send(JSON.stringify({ status: 'failed to process and send message', error: e }));
  }
});

//Runs the command and sends a resulting success or failure message
function sendTextMessage(messageObj, response) {
  const url = baseURL + 'sendMessage';

  axios.post(url, messageObj)
    .then(res => {
      response.status(201).send(JSON.stringify({ status: 'success' }));
    })
    .catch(e => {
      response.status(202).send(JSON.stringify({ status: 'failed to send message', error: e }));
    });
};

// Commands are in the format (without curly braces):
//    /{command}/{value}/{field abbr} {field value}/{field abbr} {field value}...
//
// -- All leading/trailing whitespace is trimmed
// -- Any line breaks within the primary value are removed
async function runCommand(command) {
  const params = command.split('/').map((s) => { return s.trim() }).filter(Boolean);
  if (params && params.length >= 2) {
    params[0] = params[0].toLowerCase();
    return logItem(params);
  }
  else {
    return 'Invalid command syntax.'
  }
};


