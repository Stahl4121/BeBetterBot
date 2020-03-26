const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');

app.use(bodyParser.json());

const token = '736303691:AAEOwCf4BOHVrs-0y_1zBqd5l8UKL73qow0';
const baseURL = 'https://api.telegram.org/bot' + token + '/';

app.post('/', async (request, response) => {
  try {
    const message = request.body.message;
    const text = message.text;
    const chat_id = message.chat.id;

    const resMessage = {
      chat_id: chat_id,
      text: text
    };
    const url = baseURL + 'sendMessage';

    axios.post(url, resMessage)
      .then(res => {
        response.status(201).send(JSON.stringify({ status: 'success' }));
      })
      .catch(e => {
        response.status(202).send(JSON.stringify({ status: 'failed to send message', error: e }));
      });

  } catch (e) {
    response.status(204).send(JSON.stringify({status: 'failed to send message', error: e }));
  }
});

app.listen(process.env.PORT);
