
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


// WebRTC Variables:

let localPeerConnection;
let localSendChannel;
let localStream;
let remoteStream;
let offerSDP = "";
let initialized = false;
let videoElement;


// WebRTC Configurations:

const localOfferOptions = {
  offerToReceiveVideo: 1,
  offerToReceiveAudio: 1,
};

const mediaStreamConstraints = {
  audio: false,
  video: false,
};

// WebRTC Analytics:

// Page launch
let timestampInitializeWebRTC;
let timestampStartLocalStream;
let timestampCreateSdpOffer;
let timestampCreateSdpOfferSuccess;
let timestampSetLocalDescription;
let timestampSetLocalDescriptionSuccess;

// Camera Stream button pressed
let timestampGenerateStreamRequest;
let timestampGenerateWebRtcStreamRequest; // senderSdpOffer
let timestampGenerateStreamResponse; // sendSdpOffer success / timestampSdpAnswerReceived
let timestampExtendStreamRequest;
let timestampExtendWebRtcStreamRequest;
let timestampExtendStreamResponse;
let timestampStopStreamRequest;
let timestampStopWebRtcStreamRequest;
let timestampStopStreamResponse;
let timestampSetRemoteDescription;
let timestampSetRemoteDescriptionSuccess;
let timestampConnected;
let timestampPlaybackStarted;

/// WebRTC Functions ///

/** initializeWebRTC - Triggers starting a new WebRTC stream on initialization */
function initializeWebRTC() {
  if(initialized===true)
    return;
  timestampInitializeWebRTC = new Date();
  updateAnalytics();
  console.log(`initializeWebRTC() - `, timestampInitializeWebRTC);

  videoElement = document.getElementById('video-stream');
  videoElement.addEventListener('play', (event) => {
    timestampPlaybackStarted = new Date();
    updateAnalytics();
    console.log('playback started - ', timestampPlaybackStarted);
  });

  initialized = true;
  startLocalStream();
}

/** startLocalStream - Starts a WebRTC stream on the browser */
function startLocalStream(mediaStream) {
  timestampStartLocalStream = new Date();
  updateAnalytics();
  console.log(`startLocalStream() - `, timestampStartLocalStream);
  localPeerConnection = null;
  localSendChannel = null;
  localStream = null;
  offerSDP = "";

  remoteStream = new MediaStream();

  const servers = { 'sdpSemantics': 'unified-plan', 'iceServers': []  };
  localPeerConnection = new RTCPeerConnection(servers);
  localPeerConnection.ondatachannel = receiveChannelCallback;

  localSendChannel = localPeerConnection.createDataChannel('dataSendChannel', null);
  localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);

  if(mediaStream) {
    mediaStream.getTracks().forEach((track) => {
      localPeerConnection.addTrack(track, mediaStream);
      console.log(`track added!`);
    });
    localStream = mediaStream;
  }

  localPeerConnection.addEventListener('track', gotRemoteMediaTrack);

  timestampCreateSdpOffer = new Date();
  updateAnalytics();
  console.log('localPeerConnection createOffer start - ', timestampCreateSdpOffer);
  localPeerConnection.createOffer(localOfferOptions)
      .then(createdOffer).catch(setSessionDescriptionError);
}

/** createdOffer - Handles local offerSDP creation */
function createdOffer(description) {
  timestampCreateSdpOfferSuccess = new Date();
  updateAnalytics();
  console.log(`createdOffer() - `, timestampCreateSdpOfferSuccess);
  updateOfferSDP(description.sdp);
  timestampSetLocalDescription = new Date();
  updateAnalytics();
  console.log(`setLocalDescription() - `, timestampSetLocalDescription);
  localPeerConnection.setLocalDescription(description)
      .then(() => {
        setLocalDescriptionSuccess(localPeerConnection);
      }).catch(setSessionDescriptionError);
}

/** updateWebRTC - Updates WebRTC connection on receiving answerSDP */
function updateWebRTC(answerSDP) {
  console.log(`Answer from remotePeerConnection:\n${answerSDP} - `);
  if (answerSDP[answerSDP.length - 1] !== '\n') {
    answerSDP += '\n';
  }

  timestampSetRemoteDescription = new Date();
  updateAnalytics();
  console.log(`setRemoteDescription() - `, timestampSetRemoteDescription);
  localPeerConnection.setRemoteDescription({ "type": "answer", "sdp": answerSDP })
      .then(() => {
        setRemoteDescriptionSuccess(localPeerConnection);
      }).catch(setSessionDescriptionError);
}



/// Helper Functions ///

/** getPeerName - Handles received peer name */
function getPeerName(peerConnection) {
  console.log(`getPeerName()`);
  return (peerConnection === localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
}

/** gotRemoteMediaTrack - Handles received media track */
function gotRemoteMediaTrack(event) {
  console.log(`gotRemoteMediaTrack()`);
  remoteStream.addTrack(event.track);
  document.getElementById("video-stream").srcObject = remoteStream;
  console.log('Received remote track.');
}

/** receiveChannelCallback - Handles received channel callback */
const receiveChannelCallback = (event) => {
  console.log('receiveChannelCallback');
  const receiveChannel = event.channel;
  receiveChannel.onmessage = handleReceiveMessage;
};

/** setDescriptionSuccess - Handles received success description */
function setDescriptionSuccess(peerConnection, functionName) {
  console.log(`setDescriptionSuccess()`);
  const peerName = getPeerName(peerConnection);
  console.log(`${peerName} ${functionName} complete`);
}

/** setLocalDescriptionSuccess - Handles received local success description */
function setLocalDescriptionSuccess(peerConnection) {
  timestampSetLocalDescriptionSuccess = new Date();
  updateAnalytics();
  console.log(`setLocalDescriptionSuccess() - `, timestampSetLocalDescriptionSuccess);
  setDescriptionSuccess(peerConnection, 'setLocalDescription');
}

/** setRemoteDescriptionSuccess - Handles received remote success description */
function setRemoteDescriptionSuccess(peerConnection) {
  timestampSetRemoteDescriptionSuccess = new Date();
  updateAnalytics();
  console.log(`setRemoteDescriptionSuccess() - `, timestampSetRemoteDescriptionSuccess);
  setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

/** setSessionDescriptionError - Handles session description error */
function setSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}.`);
}

/** handleLocalMediaStreamError - Handles media stream error */
function handleLocalMediaStreamError(error) {
  console.log(`navigator.getUserMedia error: ${error.toString()}.`);
}

/** handleReceiveMessage - Handles receiving message */
const handleReceiveMessage = (event) => {
  console.log(`Incoming DataChannel push: ${event.data}`);
};

/** handleConnectionChange - Handles connection change */
function handleConnectionChange(event) {
  console.log('ICE state change event: ', event);
  if (event != null && event.currentTarget != null && event.target.iceConnectionState == "connected") {
    if (timestampConnected == undefined) {
      timestampConnected = new Date();
      console.log(`connected - `, timestampConnected);
      updateAnalytics();
    }
  }
}

/** clearAnalytics - Clear analytics timestamps */
function clearAnalytics(cameraAnalyticsOnly = false) {
  console.log('Clearing analytics');

  if (!cameraAnalyticsOnly) {
    // Page launch
    timestampInitializeWebRTC = undefined;
    timestampStartLocalStream = undefined;
    timestampCreateSdpOffer = undefined;
    timestampCreateSdpOfferSuccess = undefined;
    timestampSetLocalDescription = undefined;
    timestampSetLocalDescriptionSuccess = undefined;
  }

  // Camera Stream button pressed
  timestampGenerateStreamRequest = undefined;
  timestampGenerateWebRtcStreamRequest = undefined;
  timestampGenerateStreamResponse = undefined;
  timestampExtendStreamRequest = undefined;
  timestampExtendWebRtcStreamRequest = undefined;
  timestampExtendStreamResponse = undefined;
  timestampStopStreamRequest = undefined;
  timestampStopWebRtcStreamRequest = undefined;
  timestampStopStreamResponse = undefined;
  timestampSetRemoteDescription = undefined;
  timestampSetRemoteDescriptionSuccess = undefined;
  timestampConnected = undefined;
  timestampPlaybackStarted = undefined;

  updateAnalytics();
}
