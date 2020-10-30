import * as fs from 'fs';
import * as express from 'express';
import * as healthCheck from 'express-healthcheck';

const app = express();

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to tenant-management-api!' });
});

app.use('/health', healthCheck());

let swagger = null;
app.use('/swagger/docs/v1', (req, res) => {
  if (swagger) {
    res.json(swagger);
  } else {
    fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
      if (err) {
        res.sendStatus(404);
      } else {
        swagger = JSON.parse(data);
        res.json(swagger);
      }
    });
  }
})

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
