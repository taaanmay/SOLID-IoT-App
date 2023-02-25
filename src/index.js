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
    setThing,
    universalAccess
  } from "@inrupt/solid-client";
  
import { SCHEMA_INRUPT, RDF, AS, OWL } from "@inrupt/vocab-common-rdf";

import {
  WebsocketNotification,
} from "@inrupt/solid-client-notifications";

const containerUrl = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/Tanker1233";


  
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
      redirectUrl: window.location.href,
      // redirectUrl: "http://localhost:8080/add-device.html",
      clientName: "UI of Solid IoT App",
      // restorePreviousSession: true
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
      console.log("WEb Id is null. Attempting to login again automatically.");
      // login({
      //   oidcIssuer: "https://solidcommunity.net",
      //   redirectUrl: window.location.href,
      //   clientName: "Getting started app",
      //   restorePreviousSession: true
      // });
      
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

  export function sendDataToFrontEnd(){
    return readDataFromContainer();
  }



  async function readDataFromContainer(){
    
    let SELECTED_POD_TEMP = document.getElementById("select-pod").value;
    let readContainerUrl = `${SELECTED_POD_TEMP}dosing-data/`;

    //readContainerUrl = `https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/`;

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

    


    const output = [];
    const things = getThingAll(myTanks);
    things.forEach((thing) => {
    const tempObject = {
      // text: getStringNoLocale(thing, SCHEMA_INRUPT.text),
      // id: getInteger(thing, SCHEMA_INRUPT.identifier),
      // date: getDatetime(thing, SCHEMA_INRUPT.dateModified),
      // verified: getBoolean(thing, SCHEMA_INRUPT.value),
      name: getStringNoLocale(thing, SCHEMA_INRUPT.name),
      type: getUrl(thing, RDF.type),
      date_modified: getStringNoLocale(thing, SCHEMA_INRUPT.dateModified),
      temperature: getStringNoLocale(thing, SCHEMA_INRUPT.value),
      tankManager: getStringNoLocale(thing, 'https://schema.org/creator'),
      lat_long: getStringNoLocale(thing, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon'),
      tankID: getStringNoLocale(thing, SCHEMA_INRUPT.productID)
      
    };
    output.push(tempObject);
  });
  console.log(output);

  const data = output;


  const container = document.getElementById('container');
                  
    container.innerHTML = '';
    data.forEach(element => {
      const box = document.createElement('div');
      box.className = 'box';
      box.innerHTML = `
        <h2>${element.name}</h2>
        <p>Tank ID: ${element.tankID}</p>
        <p>Type: ${element.type}</p>
        <p>Temperature: ${element.temperature}</p>
        <p>Lat/Long: ${element.lat_long}</p>
        <p>Date Modified: ${element.date_modified}</p>
        <p>Creator: ${element.tankManager}</p>
      `;
      container.appendChild(box);
    });

  return output;


  }



  // 4. Create a new tank
  async function createNewTank() {

    let SELECTED_POD_TEMP = document.getElementById("select-pod").value;

    labelCreateStatus.textContent = "";
    let DEVICE_NAME = document.getElementById("tank-name").value;
    let TANK_ID = document.getElementById("tank-id").value;
    let tankManager = document.getElementById("tank-manager").value.split("\n");
    let tankViewers = document.getElementById("tank-viewers").value.split("\n");
    
    const createTankUrl = `${SELECTED_POD_TEMP}dosing-data/`;

    // tank manager = web id of the current logged in user
    tankManager = document.getElementById("myWebID").value;
    
    addDevice(createTankUrl, DEVICE_NAME, tankManager, TANK_ID);
    
    
    

    // Giving Access to SERVER
    const session = getDefaultSession();
    var webID = `https://id.inrupt.com/iotserver01`; // Web ID of server  
    lookupAccess(readContainerUrl, webID, session );  
    giveAccessToServer(readContainerUrl);
    lookupAccess(readContainerUrl, webID, session );
    
    
  
    // // Fetch or create a new reading list.
    // let myTanks;
  
    // try {
    //   // Attempt to retrieve the reading list in case it already exists.
    //   myTanks = await getSolidDataset(createTankUrl, { fetch: fetch });
    //   // Clear the list to override the whole list
    //   let items = getThingAll(myTanks);
    //   items.forEach((item) => {
    //     myTanks = removeThing(myTanks, item);
    //   });
    // } catch (error) {
    //   if (typeof error.statusCode === "number" && error.statusCode === 404) {
    //     // if not found, create a new SolidDataset (i.e., the reading list)
    //     myTanks = createSolidDataset();
    //   } else {
    //     console.error(error.message);
    //   }
    // }



    // const date = new Date();
    // console.log(date);

    // let item = createThing({ name: TANK_NAME });
    // item = addUrl(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
    // item = addStringNoLocale(item, SCHEMA_INRUPT.value, tankManager);
    // item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, date);
    // myTanks = setThing(myTanks, item);


    // try {
    //   // Save the SolidDataset
    //   let savedReadingList = await saveSolidDatasetAt(
    //     createTankUrl,
    //     myTanks,
    //     { fetch: fetch }
    //   );

    

    //   const websocket = new WebsocketNotification(
    //     containerUrl,
    //     { fetch: fetch }
    //   );
      
    //   websocket.on("message", console.log);
      
    //   websocket.connect();
    // } catch (error) {
    //   console.log(error);
    //   labelCreateStatus.textContent = "Error" + error;
    //   labelCreateStatus.setAttribute("role", "alert");
    // }
  }

async function lookupAccess(resource, webID, session){
  
  universalAccess.getAgentAccess(
    resource,       // resource  
    webID,   // agent
    { fetch: fetch }                      // fetch function from authenticated session
  ).then((agentAccess) => {
    logAccessInfo(webID, agentAccess, resource);
  });
}  

function logAccessInfo(agent, agentAccess, resource) {
  console.log(`For resource::: ${resource}`);
  if (agentAccess === null) {
    console.log(`Could not load ${agent}'s access details.`);
  } else {
    console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
  }
}

function giveAccessToServer(resource){
  universalAccess.setAgentAccess(
    resource,         // Resource
    `https://id.inrupt.com/iotserver01`,     // Agent
    { read: false, append: false, write: false, control: false  },          // Access object
    { fetch: fetch }                         // fetch function from authenticated session
  ).then((newAccess) => {
    logAccessInfo2(`https://id.inrupt.com/iotserver01`, newAccess,resource)
  });
  
  
}

function logAccessInfo2(agent, agentAccess, resource) {
  console.log(`For resource::: ${resource}`);
  if (agentAccess === null) {
    console.log(`Could not load ${agent}'s access details.`);
  } else {
    console.log(`${agent}'s Access:: ${JSON.stringify(agentAccess)}`);
  }
}


async function addDevice(podLocation, id, deviceManager, tankID){

 
      let deviceList;
      
      try {
          // Attempt to retrieve the reading list in case it already exists.
          deviceList = await getSolidDataset(podLocation, 
          { fetch: fetch });
          // Clear the list to override the whole list
          let items = getThingAll(deviceList);
          items.forEach((item) => {
              // deviceList = removeThing(deviceList, item);
          });
      } catch (error) {
          if (typeof error.statusCode === "number" && error.statusCode === 404) {
              // if not found, create a new SolidDataset (i.e., the reading list)
              deviceList = createSolidDataset();
          } 
          else {
              console.error(error.message);
          }
      }
          
          var currentdate = new Date(); 
          var datetime = currentdate.getDate() + "/"
                          + (currentdate.getMonth()+1)  + "/" 
                          + currentdate.getFullYear() + " "  
                          + currentdate.getHours() + ":"  
                          + currentdate.getMinutes() + ":" 
                          + currentdate.getSeconds();
          
          console.log("Date - "+datetime);                                
          
          let item = createThing({
          name: "Device"+id
          });
          item = addStringNoLocale(item, SCHEMA_INRUPT.identifier, id);
          item = addStringNoLocale(item, SCHEMA_INRUPT.name, "Device-"+id);
          item = addUrl(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
          // item = addStringNoLocale(item, SCHEMA_INRUPT.value, temperature);
          item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, datetime);
          // item = addStringNoLocale(item, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon', (latitude + ", " + longitude));
          item = addStringNoLocale(item, 'https://schema.org/creator', deviceManager);
          item = addStringNoLocale(item, SCHEMA_INRUPT.productID, tankID);
          deviceList = setThing(deviceList, item);
          
          
          try {
          // Save the SolidDataset
          let saveDeviceList = await saveSolidDatasetAt(
              podLocation,
              deviceList, 
              { fetch: fetch }
              );
              console.log('Saved Data '+ saveDeviceList); 
              return true; 
              
              
          } catch (error) {
              console.log("Device Not saved in Solid Pod => ");
              console.error(error.message);
              return false;

              
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

  


