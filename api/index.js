console.log("####### api started ##########");
//get keys from seperate file to get configured by environment
const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

//new express app to handle incoming http request
const app = express();
//Cross Origin Request Sharing: Allow us to communicate between react app and express.
//They both are hosted on different ports.
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});

pgClient.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack)
  }
  client.query('SELECT NOW()', (err, result) => {
    release()
    if (err) {
      return console.error('Error executing query', err.stack)
    }
    console.log(result.rows)
  })
})

pgClient.on('error', () => console.log('Lost PG connection'));

pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
  .catch(err => console.log(err));


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

console.log("redis_port: " + keys.redisPort + "  redis_host: " +  keys.redisHost + " redis connected: " + redisClient.connected);

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');
  console.log("get values/all count: " + values.rowCount);
  res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
  console.log("get values/current start!! redis connected: " + redisClient.connected);
  redisClient.hgetall('values', (err, values) => {
    console.log("get values/current values: " + Object.entries(values));
    res.send(values);
  });
});

app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  console.log("post values index: " + index);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Listening');
});
