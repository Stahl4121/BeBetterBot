require('./commands')(); //import helper commands

const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');

app.listen(process.env.PORT);
app.use(bodyParser.json());

const token = '736303691:AAEOwCf4BOHVrs-0y_1zBqd5l8UKL73qow0';
const baseURL = 'https://api.telegram.org/bot' + token + '/';

app.post('/', async (request, response) => {
  try {
    const message = request.body.message;
    if (message) {
      sendTextMessage(message, response);
    }
  } catch (e) {
    response.status(204).send(JSON.stringify({ status: 'failed to send message', error: e }));
  }
});

function sendTextMessage(message, response) {
  runCommand(message.text).then((text) => {
    const chat_id = message.chat.id;
    const url = baseURL + 'sendMessage';

    axios.post(url, { chat_id: chat_id, text: text })
      .then(res => {
        response.status(201).send(JSON.stringify({ status: 'success' }));
      })
      .catch(e => {
        response.status(202).send(JSON.stringify({ status: 'failed to send message', error: e }));
      });
  });
}

async function runCommand(command) {
  const key = command.charAt(0).toLowerCase();
  const value = command.slice(1).trim();

  let result = '';

  switch (key) {
    case 'w':
      result = logWeight(value).then((msg) => { return msg; });
      break;
    case 'h':
      result = logHeartRate(value).then((msg) => { return msg; });
      break;
    default:
      result = 'No command \'' + key + '\' exists.'
  }

  return result;
};