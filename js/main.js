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
    $("#rad4").change(function (evt) {
        if ($("#rad4:checked").length > 0)
            $("#viewOutputFramework").attr("src", "cass-editor/index.html?server=" + repo.selectedServer + "&user=wait&origin=" + window.location.origin);
        else
            $("#viewOutputFramework").attr("src", "");
    });

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
                $("#rad1").click();
            }, 100);
        }
    }
});

function ready2() {
    $("iframe").ready(function () {
        $(window).on("message", function (event) {
            if (event.originalEvent.data.message == "waiting") {
                //Identity
                $("iframe")[0].contentWindow.postMessage(JSON.stringify({
                    action: "identity",
                    identity: EcIdentityManager.ids[0].ppk.toPem()
                }), window.location.origin);
            };
        });
    });

    app.login = true;
    app.me = app.subject = EcIdentityManager.ids[0].ppk.toPk().toPem();
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
    app.me = app.subject = EcIdentityManager.ids[0].ppk.toPk().toPem();

    if (queryParams.frameworkId != null) {
        setTimeout(function () {
            app.selectedFramework = EcFramework.getBlocking(queryParams.frameworkId);
            ready2();
            $("#rad2").click();
        }, 100);
    } else {
        setTimeout(function () {
            ready2();
            $("#rad1").click();
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
