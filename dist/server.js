// const express = require('express');
// const webpack = require('webpack');
// const webpackDevMiddleware = require('webpack-dev-middleware');

// const app = express();
// const config = require('../webpack.config.js');
// import express from 'express';
// import webpack from 'webpack';
// import webpackDevMiddleware from 'webpack-dev-middleware';

// const app = express();
// import config from '../webpack.config.js';

// const compiler = webpack(config);

// // Tell express to use the webpack-dev-middleware and use the webpack.config.js
// // configuration file as a base.
// app.use(
//   webpackDevMiddleware(compiler, {
//     publicPath: config.output.publicPath,
//   })
// );

// // Serve the files on port 3000.
// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!\n');
// });


const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

// parse application/json
app.use(bodyParser.json());

app.post('/', (req, res) => {
  const jsonData = req.body;
  console.log(jsonData);
  const information = jsonData.information;
  console.log(information);
  res.send('Received JSON data: ' + information);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
