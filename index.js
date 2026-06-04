const express = require('express');
const app = express();
app.use(express.json());

require('dotenv').config();

console.log(process.env.API_KEY)

const requireApiKey = require('./middleware/auth');
app.use(requireApiKey);

const port = 3000;

//routes here
app.use('/api/water', require('./routes/water'));

app.listen(port, () => console.log('API running on port 3000'));