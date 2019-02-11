queryParams = function () {
    if (window.document.location.search == null)
        return {};
    var hashSplit = (window.document.location.search.split("?"));
    if (hashSplit.length > 1) {
        var o = {};
        var paramString = hashSplit[1];
        var parts = (paramString).split("&");
        for (var i = 0; i < parts.length; i++)
            o[parts[i].split("=")[0]] = decodeURIComponent(parts[i].replace(parts[i].split("=")[0] + "=", ""));
        return o;
    }
    return {};
};
queryParams = queryParams();

var repo = new EcRepository();
if (queryParams.server != null)
    repo.selectedServer = queryParams.server;
else if (window.location.origin.indexOf("127.0.0.1") != -1)
    repo.selectedServer = "https://dev.cassproject.org/api/";
else if (window.location.origin.indexOf("localhost:8080") != -1)
    repo.autoDetectRepository();
else if (window.location.origin.indexOf("localhost/") != -1)
    repo.autoDetectRepository();
else if (window.location.origin.indexOf("vlrc.cassproject.org") != -1)
    repo.selectedServer = "https://dev.cassproject.org/api/";
else if (window.location.origin.indexOf("file://") != -1)
    repo.selectedServer = "https://dev.cassproject.org/api/";
else
    repo.autoDetectRepository();
if (repo.selectedServer == null)
    repo.selectedServer = "https://dev.cassproject.org/api/";

EcRepository.caching = true;
EcCrypto.caching = true;

EcIdentityManager.readIdentities();
EcIdentityManager.readContacts();

$(document).ready(function () {
    if (queryParams.user == "wait") {
        console.log("Sending waiting message");
        sendWaitingMessage();
    } else {
        if (EcIdentityManager.ids.length == 0) {
            var i = new EcIdentity();
            i.displayName = "You";
            EcPpk.generateKeyAsync(function (ppk) {
                i.ppk = ppk;
                EcIdentityManager.addIdentity(i);
                ready2();
                EcIdentityManager.saveIdentities();
            });
        } else {
            ready2();
        }
        if (queryParams.frameworkId != null) {
            setTimeout(function () {
                app.selectedFramework = EcFramework.getBlocking(queryParams.frameworkId);
                $("#rad2").click();
            }, 100);
        } else {
            setTimeout(function () {
                $("#rad0").click();
            }, 100);
        }
    }
});

function ready2() {
    startVlrc();
    app.login = true;
    app.me = app.subject = EcIdentityManager.ids[0].ppk.toPk().toPem();
    openWebSocket();
}

function showPage(pageNumber) {
    $('.page').hide();
    $('#div' + pageNumber).show();
    $(".rad").removeClass("selected");
    $('#rad' + pageNumber).addClass("selected");
}

//**************************************************************************************************
// CASS UI VLRC iFrame Communication Functions
//**************************************************************************************************

//**************************************************************************************************
// Constants

const WAITING_MESSAGE = "waiting";
const CONTACT_UPDATED_MESSAGE = "contactsUpdated";

const FWK_TO_FWK_ALIGN_TYPE = "fwkToFwk";

const INIT_IDENTITY_ACTION = "initIdentity";

//**************************************************************************************************
// Action Executions
//**************************************************************************************************

function performInitIdentityAction(data) {
    repo.selectedServer = data.serverParm;
    var ident = new EcIdentity();
    ident.ppk = EcPpk.fromPem(data.pemParm);
    ident.displayName = data.nameParm;
    EcIdentityManager.addIdentity(ident);

    if (queryParams.frameworkId != null) {
        setTimeout(function () {
            app.selectedFramework = EcFramework.getBlocking(queryParams.frameworkId);
            ready2();
            $("#rad2").click();
        }, 100);
    } else {
        setTimeout(function () {
            ready2();
            $("#rad0").click();
        }, 100);
    }
}

//**************************************************************************************************
// Message Sender
//**************************************************************************************************

function sendWaitingMessage() {
    var message = {
        message: WAITING_MESSAGE
    };
    parent.postMessage(message, queryParams.origin);
}

//**************************************************************************************************
// Message Listener
//**************************************************************************************************

function performAction(action, data) {
    switch (action) {
        case INIT_IDENTITY_ACTION:
            performInitIdentityAction(data);
            break;
        case CONTACT_UPDATED_MESSAGE:
            if (app == null) {
                setTimeout(function () {
                    performAction(action, data);
                }, 1000);
                return;
            }
            app.profiles.splice(0, app.profiles.length);
            for (var i = 0; i < data.contacts.length; i++) {
                var c = new EcContact();
                c.pk = EcPk.fromPem(data.contacts[i].pk);
                c.displayName = data.contacts[i].displayName;
                app.profiles.push(c);
            }
            break;
        default:
            break;
    }
}

var messageListener = function (evt) {
    var data = evt.data;
    if (data != null && data != "") {
        if (EcObject.isObject(data) || data.startsWith("{")) {
            if (!EcObject.isObject(data))
                data = JSON.parse(data);
            if (data != null && data != "") {
                if (data.action == null || data.action == "") {} else performAction(data.action, data);
            } else {}
        }
    } else {}
}

if (window.addEventListener) {
    window.addEventListener("message", messageListener, false);
} else {
    window.attachEvent("onmessage", messageListener);
}

function contactsChanged() {
    var ary = [];
    for (var i = 0; i < EcIdentityManager.contacts.length; i++)
        ary.push({
            pk: EcIdentityManager.contacts[i].pk.toPem(),
            displayName: EcIdentityManager.contacts[i].displayName
        });
    var evt = {
        message: CONTACT_UPDATED_MESSAGE,
        contacts: ary
    };
    console.log(evt);
    if (parent != null)
        if (queryParams.origin != null && queryParams.origin != '')
            parent.postMessage(evt, queryParams.origin);
}
EcIdentityManager.onContactChanged = contactsChanged;

//
// Websocket
//


var webSocketBackoff = 100;
var webSocketConnection = false;

openWebSocket = function (r) {
    var connection;
    // Instead of /ws/custom, will be /ws in next release.
    if (queryParams.webSocketOverride == null || queryParams.webSocketOverride === undefined)
        connection = new WebSocket(repo.selectedServer.replace(/http/, "ws").replace(/api\//, "ws/custom"));
    else
        connection = new WebSocket(queryParams.webSocketOverride);

    connection.onopen = function () {
        console.log("WebSocket open.");
        webSocketConnection = true;
    };

    connection.onerror = function (error) {
        console.log(error);
    };

    //Re-establish connection on close.
    connection.onclose = function (evt) {
        console.log(evt);
        webSocketBackoff *= 2;
        webSocketConnection = false;
        setTimeout(function () {
            openWebSocket(r);
        }, webSocketBackoff);
    };

    connection.onmessage = function (e) {
        console.log('Server: ' + e.data);
        delete EcRepository.cache[e.data];
        if (app.assertions != null)
            for (var i = 0; i < app.assertions.length; i++)
                if (app.assertions[i].isId(e.data))
                    app.assertions.splice(i, 1);
        EcRepository.get(e.data, function (wut) {
            delete EcRepository.cache[wut.id];
            delete EcRepository.cache[wut.shortId()];

            if (new Assertion().isA(wut.getFullType())) {
                if (app.assertions != null) {
                    var a = new EcAssertion();
                    a.copyFrom(wut);
                    app.assertions.unshift(a);
                }
            }

        }, console.error);
    };

}
