// Import from "@inrupt/solid-client-authn-browser"
import {
    login,
    handleIncomingRedirect,
    getDefaultSession,
    fetch
  } from "@inrupt/solid-client-authn-browser";
  
  // Import from "@inrupt/solid-client"
  import {
    addUrl,
    addStringNoLocale,
    createSolidDataset,
    createThing,
    getPodUrlAll,
    getSolidDataset,
    getThingAll,
    getStringNoLocale,
    getUrl,
    removeThing,
    saveSolidDatasetAt,
    setThing
  } from "@inrupt/solid-client";
  
import { SCHEMA_INRUPT, RDF, AS, OWL } from "@inrupt/vocab-common-rdf";

import {
  WebsocketNotification,
} from "@inrupt/solid-client-notifications";

const containerUrl = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/Tanker1233";

// ... authentication logic has been omitted


// import fastify from 'fastify';
// const server = fastify({
//   logger: true
// });


// fastify.listen(1234, (err, address) => {
//   if (err) throw err;
// });

// fastify.post('/', async (req, res) => {
//   try {
//     if (req.headers['content-type'] === 'application/json') {
//       const name = req.body.name;
//       const temperature = req.body.temperature;
//       console.log(`Name: ${name}, Temperature: ${temperature}`);
//       res.send({ message: 'Data received' });
//     } else {
//       console.log('Request body is not in JSON format');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: error });
//   }
// });





  
  const selectorIdP = document.querySelector("#select-idp");
  const selectorPod = document.querySelector("#select-pod");
  const buttonLogin = document.querySelector("#btnLogin");
  const buttonRead = document.querySelector("#btnRead");
  const buttonCreate = document.querySelector("#btnCreate");
  const labelCreateStatus = document.querySelector("#labelCreateStatus");

  const buttonCreateNewTank = document.querySelector("#submit-tank");
  const buttonReadDataFromContainer = document.querySelector("#submit-read-tank");
  
  
  buttonRead.setAttribute("disabled", "disabled");
  buttonLogin.setAttribute("disabled", "disabled");
  buttonCreate.setAttribute("disabled", "disabled");
  
  // 1a. Start Login Process. Call login() function.
  function loginToSelectedIdP() {
    const SELECTED_IDP = document.getElementById("select-idp").value;
    console.log("Login Button Pressed (1a)")
  
    return login({
      oidcIssuer: SELECTED_IDP,
      // redirectUrl: window.location.href,
      redirectUrl: "http://localhost:8080/add-device.html",
      clientName: "Getting started app",
      restorePreviousSession: true
    });
  }
  
  // 1b. Login Redirect. Call handleIncomingRedirect() function.
  // When redirected after login, finish the process by retrieving session information.
  async function handleRedirectAfterLogin() {
    await handleIncomingRedirect();
  
    const session = getDefaultSession();

    if(session.info.webId != null){
      console.log("Web ID is not null and it is "+session.info.webId);
    }else{
      console.log("WEb Id is null.");
      login({
        oidcIssuer: "https://solidcommunity.net",
        redirectUrl: window.location.href,
        clientName: "Getting started app",
        restorePreviousSession: true
      });
      
    }

    if (session.info.isLoggedIn) {
      // Update the page with the status.
      document.getElementById("myWebID").value = session.info.webId;
  
      // Enable Read button to read Pod URL
      buttonRead.removeAttribute("disabled");
      console.log("WebID = "+session.info.webId);
    }
  }
  

  
    handleRedirectAfterLogin();
  
  // The example has the login redirect back to the index.html.
  // This calls the function to process login information.
  // If the function is called when not part of the login redirect, the function is a no-op.
  
  
  
  // 2. Get Pod(s) associated with the WebID
  async function getMyPods() {
    const webID = document.getElementById("myWebID").value;
    
    const mypods = await getPodUrlAll(webID, { fetch: fetch });
    
  
    // Update the page with the retrieved values.
  
    mypods.forEach((mypod) => {
      let podOption = document.createElement("option");
      podOption.textContent = mypod;
      podOption.value = mypod;
      selectorPod.appendChild(podOption);
    });
  }
  
  // 3. Create the Reading List
  async function createList() {
    labelCreateStatus.textContent = "";
    const SELECTED_POD = document.getElementById("select-pod").value;
    let SELECTED_TANK = document.getElementById("select-tank").value;
    SELECTED_TANK = 'tank01';
  
    // For simplicity and brevity, this tutorial hardcodes the  SolidDataset URL.
    // In practice, you should add in your profile a link to this resource
    // such that applications can follow to find your list.
    // const readingListUrl = `${SELECTED_POD}getting-started-/reading-List/my-List`;
    const readingListUrl = `${SELECTED_POD}dosing-data/${SELECTED_TANK}`;
  
    //let titles = document.getElementById("titles").value.split("\n");
    let time = document.getElementById("time").value.split("\n");
    let temps = document.getElementById("temps").value.split("\n");
    let latLon = document.getElementById("latLon").value.split("\n");
  
    // Fetch or create a new reading list.
    let myReadingList;
  
    try {
      // Attempt to retrieve the reading list in case it already exists.
      myReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });
      // Clear the list to override the whole list
      let items = getThingAll(myReadingList);
      items.forEach((item) => {
        myReadingList = removeThing(myReadingList, item);
      });
    } catch (error) {
      if (typeof error.statusCode === "number" && error.statusCode === 404) {
        // if not found, create a new SolidDataset (i.e., the reading list)
        myReadingList = createSolidDataset();
      } else {
        console.error(error.message);
      }
    }


    let item = createThing({ name: "temp" + time });
    item = addUrl(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
    item = addStringNoLocale(item, SCHEMA_INRUPT.value, temps);
    item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, time);
    item = addStringNoLocale(item, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon', latLon);
    item = addStringNoLocale(item,'https://schema.org/creator', session.info.webId);
    myReadingList = setThing(myReadingList, item);

  
    // Add titles to the Dataset
    // let i = 0;
    // titles.forEach((title) => {
    //   if (title.trim() !== "") {
    //     let item = createThing({ name: "title" + i });
    //     item = addUrl(item, RDF.type, AS.Article);
    //     item = addStringNoLocale(item, SCHEMA_INRUPT.value, title);
    //     myReadingList = setThing(myReadingList, item);
    //     i++;
    //   }
    // });

    // let i = 0;
    // temps.forEach((temp) => {
    //   if (temp.trim() !== "") {
    //     let item = createThing({ name: "temp" + i });
    //     item = addUrl(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
    //     item = addStringNoLocale(item, SCHEMA_INRUPT.value, temp);
    //     myReadingList = setThing(myReadingList, item);
    //     i++;
    //   }
    // });
  
    try {
      // Save the SolidDataset
      let savedReadingList = await saveSolidDatasetAt(
        readingListUrl,
        myReadingList,
        { fetch: fetch }
      );
  
      labelCreateStatus.textContent = "Saved";
  
      // Refetch the Reading List
      savedReadingList = await getSolidDataset(readingListUrl, { fetch: fetch });
      console.log(savedReadingList);
  
      let items = getThingAll(savedReadingList);
  
      let listcontent = "";
      for (let i = 0; i < items.length; i++) {
        let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
        if (item !== null) {
          listcontent += item + "\n";
        }
      }
  
      document.getElementById("savedtitles").value = listcontent;
    } catch (error) {
      console.log(error);
      labelCreateStatus.textContent = "Error" + error;
      labelCreateStatus.setAttribute("role", "alert");
    }
  }

  



  async function readDataFromContainer(){
    
    let SELECTED_POD_TEMP = document.getElementById("select-pod").value;
    let readContainerUrl = `${SELECTED_POD_TEMP}dosing-data/`;

    let myTanks;
    try {
      // Attempt to retrieve the reading list in case it already exists.
      myTanks = await getSolidDataset(readContainerUrl, { fetch: fetch });
      
    } catch (error) {
      if (typeof error.statusCode === "number" && error.statusCode === 404) {
        // if not found, create a new SolidDataset (i.e., the reading list)
        console.log("Nothing found at the location "+ readContainerUrl);
      } else {
        console.error(error.message);
      }
    }
    let items = getThingAll(myTanks);
    console.log(myTanks);
    console.log(items);
    document.getElementById("savedtitles").value = "Hello'";


  }



  // 4. Create a new tank
  async function createNewTank() {

    let SELECTED_POD_TEMP = document.getElementById("select-pod").value;

    labelCreateStatus.textContent = "";
    let TANK_NAME = document.getElementById("tank-name").value;
    let tankManager = document.getElementById("tank-manager").value.split("\n");
    let tankViewers = document.getElementById("tank-viewers").value.split("\n");
    
    
    const createTankUrl = `${SELECTED_POD_TEMP}dosing-data/${TANK_NAME}`;
  
    // Fetch or create a new reading list.
    let myTanks;
  
    try {
      // Attempt to retrieve the reading list in case it already exists.
      myTanks = await getSolidDataset(createTankUrl, { fetch: fetch });
      // Clear the list to override the whole list
      let items = getThingAll(myTanks);
      items.forEach((item) => {
        myTanks = removeThing(myTanks, item);
      });
    } catch (error) {
      if (typeof error.statusCode === "number" && error.statusCode === 404) {
        // if not found, create a new SolidDataset (i.e., the reading list)
        myTanks = createSolidDataset();
      } else {
        console.error(error.message);
      }
    }



    const date = new Date();
    console.log(date);

    let item = createThing({ name: TANK_NAME });
    item = addUrl(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
    item = addStringNoLocale(item, SCHEMA_INRUPT.value, tankManager);
    item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, date);
    myTanks = setThing(myTanks, item);


    try {
      // Save the SolidDataset
      let savedReadingList = await saveSolidDatasetAt(
        createTankUrl,
        myTanks,
        { fetch: fetch }
      );
  
      labelCreateStatus.textContent = "Saved";
  
      // Refetch the Reading List
      savedReadingList = await getSolidDataset(createTankUrl, { fetch: fetch });
      console.log(savedReadingList);
  
      let items = getThingAll(savedReadingList);
  
      let listcontent = "";
      for (let i = 0; i < items.length; i++) {
       
       // Access Name from SOLID Pods
        let item = getStringNoLocale(items[i], SCHEMA_INRUPT.value);
        console.log("Name = "+item);
        if (item !== null) {
          listcontent += item + "\n";
          //document.getElementById("name").value = item;

          const nameField = document.querySelector('#name');
          nameField.innerHTML = item;
        }

        // Access Date Modified from SOLID Pods
        let dateModifiedData = getStringNoLocale(items[i], SCHEMA_INRUPT.dateModified);
        console.log("Date Modified = "+dateModifiedData);
        if (dateModifiedData !== null) {
          listcontent += dateModifiedData + "\n";
          const dateModifiedField = document.querySelector('#dateModified');
          dateModifiedField.innerHTML = dateModifiedData;
        }

        // Access Type from SOLID Pods
        let typeData = getUrl(items[i], RDF.type);
        console.log("Date Modified = "+typeData);
        if (typeData !== null) {
          listcontent += typeData + "\n";
          const typeField = document.querySelector('#type');
          typeField.innerHTML = typeData;
        }





      }
  
      console.log("List Content = "+listcontent);
      document.getElementById("savedtitles").value = listcontent;



      const websocket = new WebsocketNotification(
        containerUrl,
        { fetch: fetch }
      );
      
      websocket.on("message", console.log);
      
      websocket.connect();
    } catch (error) {
      console.log(error);
      labelCreateStatus.textContent = "Error" + error;
      labelCreateStatus.setAttribute("role", "alert");
    }
  }
  
  buttonLogin.onclick = function () {
    loginToSelectedIdP();
  };
  
  buttonRead.onclick = function () {
    getMyPods();
  };
  
  buttonCreate.onclick = function () {
    createList();
  };
  
  buttonCreateNewTank.onclick = function () {
    console.log("New Tank Button Pressed");
    createNewTank();
  };


  buttonReadDataFromContainer.onclick = function () {
    console.log("Read Data from container Button Pressed");
    readDataFromContainer();
  };
  
  selectorIdP.addEventListener("change", idpSelectionHandler);
  function idpSelectionHandler() {
    if (selectorIdP.value === "") {
      buttonLogin.setAttribute("disabled", "disabled");
    } else {
      buttonLogin.removeAttribute("disabled");
    }
  }
  
  selectorPod.addEventListener("change", podSelectionHandler);
  function podSelectionHandler() {
    if (selectorPod.value === "") {
      buttonCreate.setAttribute("disabled", "disabled");
    } else {
      buttonCreate.removeAttribute("disabled");
    }
  }

  


