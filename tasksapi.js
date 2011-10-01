// Copyright 2011, the Google Tasks Chrome Extension authors.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Modified by Renan Cakirerk <renan@pardus.org.tr>

var NOTIFICATION_TIMEOUT = 3000;

function notify(logo, title, opt_body) {
  var body = opt_body || '';
  var notification = webkitNotifications.createNotification(logo,
      title, body);
  notification.show();
  var clear = function() {
    notification.cancel();
  }
  window.setTimeout(clear, NOTIFICATION_TIMEOUT);
}

function notifySuccess(taskListTitle, body) {
  var logo = 'images/tasks-48x48.png';
  var title = 'Task added successfully to ' + taskListTitle + "!";
  notify(logo, title, body);
}

function notifyFailure(msg, code) {
  // TODO: Redirect to login UI flow and retry, if this is a problem.
  var logo = 'images/tasks-error-48x48.png';
  var title = msg + ' (' + code + ')';
  notify(logo, title);
}

function getTasks(cb) {
  var url = 'https://www.googleapis.com/tasks/v1/lists/@default/tasks';
  var req = {
    'method': 'GET',
    'headers': {
      'Content-type': 'application/json'
    },
  };

  var getDone = function(resp, xhr) {
    if (xhr.status != 200) {
      notifyFailure('Couldn\'t retrieve tasks.', xhr.status);
    }

    cb.call(this, JSON.parse(resp));
  }

  oauth.sendSignedRequest(url, getDone, req);
}


function getTaskLists(resp, xhr) {
    if (xhr.status != 200) {
        notifyFailure('Couldn\'t retrieve lists.', xhr.status);
        return;
    }

    taskListsRaw = JSON.parse(resp);
    taskLists = taskListsRaw.items;

    for (lIndex=0; lIndex<=taskLists.length - 1; lIndex++) {
        chrome.contextMenus.create({
            'title': taskLists[lIndex].title,
            'contexts': ['selection'],
            'onclick': function(info, tab) {
                addTask(taskLists[info.menuItemId - 1].title,
                        taskLists[info.menuItemId - 1].id,
                        info)
            }
        });
    }
}

function createTaskListMenu() {
    var url = 'https://www.googleapis.com/tasks/v1/users/@me/lists';
    var req = {
        'method': 'GET',
        'headers': { 'Content-type': 'application/json'},
    };

    oauth.sendSignedRequest(url, getTaskLists, req);
}

var getKeys = function(obj){
   var keys = [];
   for(var key in obj){
      keys.push(key);
   }
   return keys;
}

function addTask(taskListTitle, taskListId, info) {
    var text = info['selectionText'];
    var notes = info['pageUrl'];

    var task = {
        'title': text,
        'notes': notes
    };

    var url = 'https://www.googleapis.com/tasks/v1/lists/' + taskListId + '/tasks';

    var req = {
        'method': 'POST',
        'headers': {'Content-type': 'application/json'},
        'body': JSON.stringify(task)
    };

    var addDone = function(resp, xhr) {
        if (xhr.status != 200) {
            notifyFailure('Couldn\'t add task.', xhr.status);
            return;
        }
        notifySuccess(taskListTitle, task['title']);
    }

    oauth.sendSignedRequest(url, addDone, req);
}
