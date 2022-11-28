
/* Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


// State Variables:
let isSignedIn = false;
let isSubscribed = false;
let selectedDevice;


/// Primary Functions ///

/** init - Initializes the loaded javascript */
async function init() {
  readStorage();                // Reads data from browser's local storage if available
  await handleAuth();           // Checks incoming authorization code from /auth path
  await exchangeCode();         // Exchanges authorization code to an access token
  await refreshAccess();        // Retrieves a new access token using refresh token
  initializeDevices();          // Issues a list devices call if logged-in
}

/** readStorage - Reads data from browser's local storage if available */
function readStorage() {

  if (localStorage["logs"]) {
    // Parse local storage for logs:
    const parsedStorage = JSON.parse(localStorage["logs"]);
    // Read the parsed storage:
    if (Array.isArray(parsedStorage))
      for (let i = 0; i < parsedStorage.length; i++)
        logs.push(parsedStorage[i]);
    // Display ingested logs:
    addLogEntries(logs);
  }

  if (localStorage["clientId"]) {
    updateClientId(localStorage["clientId"]);
  }
  if (localStorage["clientSecret"]) {
    updateClientSecret(localStorage["clientSecret"]);
  }
  if (localStorage["projectId"]) {
    updateProjectId(localStorage["projectId"]);
  }

  if (localStorage["oauthCode"]) {
    updateOAuthCode(localStorage["oauthCode"]);
  }
  if (localStorage["accessToken"]) {
    updateAccessToken(localStorage["accessToken"]);
  }
  if (localStorage["refreshToken"]) {
    updateRefreshToken(localStorage["refreshToken"]);
  }

  if (localStorage["isSignedIn"] === true || localStorage["isSignedIn"] === "true") {
    updateSignedIn(localStorage["isSignedIn"]);
  }
  // Update the App Controls based on isSignedIn:
  updateAppControls();

  if (localStorage["subscriptionId"]) {
    updateSubscriptionId(localStorage["subscriptionId"]);
  }

  if (localStorage["serviceAccountKey"]) {
    updateServiceAccountKey(localStorage["serviceAccountKey"]);
  }

  if (localStorage["logFilter"]) {
    logFilter = localStorage["logFilter"].split(",");
  }
  // Update the Log Filters based on logFilter:
  updateLogFilter(logFilter);
}

/** initializeDevices - Issues a list devices call if logged-in */
function initializeDevices() {
  if(isSignedIn) {
    clickListDevices();
  }
}


/// Helper Functions ///

/** Device Object Model */
class Device {
  constructor(id, type, name, structure, traits) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.structure = structure;
    this.traits = traits;
  }
}

/** addDevice - Add device to Device Control list */
function addDevice(device) {
  // Create an Option object
  let opt = document.createElement("option");

  // Assign text and value to Option object
  opt.text = device.name;
  opt.value = JSON.stringify(device);

  // Add an Option object to Drop Down List Box
  document.getElementById("sctDeviceList").options.add(opt);

  // If this is the first device added, choose it
  if(document.getElementById("sctDeviceList").options.length === 1) {
    selectedDevice = device;
    showDeviceControls();
  }
}

/** clearDevices - Clear Device Control list */
function clearDevices() {
  let deviceListLength = document.getElementById("sctDeviceList").options.length;
  for (let i = deviceListLength - 1; i >= 0; i--) {
    document.getElementById("sctDeviceList").options[i] = null;
  }
  hideDeviceControls();
}

/** stringFormat - Formats input string to Upper Camel Case */
function stringFormat(str) {
  return str.replace(/(\w)(\w*)/g,
      function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
}
