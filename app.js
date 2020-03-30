require('./commands')(); //import helper commands

const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');

app.listen(process.env.PORT);
app.use(bodyParser.json());

const token = '736303691:AAEOwCf4BOHVrs-0y_1zBqd5l8UKL73qow0';
const baseURL = 'https://api.telegram.org/bot' + token + '/';

app.post('/', (request, response) => {
  try {
    const message = request.body.message;
    if (message) {
      sendTextMessage(message.text, response);
    }
  } catch (e) {
    response.status(204).send(JSON.stringify({ status: 'failed to process and send message', error: e }));
  }
});

//Runs the command and sends a resulting success or failure message
function sendTextMessage(command, response) {
  runCommand(command).then((text) => {
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

// Commands are in the format (without curly braces):
//    /{command}/{value}/{field abbr} {field value}/{field abbr} {field value}...
//
// -- All leading/trailing whitespace is trimmed
// -- Any line breaks within the primary value are removed
async function runCommand(command) {
  const params = command.split('/').map((s) => { return s.trim() }).filter(Boolean);
  params[0] = params[0].toLowerCase();
  params[1] = params[1].replace(/(\r\n|\n|\r)/gm, ""); //Remove all line breaks in value
  return logItem(params);
};