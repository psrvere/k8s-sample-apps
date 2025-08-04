const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from Kubernetes!',
    timestamp: new Date().toISOString(),
    pod: process.env.HOSTNAME || 'unknown'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

app.listen(port, () => {
  console.log(`Hello World app listening at http://localhost:${port}`);
}); 