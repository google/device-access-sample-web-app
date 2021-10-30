
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


// Server Credentials:
const TOKEN_ENDPOINT = "https://www.googleapis.com/oauth2/v4/token";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/sdm.service";

// Configuration Variables:
let selectedAPI = "https://smartdevicemanagement.googleapis.com/v1";
let selectedEndpoint = "https://nestservices.google.com/partnerconnections/";
let selectedResourcePicker = "https://sdmresourcepicker.sandbox.google.com/";

// Partner Credentials:
let clientId = "";
let clientSecret = "";
let projectId = "";

// Authentication Variables:
let oauthCode = "";
let accessToken = "";
let refreshToken = "";


/** signIn - Initiates the OAuth flow for Account Linking */
function signIn() {
  // Calculating the redirect URI for current window
  let redirectURI = window.location.origin + '/auth';
   
  // Google's OAuth 2.0 endpoint for requesting an access token
  let oauthEndpoint = selectedEndpoint + projectId + "/auth";

  // Create <form> element to submit parameters to OAuth 2.0 endpoint.
  let form = document.createElement('form');
  form.setAttribute('method', 'GET');
  form.setAttribute('action', oauthEndpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  let params = {
    'access_type': 'offline',
    'client_id': clientId,
    'include_granted_scopes': 'true',
    'prompt' : 'consent',
    'redirect_uri': redirectURI,
    'response_type': 'code',
    'scope': OAUTH_SCOPE,
    'state': 'pass-through value'
  };

  // Add form parameters as hidden input values.
  for (let p in params) {
    let input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  pushLog(LogType.HTTP, "GET Request", JSON.stringify(form, null, 4));
  form.submit();
}

/** signOut - Clears the local variables and auth tokens */
function signOut() {
  // Clear Credentials:
  // updateClientId("");
  // updateClientSecret("");
  // updateProjectId("");

  // Clear Tokens:
  updateOAuthCode("");
  updateAccessToken("");
  updateRefreshToken("");

  // Clear Devices:
  clearDevices();

  // Signed Out:
  updateSignedIn(false);
}


/** handleAuth - Detects and sends oauth response code to server */
function handleAuth () {
  return new Promise(function (resolve, reject) {
    // Return if current URI does not begin with /auth:
    if (!window.location.pathname.startsWith("/auth")) {
      pushLog(LogType.ACTION, "Page Reload", window.location.pathname);
      resolve();
      return;
    }

    pushLog(LogType.HTTP, "Page Redirect", window.location.pathname);

    // Retrieve query parameters from url.
    const queryparams = window.location.search.split("&");

    // Extract key-value pairs from parameters.
    for (let i = 0; i < queryparams.length; i++) {
      const key = queryparams[i].split("=")[0];
      const val = queryparams[i].split("=")[1];

      // Send oAuth Code to server if found.
      if (key === "code") {
        updateOAuthCode(val);
      }
    }

    // Prevent back button action by injecting a previous state.
    window.history.pushState("object or string", "Title", "/");

    resolve();
  });
}


/** exchangeCode - Exchanges OAuth Code to OAuth Tokens */
function exchangeCode() {
  return new Promise(function (resolve, reject) {
    // Return if there is already an access code, or no OAuth Code:
    if(accessToken || !oauthCode) {
      resolve();
      return;
    }

    pushLog(LogType.ACTION, "Exchange Code", "Exchanging OAuth code for auth tokens.");

    // Calculate redirect URI for current window:
    let redirectURI = window.location.origin + '/auth';

    // Request Payload:
    let payload = {
      code: oauthCode,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      grant_type: 'authorization_code'
    };

    // Create Http Request:
    let xhr = new XMLHttpRequest();
    xhr.open('POST', TOKEN_ENDPOINT);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    // Http Response Callback:
    xhr.onload = function () {
      if(xhr.status === 200) {  // HTTP OK Response
        // Log Http response:
        let responsePayload = "* Payload: \n" + xhr.responseText;
        pushLog(LogType.HTTP, "POST Response", responsePayload);

        // Process tokens and sign in:
        let parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        updateRefreshToken(parsedResponse.refresh_token);
        updateSignedIn(true);
        resolve();

      } else {  // HTTP Error Response
        pushError(LogType.HTTP, "POST Response", xhr.responseText);

        // Invalidate tokens and sign out:
        updateAccessToken(undefined);
        updateRefreshToken(undefined);
        updateSignedIn(false);
        resolve();
      }
    };

    // Log Http request:
    let requestEndpoint = "* Endpoint: \n" + TOKEN_ENDPOINT;
    let requestPayload = "* Payload: \n" + JSON.stringify(payload, null, 4);
    pushLog(LogType.HTTP, "POST Request", requestEndpoint + "\n\n" + requestPayload);

    // Send Http request:
    pushLog(LogType.HTTP, "POST Request", JSON.stringify(payload, null, 4));
    xhr.send(JSON.stringify(payload));
  });
}

/** refreshAccess - Refreshes Access Token using the existing Refresh Token */
function refreshAccess () {
  return new Promise(function (resolve, reject) {
    // Return if there no refresh token:
    if(!refreshToken) {
      resolve();
      return;
    }

    pushLog(LogType.ACTION, "Refresh Access", "Refreshing Access Token using the available Refresh Token.");

    // Request Payload:
    let payload = {
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    };

    // Create Http Request:
    let xhr = new XMLHttpRequest();
    xhr.open('POST', TOKEN_ENDPOINT);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    // Http Response Callback:
    xhr.onload = function () {
      if(xhr.status === 200) {  // HTTP OK Response
        // Log Http response:
        let responsePayload = "* Payload: \n" + xhr.responseText;
        pushLog(LogType.HTTP, "POST Response", responsePayload);

        // Process access token:
        let parsedResponse = JSON.parse(xhr.responseText);
        updateAccessToken(parsedResponse.access_token);
        resolve();
      } else {  // HTTP Error Response
        pushError(LogType.HTTP, "POST Response", xhr.responseText);

        // Invalidate tokens:
        updateAccessToken(undefined);
        updateRefreshToken(undefined);
        resolve();
      }
    };

    // Log Http request:
    let requestEndpoint = "* Endpoint: \n" + TOKEN_ENDPOINT;
    let requestPayload = "* Payload: \n" + JSON.stringify(payload, null, 4);
    pushLog(LogType.HTTP, "POST Request", requestEndpoint + "\n\n" + requestPayload);

    // Send Http request:
    xhr.send(JSON.stringify(payload));
  });
}
