const express = require("express");
const cookieSession = require("cookie-session");
const path = require("path");
const {
    WebsocketNotification,
  } = require("@inrupt/solid-client-notifications");

const { 
  getSessionFromStorage,
  getSessionIdFromStorageAll,
  Session
} = require("@inrupt/solid-client-authn-node");

const { JSDOM } = require("jsdom");
const fs = require('fs');

const file = fs.readFileSync('./index.html', 'utf-8');
const dom = new JSDOM(file);
const { document } = dom.window;

const app = express();
const port = 3000;

// The following snippet ensures that the server identifies each user's session
// with a cookie using an express-specific mechanism
app.use(
  cookieSession({
    name: "session",
    // These keys are required by cookie-session to sign the cookies.
    keys: [
      "Required, but value not relevant for this demo - key1",
      "Required, but value not relevant for this demo - key2",
    ],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);


app.get("/login", async (req, res, next) => {
  // 1. Create a new Session
  const session = new Session();
  req.session.sessionId = session.info.sessionId;
  const redirectToSolidIdentityProvider = (url) => {
    // Since we use Express in this example, we can call `res.redirect` to send the user to the
    // given URL, but the specific method of redirection depend on your app's particular setup.
    // For example, if you are writing a command line app, this might simply display a prompt for
    // the user to visit the given URL in their browser.
    res.redirect(url);
  };
  // 2. Start the login process; redirect handler will handle sending the user to their
  //    Solid Identity Provider.
  await session.login({
    // After login, the Solid Identity Provider will send the user back to the following
    // URL, with the data necessary to complete the authentication process
    // appended as query parameters:
    redirectUrl: `http://localhost:${port}/redirect-from-solid-idp`,
    // Set to the user's Solid Identity Provider; e.g., "https://login.inrupt.com" 
    oidcIssuer: "https://login.inrupt.com",
    // Pick an application name that will be shown when asked 
    // to approve the application's access to the requested data.
    clientName: "Demo app",
    handleRedirect: redirectToSolidIdentityProvider,
  });
});

app.get("/redirect-from-solid-idp", async (req, res) => {
  // 3. If the user is sent back to the `redirectUrl` provided in step 2,
  //    it means that the login has been initiated and can be completed. In
  //    particular, initiating the login stores the session in storage, 
  //    which means it can be retrieved as follows.
  const session = await getSessionFromStorage(req.session.sessionId);

  // 4. With your session back from storage, you are now able to 
  //    complete the login process using the data appended to it as query
  //    parameters in req.url by the Solid Identity Provider:
  await session.handleIncomingRedirect(`http://localhost:${port}${req.url}`);

  // 5. `session` now contains an authenticated Session instance.
  if (session.info.isLoggedIn) {
    return res.send(`<p>Logged in with the WebID ${session.info.webId}.</p>`)
  }
});

// 6. Once you are logged in, you can retrieve the session from storage, 
//    and perform authenticated fetches.
app.get("/fetch", async (req, res, next) => {
  if(typeof req.query["resource"] === "undefined") {
    res.send(
      "<p>Please pass the (encoded) URL of the Resource you want to fetch using `?resource=&lt;resource URL&gt;`.</p>"
    );
  }
  const session = await getSessionFromStorage(req.session.sessionId);
  console.log(await (await session.fetch(req.query["resource"])).text());
  res.send("<p>Performed authenticated fetch.</p>");
});

// 7. To log out a session, just retrieve the session from storage, and 
//    call the .logout method.
app.get("/logout", async (req, res, next) => {
  const session = await getSessionFromStorage(req.session.sessionId);
  session.logout();
  res.send(`<p>Logged out.</p>`);
});


app.use(express.json());

app.post("/post/add-device", async (req, res) => {
  if (req.headers["content-type"] !== "application/json") {
    return res.status(400).send({ error: "Content-type must be JSON" });
  }

  const deviceData = req.body;
  const { id, temperature, latitude, longitude } = deviceData;

  console.log(`id: ${id}`);
  console.log(`temperature: ${temperature}`);
  console.log(`latitude: ${latitude}`);
  console.log(`longitude: ${longitude}`);

  res.send({ success: true, message: "Data received by Server (TK)." });

  podLocation = `https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/`
  addDevice(podLocation, id, temperature, latitude, longitude);
});


// 8. On the server side, you can also list all registered sessions using the
//    getSessionIdFromStorageAll function.
app.get("/", async (req, res, next) => {
  const sessionIds = await getSessionIdFromStorageAll();
  for(const sessionId in sessionIds) {
    // Do something with the session ID...
    console.log("Try the notification function here:")
    
      
    //   const containerUrl = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/Tanker1233";

    //   const websocket = new WebsocketNotification(
    //     containerUrl,
    //     { fetch: fetch }
    //   );
      
    //   websocket.on("message", console.log);
      
    //   websocket.connect();
  }
//   res.send(
//     `<p>There are currently [${sessionIds.length}] visitors.</p>`
//   );
    res.sendFile(path.join(__dirname, "index.html"));
    
    runHTML();
});


app.listen(port, () => {
  console.log(
    `Server running on port [${port}]. ` +
    `Visit [http://localhost:${port}/login] to log in to [login.inrupt.com].`
  );
});

function runHTML(){
    console.log("Hey");
    const buttonCreateNewTank = document.getElementById("submit-tank");
    buttonCreateNewTank.onclick = function () {
        console.log("New Tank Button Pressed");
        //createNewTank();
      };

}


function addDevice(podLocation, id, temperature, latitude, longitude){
    console.log("Add Device Function called");
    
}