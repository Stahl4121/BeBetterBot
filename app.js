const app = require('express')();


app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/test', async (req, res) => {
  res.end(JSON.stringify({ request: req }));
});

app.listen(process.env.PORT);
