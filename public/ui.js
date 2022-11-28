
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


/// UI Controller Functions - Buttons ///

function clickSignIn() {
  if (isSignedIn) {
    pushLog(LogType.ACTION, "Sign Out", "Signing out.");
    signOut();
  } else {
    pushLog(LogType.ACTION, "Sign In", "Signing in.");
    signIn();
  }
}

function clickViewOAuthCode() {
  pushLog(LogType.ACTION, "View OAuth Code", oauthCode);
}

function clickViewAccessToken() {
  pushLog(LogType.ACTION, "View Access Token", accessToken);
}

function clickViewRefreshToken() {
  pushLog(LogType.ACTION, "View Refresh Token", refreshToken);
}

function clickSubscribe() {
  if(isSubscribed) {
    pushLog(LogType.ACTION, "Unsubscribe", "Unsubscribing from PubSub events on Google Cloud Platform");
    updateSubscribed(false);
  } else {
    pushLog(LogType.ACTION, "Subscribe", "Subscribing to PubSub events on Google Cloud Platform");
    if(!logFilter.includes(LogType.EVENT)) {
      onFilterEvent()
    }
    updateSubscribed(true);
    pubsubEvents();
  }
}

function clickGetEvents() {
  pushLog(LogType.ACTION, "Get Events", "Getting PubSub events from Google Cloud Platform");
  if(!logFilter.includes(LogType.EVENT)) {
    onFilterEvent()
  }
  pubsubEvents();
}

function clickResourcePicker() {
  pushLog(LogType.ACTION, "Resource Picker", "Opening up Resource Picker");
  openResourcePicker();
}

function clickListDevices() {
  pushLog(LogType.ACTION, "List Devices", "Initiating List Devices call to Device Access API");
  onListDevices();
}

function clickListStructures() {
  pushLog(LogType.ACTION, "List Structures", "Initiating List Structures call to Device Access API");
  onListStructures();
}

function clickFanMode() {
  pushLog(LogType.ACTION, "Fan Mode", "");
  onFan();
}

function clickThermostatMode() {
  pushLog(LogType.ACTION, "Thermostat Mode", "");
  onThermostatMode();
}

function clickTemperatureSetpoint() {
  pushLog(LogType.ACTION, "Temperature Setpoint", "");
  onTemperatureSetpoint();
}

function clickGenerateStream() {
  pushLog(LogType.ACTION, "Camera Stream", "Initiating Camera Stream call to Device Access API");
  onGenerateStream();
}

function clickExtendStream() {
  pushLog(LogType.ACTION, "Refresh Stream", "Initiating Refresh Camera Stream call to Device Access API");
  onExtendStream();
}

function clickStopStream() {
  pushLog(LogType.ACTION, "Stop Stream", "Initiating Stop Camera Stream call to Device Access API");
  onStopStream();
}

function clickGenerateStream_WebRTC() {
  pushLog(LogType.ACTION, "Camera Stream", "Initiating Camera Stream (WebRTC) call to Device Access API");
  onGenerateStream_WebRTC();
}

function clickExtendStream_WebRTC() {
  pushLog(LogType.ACTION, "Refresh Stream", "Initiating Refresh Camera Stream call to Device Access API");
  onExtendStream_WebRTC();
}

function clickStopStream_WebRTC() {
  pushLog(LogType.ACTION, "Stop Stream", "Initiating Stop Camera Stream call to Device Access API");
  onStopStream_WebRTC();
}

/** clickClearLogs - Clears the list of logs, and the selected log */
function clickClearLogs() {
  document.getElementById("log-container").innerHTML = '';
  document.getElementById("log-title").innerHTML = '';
  document.getElementById("log-text").innerHTML = '';
  document.getElementById("log-time").innerHTML = '';
  document.getElementById("log-type").innerHTML = '';
  localStorage.removeItem("logs");
  logs = [];
}


/// UI Controller Functions - Text Input ///

function typeClientId() {
  updateClientId(document.getElementById("txtClientId").value);
}

function typeClientSecret() {
  updateClientSecret(document.getElementById("txtClientSecret").value);
}

function typeProjectId() {
  updateProjectId(document.getElementById("txtProjectId").value);
}

function typeSubscriptionId() {
  updateSubscriptionId(document.getElementById("txtSubscriptionId").value);
}

function typeServiceAccountKey() {
  updateServiceAccountKey(document.getElementById("txtServiceAccountKey").value);
}


/// UI Controller Functions - Selector ///

function selectDevice() {
  selectedDevice = JSON.parse(document.getElementById("sctDeviceList").value);
  pushLog(LogType.ACTION, "Select Device", "Device Selection changed to " + selectedDevice.name);
  showDeviceControls();
}


/// UI Controller Functions - Buttons ///

function updateClientId(value) {
  clientId = value;
  localStorage["clientId"] = clientId;
  document.getElementById("txtClientId").value = clientId;
}

function updateClientSecret(value) {
  clientSecret = value;
  localStorage["clientSecret"] = clientSecret;
  document.getElementById("txtClientSecret").value = clientSecret;
}

function updateProjectId(value) {
  projectId = value;
  localStorage["projectId"] = projectId;
  document.getElementById("txtProjectId").value = projectId;
}

function updateSubscriptionId(value) {
  subscriptionId = value;
  localStorage["subscriptionId"] = subscriptionId;
  document.getElementById("txtSubscriptionId").value = subscriptionId;
}

function updateServiceAccountKey(value) {
  serviceAccountKey = value;
  localStorage["serviceAccountKey"] = serviceAccountKey;
  document.getElementById("txtServiceAccountKey").value = serviceAccountKey;
}

function updateOfferSDP(value) {
  offerSDP = value;
  document.getElementById("txtOfferSDPCamera").value = offerSDP;
  document.getElementById("txtOfferSDPDoorbell").value = offerSDP;
}

function updateStreamExtensionToken(value) {
  streamExtensionToken = value;
  document.getElementById("txtExtensionToken1").value = streamExtensionToken;
  document.getElementById("txtExtensionToken2").value = streamExtensionToken;
  document.getElementById("txtExtensionToken3").value = streamExtensionToken;
  document.getElementById("txtExtensionToken4").value = streamExtensionToken;
}

function updateOAuthCode(value) {
  oauthCode = value;
  localStorage["oauthCode"] = oauthCode;

  if(value === "") {
    document.getElementById("imgOAuthCode").src = "images/empty.png";
    document.getElementById("imgOAuthCode").alt = "Pending...";
    document.getElementById("imgOAuthCode").title = "";
  } else if(value === undefined) {
    document.getElementById("imgOAuthCode").src = "images/failure.png";
    document.getElementById("imgOAuthCode").alt = "Failure!";
    document.getElementById("imgOAuthCode").title = "";
  } else {
    document.getElementById("imgOAuthCode").src = "images/success.png";
    document.getElementById("imgOAuthCode").alt = "Success!";
    document.getElementById("imgOAuthCode").title = oauthCode;
  }
}

function updateAccessToken(value) {
  accessToken = value;
  localStorage["accessToken"] = accessToken;

  if(value === "") {
    document.getElementById("imgAccessToken").src = "images/empty.png";
    document.getElementById("imgAccessToken").alt = "Pending...";
    document.getElementById("imgAccessToken").title = "";
  } else if(value === undefined) {
    document.getElementById("imgAccessToken").src = "images/failure.png";
    document.getElementById("imgAccessToken").alt = "Failure!";
    document.getElementById("imgAccessToken").title = "";
  } else {
    document.getElementById("imgAccessToken").src = "images/success.png";
    document.getElementById("imgAccessToken").alt = "Success!";
    document.getElementById("imgAccessToken").title = accessToken;
  }
}

function updateRefreshToken(value) {
  refreshToken = value;
  localStorage["refreshToken"] = refreshToken;

  if(value === "") {
    document.getElementById("imgRefreshToken").src = "images/empty.png";
    document.getElementById("imgRefreshToken").alt = "Pending...";
    document.getElementById("imgRefreshToken").title = "";
  } else if(value === undefined) {
    document.getElementById("imgRefreshToken").src = "images/failure.png";
    document.getElementById("imgRefreshToken").alt = "Failure!";
    document.getElementById("imgRefreshToken").title = "";
  } else {
    document.getElementById("imgRefreshToken").src = "images/success.png";
    document.getElementById("imgRefreshToken").alt = "Success!";
    document.getElementById("imgRefreshToken").title = refreshToken;
  }
}

function updateSignedIn(value) {
  isSignedIn = value;
  localStorage["isSignedIn"] = isSignedIn;

  if (isSignedIn) {
    document.getElementById("btnSignIn").innerText = "Sign Out";
  }
  else {
    document.getElementById("btnSignIn").innerText = "Sign In";
  }

  updateSubscribed(false);
  updateAppControls();
}

function updateSubscribed(value) {
  isSubscribed = value;
  localStorage["isSubscribed"] = isSubscribed;

  if (isSubscribed) {
    document.getElementById("btnSubscribe").innerText = "UnSubscribe";
    document.getElementById("txtSubscriptionId").disabled = true;
    document.getElementById("txtServiceAccountKey").disabled = true;
    document.getElementById("btnGetEvents").disabled = true;
  }
  else {
    document.getElementById("btnSubscribe").innerText = "Subscribe";
    document.getElementById("txtSubscriptionId").disabled = false;
    document.getElementById("txtServiceAccountKey").disabled = false;
    document.getElementById("btnGetEvents").disabled = false;
  }
}

function updateLogFilter(value) {
  logFilter = value;
  localStorage["logFilter"] = logFilter;

  if (logFilter.includes(LogType.ACTION)) {
    document.getElementById("btnFilterAction").classList.add("filter-action");
  }
  else {
    document.getElementById("btnFilterAction").classList.remove("filter-action");
  }

  if (logFilter.includes(LogType.HTTP)) {
    document.getElementById("btnFilterHTTP").classList.add("filter-http");
  }
  else {
    document.getElementById("btnFilterHTTP").classList.remove("filter-http");
  }

  if (logFilter.includes(LogType.EVENT)) {
    document.getElementById("btnFilterEvent").classList.add("filter-event");
  }
  else {
    document.getElementById("btnFilterEvent").classList.remove("filter-event");
  }

  document.getElementById("log-container").innerHTML = "";
  addLogEntries(logs);
}

function updateAppControls() {
  if(isSignedIn) {
    // Account Linking Controls:
    document.getElementById("txtClientId").disabled = true;
    document.getElementById("txtClientSecret").disabled = true;
    document.getElementById("txtProjectId").disabled = true;
    // Auth Token Controls:
    document.getElementById("imgOAuthCode").classList.remove("disabled-text");
    document.getElementById("imgAccessToken").classList.remove("disabled-text");
    document.getElementById("imgRefreshToken").classList.remove("disabled-text");
    document.getElementById("hdrOAuthCode").classList.remove("disabled-text");
    document.getElementById("hdrAccessToken").classList.remove("disabled-text");
    document.getElementById("hdrRefreshToken").classList.remove("disabled-text");
    document.getElementById("btnViewOAuthCode").disabled = false;
    document.getElementById("btnViewAccessToken").disabled = false;
    document.getElementById("btnViewRefreshToken").disabled = false;
    // Device Access Controls:
    document.getElementById("hdrDeviceAccess").classList.remove("disabled-text");
    document.getElementById("btnResourcePicker").disabled = false;
    document.getElementById("btnListDevices").disabled = false;
    document.getElementById("btnListStructures").disabled = false;
    // Device Events Controls:
    document.getElementById("hdrDeviceEvents").classList.remove("disabled-text");
    document.getElementById("txtSubscriptionId").disabled = false;
    document.getElementById("txtServiceAccountKey").disabled = false;
    document.getElementById("btnSubscribe").disabled = false;
    document.getElementById("btnGetEvents").disabled = false;
    // Device Control Controls:
    document.getElementById("hdrDeviceControl").classList.remove("disabled-text");
    document.getElementById("sctDeviceList").disabled = false;
  } else {
    // Account Linking Controls:
    document.getElementById("txtClientId").disabled = false;
    document.getElementById("txtClientSecret").disabled = false;
    document.getElementById("txtProjectId").disabled = false;
    // Auth Token Controls:
    document.getElementById("imgOAuthCode").classList.add("disabled-text");
    document.getElementById("imgAccessToken").classList.add("disabled-text");
    document.getElementById("imgRefreshToken").classList.add("disabled-text");
    document.getElementById("hdrOAuthCode").classList.add("disabled-text");
    document.getElementById("hdrAccessToken").classList.add("disabled-text");
    document.getElementById("hdrRefreshToken").classList.add("disabled-text");
    document.getElementById("btnViewOAuthCode").disabled = true;
    document.getElementById("btnViewAccessToken").disabled = true;
    document.getElementById("btnViewRefreshToken").disabled = true;
    // Device Access Controls
    document.getElementById("hdrDeviceAccess").classList.add("disabled-text");
    document.getElementById("btnResourcePicker").disabled = true;
    document.getElementById("btnListDevices").disabled = true;
    document.getElementById("btnListStructures").disabled = true;
    // Device Events Controls
    document.getElementById("hdrDeviceEvents").classList.add("disabled-text");
    document.getElementById("txtSubscriptionId").disabled = true;
    document.getElementById("txtServiceAccountKey").disabled = true;
    document.getElementById("btnSubscribe").disabled = true;
    document.getElementById("btnGetEvents").disabled = true;
    // Device Control Controls:
    document.getElementById("hdrDeviceControl").classList.add("disabled-text");
    document.getElementById("sctDeviceList").disabled = true;
  }
}

function showDeviceControls() {
  hideDeviceControls();
  console.log("DEV", selectedDevice);
  let controlArea = selectedDevice.type.toLowerCase() + "-control";
  document.getElementById(controlArea).removeAttribute("hidden");
}

function hideDeviceControls() {
  document.getElementById("thermostat-control").setAttribute("hidden", true);
  document.getElementById("camera-control").setAttribute("hidden", true);
  document.getElementById("doorbell-control").setAttribute("hidden", true);
  document.getElementById("camera-webrtc-control").setAttribute("hidden", true);
  document.getElementById("doorbell-webrtc-control").setAttribute("hidden", true);
}

function updateAnalytics() {
  // Initialize webRtc => setLocalDescription success (page launch)
  let analyticsInitialized= "-";
  if (timestampSetLocalDescriptionSuccess != undefined && timestampInitializeWebRTC != undefined) {
    analyticsInitialized = timestampSetLocalDescriptionSuccess - timestampInitializeWebRTC + "ms";
  }

  // Send SDP Offer (generate stream) => Receive SDP Answer (generate stream response)
  let analyticsAnswerReceived = "-";
  if (timestampGenerateStreamResponse != undefined && timestampGenerateWebRtcStreamRequest != undefined) {
    analyticsAnswerReceived = timestampGenerateStreamResponse - timestampGenerateWebRtcStreamRequest + "ms";
  }

  // Receive SDP Answer (generate stream response) => Connected
  let analyticsConnected= "-";
  if (timestampConnected != undefined && timestampGenerateStreamResponse != undefined) {
    analyticsConnected = timestampConnected - timestampGenerateStreamResponse + "ms";
  }

  // Connected => Playback Started
  let analyticsPlaybackStarted = "-";
  if (timestampPlaybackStarted != undefined && timestampConnected != undefined) {
    analyticsPlaybackStarted = timestampPlaybackStarted - timestampConnected + "ms";
  }

  document.getElementById("analyticsInitialized").innerHTML = analyticsInitialized;
  document.getElementById("analyticsAnswerReceived").innerHTML = analyticsAnswerReceived;
  document.getElementById("analyticsConnected").innerHTML = analyticsConnected;
  document.getElementById("analyticsPlaybackStarted").innerHTML = analyticsPlaybackStarted;
}


/// Logging Functions ///

function showLogEntry(index){
  let logTitle = document.getElementById("log-title");
  let logText = document.getElementById("log-text");
  let logTime = document.getElementById("log-time");
  let logType = document.getElementById("log-type");

  logTitle.textContent = filteredLogs[index].title;
  logText.textContent = filteredLogs[index].text;
  logTime.textContent = filteredLogs[index].time;
  logType.textContent = filteredLogs[index].type;

  logType.classList.remove("filter-action");
  logType.classList.remove("filter-http");
  logType.classList.remove("filter-event");

  switch (filteredLogs[index].type) {
    case LogType.ACTION :
      logType.classList.add("filter-action");
      break;
    case LogType.HTTP :
      logType.classList.add("filter-http");
      break;
    case LogType.EVENT :
      logType.classList.add("filter-event");
      break;
  }

  if (filteredLogs[index].status === LogStatus.ERROR) {
    logText.setAttribute("style", "color: #AA0000;");
  } else {
    logText.removeAttribute("style");
  }

  if(logTitle.textContent.includes("Video Stream")) {
    document.getElementById("log-video").removeAttribute("style");
    document.getElementById("video-stream").removeAttribute("hidden");
    document.getElementById("log-text").setAttribute("hidden", "");
  } else {
    document.getElementById("log-video").setAttribute("style", "display: none;");
    document.getElementById("video-stream").setAttribute("hidden", "");
    document.getElementById("log-text").removeAttribute("hidden");
  }
}
