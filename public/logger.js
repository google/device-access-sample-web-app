
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


// Log Types:
const LogType = {
  ACTION  : "ACTION",
  HTTP    : "HTTP",
  EVENT   : "EVENT",
};

// Status Status:
const LogStatus = {
  INFO     : "INFO",
  ERROR    : "ERROR",
};

// Log types that enabled by at app start:
let logFilter = ["BASE", LogType.ACTION, LogType.HTTP];

// Application logs:
let logs = [];
let filteredLogs = [];

// Log Template:
class Log {
  constructor(type, title, text, status) {
    this.type = type;
    this.title = title;
    this.text = text;
    this.status = status;

    // Calculate and format the time:
    const currentTime = new Date();
    let hours = currentTime.getHours();
    let minutes = currentTime.getMinutes();
    let seconds = currentTime.getSeconds();
    if (hours   < 10) { hours   = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }

    this.time = hours + ":" + minutes + ":" + seconds;
  }
}

/** pushLog - Pushes a new log to the list */
function pushLog(type, title, text, status = LogStatus.INFO) {
  const newLog = new Log(type, title, text, status);
  logs.push(newLog);
  localStorage["logs"] = JSON.stringify(logs);
  addLogEntry(newLog);
}

/** pushError - Pushes a new error to the list */
function pushError(type, title, text) {
  pushLog(type, title, text, LogStatus.ERROR);
}

/** addLogEntry - Adds a new log entry to log container */
function addLogEntry(newLog) {

  // If there are no active filters, skip.
  if(!logFilter.includes(newLog.type)) {
    return;
  }

  // Add the log to the list of logs to display:
  filteredLogs.push(newLog);

  // Get source elements from the page and create a new log entry:
  let logContainer = document.getElementById("log-container");
  let logTemplate = document.getElementsByTagName("template")[0];
  let logEntry = logTemplate.content.cloneNode(true);

  // Add log entry into log display container:
  if (logContainer.children.length > 0) {
    logContainer.insertBefore(logEntry, logContainer.children[0]);
  } else {
    logContainer.appendChild(logEntry);
  }

  // Add mouse click callback to log entry:
  let targetIndex = logContainer.children.length - 1;
  logContainer.children[0].onclick =
      function(){showLogEntry(targetIndex)};

  // Display log title on the log entry:
  logContainer.children[0].textContent = newLog.title;

  // If error, color log entry to Red:
  if(newLog.status === LogStatus.ERROR)
    logContainer.children[0].setAttribute("style", "color: #AA0000;");

  // Show log entry:
  showLogEntry(logContainer.children.length - 1);
}

/** addLogEntries - Adds multiple log entries to log container */
function addLogEntries(newLogs) {
  filteredLogs = [];
  for (let i = 0; i < newLogs.length; i++) {
    addLogEntry(newLogs[i]);
  }
}

/** onFilterAction - Toggles ACTION Filter */
function onFilterAction() {
  if(logFilter.includes(LogType.ACTION)) {
    const index = logFilter.indexOf(LogType.ACTION);
    logFilter.splice(index, 1);
  } else {
    logFilter.push(LogType.ACTION);
  }
  updateLogFilter(logFilter);
}

/** onFilterHTTP - Toggles HTTP Filter */
function onFilterHTTP() {
  if(logFilter.includes(LogType.HTTP)) {
    const index = logFilter.indexOf(LogType.HTTP);
    logFilter.splice(index, 1);
  } else {
    logFilter.push(LogType.HTTP);
  }
  updateLogFilter(logFilter);
}

/** onFilterEvent - Toggles Event Filter */
function onFilterEvent() {
  if(logFilter.includes(LogType.EVENT)) {
    const index = logFilter.indexOf(LogType.EVENT);
    logFilter.splice(index, 1);
  } else {
    logFilter.push(LogType.EVENT);
  }
  updateLogFilter(logFilter);
}
