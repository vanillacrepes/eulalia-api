const express = require('express');
const app = express();
app.use(express.json());

const port = 3000;

//routes here
app.use('/api/water', require('./routes/water'));

app.listen(port, () => console.log('API running on port 3000'));