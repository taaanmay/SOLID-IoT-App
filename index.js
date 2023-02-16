const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
let publicPath = path.resolve(__dirname, 'public');

app.use(express.static(publicPath));

app.get("/login", async (req, res, next) => {
    console.log("Login Button Pressed");
  });


  app.listen(port, () => console.log(`App listening on port ${port}`));
