
/* Copyright 2020 Google LLC

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


// Device Access Variables:
let streamExtensionToken = "";


/** deviceAccessRequest - Issues requests to Device Access Rest API */
function deviceAccessRequest(method, call, localpath, payload = "") {
  let xhr = new XMLHttpRequest();
  xhr.open(method, selectedAPI + localpath);
  xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  xhr.onload = function () {
    if(xhr.status === 200) {
      let responsePayload = "* Payload: \n" + xhr.response;
      pushLog(LogType.HTTP, method + " Response", responsePayload);
      deviceAccessResponse(method, call, xhr.response);
    } else {
      pushError(LogType.HTTP, method + " Response", xhr.responseText);
    }
  };

  let requestEndpoint = "* Endpoint: \n" + selectedAPI + localpath;
  let requestAuthorization = "* Authorization: \n" + 'Bearer ' + accessToken;
  let requestPayload = "* Payload: \n" + JSON.stringify(payload, null, 4);
  pushLog(LogType.HTTP, method + " Request",
      requestEndpoint + "\n\n" + requestAuthorization + "\n\n" + requestPayload);

  if (method === 'POST' && payload && payload !== "") {
    xhr.send(JSON.stringify(payload));
  } else {
    xhr.send();
  }
}


/** deviceAccessResponse - Parses responses from Device Access API calls */
function deviceAccessResponse(method, call, response) {
  pushLog(LogType.HTTP, method + " Response", response);
  let data = JSON.parse(response);
  // Check if response data is empty:
  if(!data) {
    pushError(LogType.ACTION, "Empty Response!", "Device Access response contains empty response!");
    return;
  }
  // Based on the original request call, interpret the response:
  switch(call) {
    case 'listDevices':
      clearDevices(); // Clear the previously detected devices.

      // Check for detected devices:
      if(!data.devices) {
        pushError(LogType.ACTION, "No Devices!", "List Devices response contains no devices!");
        return;
      }

      // Iterate over detected devices:
      for (let i = 0; i < data.devices.length; i++) {
        // Parse Device Id:
        let scannedId = data.devices[i].name;
        let startIndexId = scannedId.lastIndexOf('/');
        let deviceId = scannedId.substring(startIndexId + 1);
        // Parse Device Type:
        let scannedType = data.devices[i].type;
        let startIndexType = scannedType.lastIndexOf('.');
        let deviceType = scannedType.substring(startIndexType + 1);
        // Parse Device Structure:
        let scannedAssignee = data.devices[i].assignee;
        let startIndexStructure = scannedAssignee.lastIndexOf('/structures/');
        let endIndexStructure = scannedAssignee.lastIndexOf('/rooms/');
        let deviceStructure = scannedAssignee.substring(startIndexStructure + 12, endIndexStructure);

        // Handle special case for Displays (Skip, no support!)
        if(deviceType === "DISPLAY")
          continue;

        // Handle special case for Thermostats (Read Temperature Unit)
        if(deviceType === "THERMOSTAT") {
          let tempScale = data.devices[i].traits["sdm.devices.traits.Settings"].temperatureScale;
          if(tempScale === "FAHRENHEIT") {
            document.getElementById("heatUnit").innerText = "°F";
            document.getElementById("coolUnit").innerText = "°F";
          } else {
            document.getElementById("heatUnit").innerText = "°C";
            document.getElementById("coolUnit").innerText = "°C";
          }
        }

        // Parse Device Room:
        let scannedName = data.devices[i].traits["sdm.devices.traits.Info"].customName;
        let scannedRelations = data.devices[i].parentRelations;
        let scannedRoom = scannedRelations[0]["displayName"];
        // Parse Device Name:
        let deviceName = scannedName !== "" ? scannedName : scannedRoom + " " + stringFormat(deviceType);
        // Parse Device Traits:
        let deviceTraits = Object.keys(data.devices[i].traits);

        // WebRTC check:
        let traitCameraLiveStream = data.devices[i].traits["sdm.devices.traits.CameraLiveStream"];

        if(traitCameraLiveStream) {
          let supportedProtocols = traitCameraLiveStream.supportedProtocols;
          if (supportedProtocols && supportedProtocols.includes("WEB_RTC")) {
            deviceType += "-webrtc";
            initializeWebRTC();
          }
        }

        addDevice(new Device(deviceId, deviceType, deviceName, deviceStructure, deviceTraits));
      }
      break;
    case 'listStructures':
      console.log("List Structures!");
      break;
    case 'generateStream':
      console.log("Generate Stream!");
      if(data["results"] && (data["results"].hasOwnProperty("streamExtensionToken") || data["results"].hasOwnProperty("mediaSessionId")))
        updateStreamExtensionToken(data["results"].streamExtensionToken || data["results"].mediaSessionId);
      if(data["results"] && data["results"].hasOwnProperty("answerSdp")) {
        updateWebRTC(data["results"].answerSdp);
        pushLog(LogType.ACTION, "[Video Stream]", "");
      }
      break;
    case 'refreshStream':
      console.log("Refresh Stream!");
      if(data["results"] && (data["results"].hasOwnProperty("streamExtensionToken") || data["results"].hasOwnProperty("mediaSessionId")))
        updateStreamExtensionToken(data["results"].streamExtensionToken || data["results"].mediaSessionId);
      break;
    case 'stopStream':
      console.log("Stop Stream!");
      initializeWebRTC();
      break;
    case 'fanMode':
      if(document.getElementById("btnFanMode").textContent === "Activate Fan")
        document.getElementById("btnFanMode").textContent = "Deactivate Fan";
      else
        document.getElementById("btnFanMode").textContent = "Activate Fan";
      break;
    case 'thermostatMode':
      console.log("Thermostat Mode!");
      break;
    case 'temperatureSetpoint':
      console.log("Temperature Setpoint!");
      break;
    default:
      pushError(LogType.ACTION, "Error", "Unrecognized Request Call!");
  }
}

/** openResourcePicker - Opens Resource Picker on a new browser tab */
function openResourcePicker() {
  window.open(selectedResourcePicker);
}



/// Device Access API ///

/** onListDevices - Issues a ListDevices request */
function onListDevices() {
  let endpoint = "/enterprises/" + projectId + "/devices";
  deviceAccessRequest('GET', 'listDevices', endpoint);
}

/** onListStructures - Issues a ListStructures request */
function onListStructures() {
  let endpoint = "/enterprises/" + projectId + "/structures";
  deviceAccessRequest('GET', 'listStructures', endpoint);
}

/** onFan - Issues a FanMode change request */
function onFan() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  // Construct the payload:
  let payload = {
    "command": "sdm.devices.commands.Fan.SetTimer",
    "params": {}
  };
  // Set correct FanMode based on the current selection:
  switch (document.getElementById("btnFanMode").textContent) {
    case "Activate Fan":
      payload.params["timerMode"] = "ON";
      payload.params["duration"] = "3600s";
      break;
    case "Deactivate Fan":
      payload.params["timerMode"] = "OFF";
      break;
    default:
      pushError(LogType.ACTION, "Error", "Button Mode not recognized!");
      return;
  }
  deviceAccessRequest('POST', 'fanMode', endpoint, payload);
}

/** onThermostatMode - Issues a ThermostatMode request */
function onThermostatMode() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let tempMode = document.getElementById("sctThermostatMode").value;
  let payload = {
    "command": "sdm.devices.commands.ThermostatMode.SetMode",
    "params": {
      "mode": tempMode
    }
  };
  deviceAccessRequest('POST', 'thermostatMode', endpoint, payload);
}

/** onTemperatureSetpoint - Issues a TemperatureSetpoint request */
function onTemperatureSetpoint() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let heatCelsius = parseFloat(document.getElementById("txtHeatTemperature").value);
  let coolCelsius = parseFloat(document.getElementById("txtCoolTemperature").value);
  // Convert temperature values based on temperature unit:
  if(document.getElementById("heatUnit").innerText === "°F") {
    heatCelsius = (heatCelsius - 32) * 5 / 9;
  }
  if(document.getElementById("coolUnit").innerText === "°F") {
    coolCelsius = (coolCelsius - 32) * 5 / 9;
  }
  // Construct the payload:
  let payload = {
    "command": "",
    "params": {}
  };
  // Set correct temperature fields based on the selected ThermostatMode:
  switch (document.getElementById("sctThermostatMode").value) {
    case "HEAT":
      payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat";
      payload.params["heatCelsius"] = heatCelsius;
      break;
    case "COOL":
      payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool";
      payload.params["coolCelsius"] = coolCelsius;
      break;
    case "HEATCOOL":
      payload.command = "sdm.devices.commands.ThermostatTemperatureSetpoint.SetRange";
      payload.params["heatCelsius"] = heatCelsius;
      payload.params["coolCelsius"] = coolCelsius;
      break;
    default:
      pushError(LogType.ACTION, "Invalid Mode!", "Off and Eco modes don't allow this function!"
          + "\n (Try changing the Thermostat Mode to some other value)");
      return;
  }
  deviceAccessRequest('POST', 'temperatureSetpoint', endpoint, payload);
}

/** onGenerateStream - Issues a GenerateRtspStream request */
function onGenerateStream() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.GenerateRtspStream"
  };
  deviceAccessRequest('POST', 'generateStream', endpoint, payload);
}

/** onExtendStream - Issues a ExtendRtspStream request */
function onExtendStream() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.ExtendRtspStream",
    "params": {
      "streamExtensionToken" : streamExtensionToken
    }
  };
  deviceAccessRequest('POST', 'refreshStream', endpoint, payload);
}

/** onStopStream - Issues a StopRtspStream request */
function onStopStream() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.StopRtspStream",
    "params": {
      "streamExtensionToken" : streamExtensionToken
    }
  };
  deviceAccessRequest('POST', 'stopStream', endpoint, payload);
}

/** onGenerateStream_WebRTC - Issues a GenerateWebRtcStream request */
function onGenerateStream_WebRTC() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream",
    "params": {
      "offerSdp": offerSDP
    }
  };

  deviceAccessRequest('POST', 'generateStream', endpoint, payload);
}

/** onExtendStream_WebRTC - Issues a ExtendWebRtcStream request */
function onExtendStream_WebRTC() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream",
    "params": {
      "mediaSessionId" : streamExtensionToken
    }
  };
  deviceAccessRequest('POST', 'refreshStream', endpoint, payload);
}

/** onStopStream_WebRTC - Issues a StopWebRtcStream request */
function onStopStream_WebRTC() {
  let endpoint = "/enterprises/" + projectId + "/devices/" + selectedDevice.id + ":executeCommand";
  let payload = {
    "command": "sdm.devices.commands.CameraLiveStream.StopWebRtcStream",
    "params": {
      "mediaSessionId" : streamExtensionToken
    }
  };
  deviceAccessRequest('POST', 'stopStream', endpoint, payload);
}
