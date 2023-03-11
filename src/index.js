// Import from "@inrupt/solid-client-authn-browser"
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
  fetch,
  onSessionRestore
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
  universalAccess,
  deleteSolidDataset,
  getThing
} from "@inrupt/solid-client";

import { SCHEMA_INRUPT, RDF, AS, OWL } from "@inrupt/vocab-common-rdf";

import {
WebsocketNotification,
} from "@inrupt/solid-client-notifications";

const containerUrl = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/Tanker1233";



const selectorIdP = document.querySelector("#select-idp");
const selectorPod = document.querySelector("#select-pod");
const buttonLogin = document.querySelector("#btnLogin");
// const buttonRead = document.querySelector("#btnRead");
const buttonCreate = document.querySelector("#btnCreate");
const labelCreateStatus = document.querySelector("#labelCreateStatus");

const buttonCreateNewTank = document.querySelector("#submit-tank");
const buttonReadDataFromContainer = document.querySelector("#submit-read-tank");

const deleteDevicesButton = document.querySelector("#delete-devices-button");
const searchButton = document.querySelector("#searchButton1");




// buttonRead.setAttribute("disabled", "disabled");
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
    console.log("WEb Id is null. Attempting to login again automatically.");
    login({
      oidcIssuer: "https://login.inrupt.com",
      redirectUrl: window.location.href,
      clientName: "Getting started app",
      restorePreviousSession: true
    });
    
  }

  if (session.info.isLoggedIn) {

    document.getElementById("login").style = "display:none";
    enableWebsocketNotifications();


    // Update the page with the status.
    document.getElementById("myWebID").value = session.info.webId;

    // Enable Read button to read Pod URL
    // buttonRead.removeAttribute("disabled");
    console.log("WebID = "+session.info.webId);
  }else{
    document.getElementById("login").style = "display:show";
  }


  const sensorContactsUri = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/";  

  const sensorContactsSocket = new WebsocketNotification(
      sensorContactsUri,
      { fetch: fetch }
  )

  sensorContactsSocket.on("error", (error) => {
      console.log(error.message);
  })

  sensorContactsSocket.on("connected", () => {
      console.log('connected sensor contacts socket!')
  })

  sensorContactsSocket.on("closed", () => {
      console.log('closed sensor contacts socket!')
  });

  // sensorContactsSocket.on("message", async (notif) => {
  //     console.log(`sensor contacts socket: ${notif}`+notif);   
  // })


  // Show the List of Pods
  getMyPods();
  


  sensorContactsSocket.on("message", async(notif)=>{
    console.log();
    document.getElementById("notification-box").style = "display:show";
    setTimeout(() => {
      document.getElementById("notification-box").style = "display:none";
    }, 5000);
  })

  sensorContactsSocket.connect();
}



  handleRedirectAfterLogin();

// The example has the login redirect back to the index.html.
// This calls the function to process login information.
// If the function is called when not part of the login redirect, the function is a no-op.



async function enableWebsocketNotifications(){
 
  const session = getDefaultSession();
  const webID = document.getElementById("myWebID").value;
  
  const mypods = await getPodUrlAll(webID, { fetch: fetch });
  
  mypods.forEach((mypod) => {
    const websocket = new WebsocketNotification(
      mypod+"dosing-data/",
      { fetch: fetch }
    );
    websocket.on("message", console.log);

    websocket.connect();
  });
  
 
}
// 2. Get Pod(s) associated with the WebID
async function getMyPods() {
  const webID = document.getElementById("myWebID").value;

  document.getElementById("readlabel").textContent = "My WebID: "+webID;
  
  
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

  const containerUrl = "https://storage.inrupt.com/dcc8eac4-6003-4709-b4e1-cced55a20ac3/dosing-data/";

    // ... authentication logic has been omitted

    const websocket = new WebsocketNotification(
      containerUrl,
      { fetch: fetch }
    );

    websocket.on("Websocket Message", console.log);

    websocket.connect();
  
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
      destroy();
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
    value: getStringNoLocale(thing, SCHEMA_INRUPT.value),
    name: getStringNoLocale(thing, SCHEMA_INRUPT.name),
    date_modified: getStringNoLocale(thing, SCHEMA_INRUPT.dateModified),
    type: getStringNoLocale(thing, RDF.type),
    tankManager: getStringNoLocale(thing, 'https://schema.org/creator'),
    lat_long: getStringNoLocale(thing, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon'),
    DeviceID: getStringNoLocale(thing, SCHEMA_INRUPT.identifier),
    tankViewers: getStringNoLocale(thing, 'https://schema.org/viewer')
    
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
      <h3>Admin Data</h3>
      <p>Device ID: ${element.DeviceID}</p>
      <p>Device Type: ${element.type}</p>
      <p>Manager: ${element.tankManager}</p>
      <p>Viewers: ${element.tankViewers}</p>
      <h3>Device Data</h3>
      <p>Value: ${element.value}</p>
      <p>Lat/Long: ${element.lat_long}</p>
      <p>Date Modified: ${element.date_modified}</p>
    `;

    // Add edit button to the div with a unique ID
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "edit-button"; // Add class name
    editButton.id = "edit-button-" + element.DeviceID;
    box.appendChild(editButton);

    container.appendChild(box);
    
  });


// Turning Button Green showing that the results have been generated  
document.getElementById("submit-read-tank").className = "btn completed";  

///////////////////// LOGIC For EDIT BUTTON ON DEVICES ////////////////

const editButtons = document.getElementsByClassName("edit-button");

// Loop through each edit button and add a click event listener
Array.from(editButtons).forEach(editButton => {
  editButton.addEventListener("click", async () => {
    const buttonId = editButton.id;
    console.log("Edit button clicked with ID: " + buttonId);
    // Remove "edit-button-" prefix from the ID
    const deviceId = buttonId.substring("edit-button-".length);
    console.log(deviceId);

    // Create the prompt message
    const message = "Device " + deviceId + "\nEnter new Manager:";
    const manager = prompt(message, "");
    if (manager === null) {
      // User clicked Cancel, do nothing
      return;
    }

    const viewers = prompt("Enter new Viewers:", "");

    if (viewers === null) {
      // User clicked Cancel, do nothing
      return;
    }

    // Create the confirmation message
    const confirmationMessage = "Save changes to Device " + deviceId + "?";
    if (confirm(confirmationMessage)) {
      // User clicked OK, save the changes
      console.log("New Manager:", manager);
      console.log("New Viewers:", viewers);
      // Code to save the changes goes here

      addManagerViewers(readContainerUrl, deviceId, manager, viewers);
      console.log("Add Manager Viewer function called");


    } else {
      // User clicked Cancel, do nothing
    }

  });
});

return output;


}



// 4. Create a new tank
async function createNewTank() {

  
  let SELECTED_POD_TEMP = document.getElementById("select-pod").value;

  document.getElementById("labelCreateStatus").textContent = "";
  let DEVICE_ID = document.getElementById("tank-id").value;
  let DEVICE_NAME = document.getElementById("tank-nickname").value;
  let DEVICE_TYPE = document.getElementById("tank-type").value;
  // let TANK_ID = document.getElementById("tank-id").value;
  let DEVICE_MANAGER = document.getElementById("tank-manager").value.split("\n");
  let DEVICE_VIEWERS = document.getElementById("tank-viewers").value.split("\n");


  
  
  const createTankUrl = `${SELECTED_POD_TEMP}dosing-data/`;

  // tank manager = web id of the current logged in user if manager not provided
  if(DEVICE_MANAGER == null || DEVICE_MANAGER == ""){
    DEVICE_MANAGER = document.getElementById("myWebID").value;
  }  
  
  
  let status = "Device has been Registered";
  var statusOfAddingDevice = await(addDevice(createTankUrl, DEVICE_ID, DEVICE_NAME, DEVICE_TYPE, DEVICE_MANAGER, DEVICE_VIEWERS, status));
  console.log("statusOfAddingDevice = "+statusOfAddingDevice);
  
  
  if(statusOfAddingDevice == true){
    console.log("Status -> "+status);
    


    var readContainerUrl = `${SELECTED_POD_TEMP}dosing-data/`;
    // Giving Access to SERVER
    const session = getDefaultSession();
    var webID = `https://id.inrupt.com/iotserver01`; // Web ID of server  
    lookupAccess(readContainerUrl, webID, session );  
    giveAccessToServer(readContainerUrl);
    lookupAccess(readContainerUrl, webID, session );

    

    
    var submitButton = document.getElementById('submit-tank');
    submitButton.className ='btn completed';
  }else{
    
    var submitButton = document.getElementById('submit-tank');
    submitButton.className ='btn failed';
  }

  document.getElementById("tank-registration-status").style = "display:show";
  document.getElementById("tank-registration-status").textContent = status;
  
  

  
  
  
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
  { read: true, append: true, write: true, control: true  },          // Access object
  { fetch: fetch }                         // fetch function from authenticated session
).then((newAccess) => {
  logAccessInfo(`https://id.inrupt.com/iotserver01`, newAccess,resource)
});
}

function giveFullAccess(resource, webId){
  universalAccess.setAgentAccess(
    resource,         // Resource
    webId,     // Agent
    { read: true, append: true, write: true, control: true  },          // Access object
    { fetch: fetch }                         // fetch function from authenticated session
  ).then((newAccess) => {
    logAccessInfo(webId, newAccess,resource)
  });
  }

function giveReadAccess(resource, webId){
  universalAccess.setAgentAccess(
    resource,         // Resource
    webId,     // Agent
    { read: true, append: false, write: false, control: false  },          // Access object
    { fetch: fetch }                         // fetch function from authenticated session
  ).then((newAccess) => {
    logAccessInfo(webId, newAccess,resource)
  });
  }



async function addManagerViewers(podLocation, deviceId, manager, viewers){
  
  var doesDeviceExist = false;
  let deviceList;
  
  let thing;
  try {
      // Attempt to retrieve the reading list in case it already exists.
      deviceList = await getSolidDataset(podLocation, 
      { fetch: fetch });
      // Clear the list to override the whole list
      let items = getThingAll(deviceList);
      items.forEach((item) => {
          if(getStringNoLocale(item,SCHEMA_INRUPT.identifier) == deviceId){
            console.log("Found Device with Device Id");
            thing = item;
            doesDeviceExist = true;
            
          }
      });
      
  } catch (error) {
      if (typeof error.statusCode === "number" && error.statusCode === 404) {
          // if not found, create a new SolidDataset (i.e., the reading list)
          console.log("Did not find a Device with this ID");
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
      name: "Device"+deviceId
      });
      item = addStringNoLocale(item, SCHEMA_INRUPT.identifier, deviceId);
      if(manager != null && manager != "" && manager.length !=0){
        item = addStringNoLocale(item, 'https://schema.org/creator', manager);
        console.log("Changed Manager");
        giveFullAccess(podLocation, manager);
      }else{
        var existingManager = getStringNoLocale(thing, 'https://schema.org/creator');
        item = addStringNoLocale(item, `https://schema.org/creator`, existingManager);
        console.log("Could not change Manager");
      }
      if(viewers!=null && viewers != "" && viewers.length !=0){
        // let index = 1;
        // Array.from(viewers).forEach(viewer => {
        //   item = addStringNoLocale(item, 'https://schema.org/viewer'+index, viewer);        
        // });
        item = addStringNoLocale(item, 'https://schema.org/viewer', viewers);
        const viewerList = viewers.split(", ");
        // Loop through each user in the array and call the giveReadAccess function
        for (let i = 0; i < viewerList.length; i++) {
          const viewer = viewerList[i];
          giveReadAccess(podLocation, viewer);
        }
                
        console.log("Viewers Added = "+viewers);
      }else{
          var existingViewer = getStringNoLocale(thing, 'https://schema.org/viewer');
          item = addStringNoLocale(item, 'https://schema.org/viewer', existingViewer);
          console.log("Viewers Could not be Added");
      }
      
      var existingValue = getStringNoLocale(thing, SCHEMA_INRUPT.value);
      item = addStringNoLocale(item, SCHEMA_INRUPT.value, existingValue);

      var existingName= getStringNoLocale(thing, SCHEMA_INRUPT.name);
      item = addStringNoLocale(item, SCHEMA_INRUPT.name, existingName);

      var existingType= getStringNoLocale(thing, RDF.type);
      item = addStringNoLocale(item, RDF.type, existingType);

      var lat_long= getStringNoLocale(thing, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon');
      item = addStringNoLocale(item, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon', lat_long);

      item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, datetime);
      deviceList = setThing(deviceList, item);
      
      
      try {
      // Save the SolidDataset
      let saveDeviceList = await saveSolidDatasetAt(
          podLocation,
          deviceList, 
          { fetch: fetch }
          );
          console.log('Saved Manager and Viewer Data '+ saveDeviceList); 
          return true; 
          
          
      } catch (error) {
          console.log("Device Not saved in Solid Pod => ");
          console.error(error.message);
          return false;

          
      }
  }


async function addDevice(podLocation, id, name, type, deviceManager, viewers, status){



    if(id == null){
      status = "Device ID cannot be empty."
      console.log(status);
      return false;
      
    }
    // for(var nullCheckVar in name, type, manager){

    // }

    var doesDeviceExist = false;
    let deviceList;
    
    try {
        // Attempt to retrieve the reading list in case it already exists.
        deviceList = await getSolidDataset(podLocation, 
        { fetch: fetch });
        // Clear the list to override the whole list
        let items = getThingAll(deviceList);
        items.forEach((item) => {
            if(getStringNoLocale(item,SCHEMA_INRUPT.identifier) == id){
              console.log("DEVICE EXISTS");
              doesDeviceExist = true;
              
            }
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
        
    if(doesDeviceExist == true){
      status = "Device with the same Device ID already exists."
      console.log(status);
      return false;
    }else{

    
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
        if(name == null || name == ""){
          item = addStringNoLocale(item, SCHEMA_INRUPT.name, "Device-"+id);
        }else{
          item = addStringNoLocale(item, SCHEMA_INRUPT.name, name);
        }
        if(type==null || type == ""){
          item = addStringNoLocale(item, RDF.type, 'http://www.w3.org/ns/sosa/Sensor');
        }else{
          item = addStringNoLocale(item, RDF.type, type);
        }
        
        // item = addStringNoLocale(item, SCHEMA_INRUPT.value, temperature);
        item = addStringNoLocale(item, SCHEMA_INRUPT.dateModified, datetime);
        // item = addStringNoLocale(item, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon', (latitude + ", " + longitude));
        item = addStringNoLocale(item, 'https://schema.org/creator', deviceManager);
        item = addStringNoLocale(item, 'https://schema.org/viewer', viewers);
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
    
}    




async function searchDevice(deviceLocation){
  let readContainerUrl =  deviceLocation;

    // ... authentication logic has been omitted

    const websocket = new WebsocketNotification(
      containerUrl,
      { fetch: fetch }
    );

    websocket.on("Websocket Message", console.log);

    websocket.connect();

  let myTanks;
  try {
    // Attempt to retrieve the reading list in case it already exists.
    myTanks = await getSolidDataset(readContainerUrl, { fetch: fetch });
    
  } catch (error) {
    if (typeof error.statusCode === "number" && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
      console.log("Nothing found at the location "+ readContainerUrl);
      destroy();
    } else {
      console.error(error.message);
    }
  }

    let items = getThingAll(myTanks);
    console.log(myTanks);
    console.log(items);

    const output = [];
    const thing = getThing(myTanks,readContainerUrl);
    console.log(thing);
    // things.forEach((thing) => {
    const tempObject = {
      // text: getStringNoLocale(thing, SCHEMA_INRUPT.text),
      // id: getInteger(thing, SCHEMA_INRUPT.identifier),
      // date: getDatetime(thing, SCHEMA_INRUPT.dateModified),
      value: getStringNoLocale(thing, SCHEMA_INRUPT.value),
      name: getStringNoLocale(thing, SCHEMA_INRUPT.name),
      date_modified: getStringNoLocale(thing, SCHEMA_INRUPT.dateModified),
      type: getStringNoLocale(thing, RDF.type),
      tankManager: getStringNoLocale(thing, 'https://schema.org/creator'),
      lat_long: getStringNoLocale(thing, 'http://www.w3.org/2003/01/geo/wgs84_pos/lat_lon'),
      DeviceID: getStringNoLocale(thing, SCHEMA_INRUPT.identifier),
      tankViewers: getStringNoLocale(thing, 'https://schema.org/viewer')
      
    };
    output.push(tempObject);
  // });
  console.log(output);
  const data = output;
  const container = document.getElementById('container');
                  
    container.innerHTML = '';
    data.forEach(element => {
      const box = document.createElement('div');
      box.className = 'box';
      
      box.innerHTML = `
        <h2>${element.name}</h2>
        <h3>Admin Data</h3>
        <p>Device ID: ${element.DeviceID}</p>
        <p>Device Type: ${element.type}</p>
        <p>Manager: ${element.tankManager}</p>
        <p>Viewers: ${element.tankViewers}</p>
        <h3>Device Data</h3>
        <p>Value: ${element.value}</p>
        <p>Lat/Long: ${element.lat_long}</p>
        <p>Date Modified: ${element.date_modified}</p>
      `;

      // Add edit button to the div with a unique ID
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.className = "edit-button"; // Add class name
      editButton.id = "edit-button-" + element.DeviceID;
      box.appendChild(editButton);

      container.appendChild(box);
      
    });
}


async function deleteAllDevices(){
let SELECTED_POD_TEMP = document.getElementById("select-pod").value;
const podLocation = `${SELECTED_POD_TEMP}dosing-data/`;
try {
  await deleteSolidDataset(
    podLocation, 
    { fetch: fetch }           // fetch function from authenticated session
  );
} catch (error) {
  
  if (typeof error.statusCode === "number" && error.statusCode === 404) {
      // if not found, create a new SolidDataset (i.e., the reading list)
    console.log("No device in SOLID")
  } 
  else {
      console.error(error.message);
  }
}
}

function destroy(){

var olddata=document.getElementById("container").lastChild;
document.getElementById("container").removeChild(olddata);

}


buttonLogin.onclick = function () {
  loginToSelectedIdP();
};

deleteDevicesButton.onclick = function () {
  console.log("Delete all devices from the Pod");
  deleteAllDevices();
};



searchButton.onclick = function () {
  console.log("Search Button Pressed to Lookup a Device");
  var deviceLocation = document.getElementById("searchInput").value;
  if(deviceLocation.length ===0){
    document.getElementById("searchInput").placeholder = "This cannot be empty. Please Type URI of a device."
  }
  searchDevice(deviceLocation);
};
// buttonRead.onclick = function () {
//   getMyPods();
// };

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
