
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


// Event Constants:
const PUBSUB_ENDPOINT = "https://pubsub.googleapis.com/v1";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/token";
const EVENT_CHECK_INTERVAL = 4000;

// Event Credentials:
let subscriptionId = "";
let serviceAccountKey = "";

// Create a timed function for event checker:
setInterval(eventChecker, EVENT_CHECK_INTERVAL);


/// Event Functions ///

/** eventChecker - Service routine function for issuing automated pubsub calls */
function eventChecker() {
  if(isSubscribed)
    pubsubEvents();
}

/** pubsubEvents - Pubsub controller function (first gets an Access Token, then issues a pubsub pull) */
function pubsubEvents() {
  let parsedKey;

  try {
    parsedKey = JSON.parse(serviceAccountKey);
  } catch (e) {
    pushError(LogType.ACTION, "Parsing Error!", "Can't parse Service Account Key!");
    return;
  }

  // Function to create token request header:
  function getHeader() {
    return {
      "alg": "RS256",
      "typ": "JWT"
    };
  }

  // Function to create token request payload:
  function getPayload() {
    let iat = Math.round((new Date()).getTime() / 1000);
    let exp = iat + (60 * 60);

    return {
      "iss": parsedKey.client_email,
      "scope": "https://www.googleapis.com/auth/cloud-platform "
          + "https://www.googleapis.com/auth/pubsub",
      "aud": AUTH_ENDPOINT,
      "iat": iat,
      "exp": exp
    };
  }

  // Signing token request with KJUR library:
  let signedJWT = KJUR.jws.JWS.sign(null,
      JSON.stringify(getHeader()),
      JSON.stringify(getPayload()),
      parsedKey.private_key);

  // Request body to get access token with signed JWT:
  let body = {
    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
    "assertion": signedJWT
  };

  // Callback function for token request:
  function callback (responseText) {
    let response = JSON.parse(responseText);
    // if response contains an access token, issue pubsub pull:
    if (response["access_token"]) {
      pubSubPull(response["access_token"]);
    } else {
      pushError(LogType.ACTION, "Authentication Error!", "Unable to authenticate Subscription Id / Service Account Key pair!");
      updateSubscribed(false)
    }
  }

  // Issue token request, then a pubsub pull using that token:
  postRequest(AUTH_ENDPOINT, body, callback);
}

/** pubSubPull - Function to issue a pubsub pull request */
function pubSubPull(token) {
  // Construct url for pubsub pull:
  const url = buildSubscriptionUrl() + ":pull";

  // Request body for pubsub pull:
  const body = {
    "returnImmediately": false,
    "maxMessages": 20
  };

  // Callback function for pubsub pull:
  function callback (responseText) {
    let response = JSON.parse(responseText);
    const ackIds = {"ackIds": []};
    if (response.receivedMessages) {
      const messages = response.receivedMessages;
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          let payloadRaw = atob(messages[i].message.data).toString();
          let payloadString = JSON.stringify(JSON.parse(payloadRaw));
          pushLog(LogType.EVENT, "Event Received", payloadString);
          ackIds.ackIds.push(messages[i].ackId);
        }
      }
    }
    // Acknowledge messages:
    if (ackIds.ackIds.length > 0) {
      ack(token, ackIds);
    }
  }

  // Issue pubsub pull:
  postRequest(url, body, callback, token);
}

/** ack - Function to issue a pubsub ack request */
function ack(token, ackIds) {
  // Construct url for pubsub ack:
  const url = buildSubscriptionUrl() + ":acknowledge";

  // Callback function for pubsub ack:
  function callback (responseText) {
    console.log('ack callback', JSON.stringify(JSON.parse(responseText)));
  }

  // Issue pubsub ack:
  postRequest(url, ackIds, callback, token);
}


/// Helper Functions ///

/** postRequest - Helper function to issue post request for events */
function postRequest(endpoint, payload, callback, token = null) {
  // Create post request:
  let xhr = new XMLHttpRequest();
  xhr.open("POST", endpoint);

  // Set request headers:
  if (token)
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

  // Set response callback:
  xhr.onload = function () {
    if(xhr.status === 200) {
      callback(xhr.responseText);
    } else {
      pushError(LogType.ACTION, "Error Response", xhr.response);
    }
  };

  // Send request:
  xhr.send(JSON.stringify(payload));
}

/** buildSubscriptionUrl - Function to issue a pubsub ack request */
function buildSubscriptionUrl() {
  if (subscriptionId.includes("projects/") || subscriptionId.includes("subscriptions/")) {
    let startSubscriptionId = subscriptionId.lastIndexOf('/');
    subscriptionId = subscriptionId.substring(startSubscriptionId + 1);
    updateSubscriptionId(subscriptionId);
  }

  const parsedKey = JSON.parse(serviceAccountKey);
  const projectPath = "projects/" + parsedKey.project_id;
  const subscriptionPath = "subscriptions/" + subscriptionId;
  return PUBSUB_ENDPOINT + "/" + projectPath + "/" + subscriptionPath;
}