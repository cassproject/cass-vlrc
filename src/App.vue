<template>
    <div id="app">
        <!-- would be nice to have the nav, header, footer
            as separate components. Would require their details
            accessible in multiviews, should migrate to vuex
        for local storage before that.-->
        <!-- <div id="nav"></div>-->
        <!-- <artHeaderf/> -->
        <Pages/>
    </div>
</template>
<script>
import {mapState} from 'vuex';
import Pages from "@/pages/Pages.vue";
export default {
    components: {
        Pages
    },
    computed: mapState({
        me: "me",
        contacts: "contacts",
        assertions: "assertions"
    }),
    created: function() {
        var me = this;
        window.app = this;
        var queryParams = function() {
            if (window.document.location.search == null) { return {}; }
            var hashSplit = (window.document.location.search.split("?"));
            if (hashSplit.length > 1) {
                var o = {};
                var paramString = hashSplit[1];
                var parts = (paramString).split("&");
                for (var i = 0; i < parts.length; i++) { o[parts[i].split("=")[0]] = decodeURIComponent(parts[i].replace(parts[i].split("=")[0] + "=", "")); }
                return o;
            }
            return {};
        };
        window.queryParams = queryParams = queryParams();

        var repo = new EcRepository();
        if (queryParams.server != null) {
            repo.selectedServer = queryParams.server;
        } else if (window.location.origin.indexOf("127.0.0.1") !== -1) {
            repo.selectedServer = "https://dev.cassproject.org/api/";
        } else if (window.location.origin.indexOf("localhost:8080") !== -1) {
            repo.autoDetectRepository();
        } else if (window.location.origin.indexOf("localhost:8000") !== -1) {
            repo.selectedServer = "http://localhost/api/";
        } else if (window.location.origin.indexOf("localhost:63342") !== -1) {
            repo.selectedServer = "https://dev.cassproject.org/api/";
        } else if (window.location.origin.indexOf("localhost") !== -1) {
            repo.autoDetectRepository();
        } else if (window.location.origin.indexOf("vlrc.cassproject.org") !== -1) {
            repo.selectedServer = "https://dev.cassproject.org/api/";
        } else if (window.location.origin.indexOf("file://") !== -1) {
            repo.selectedServer = "https://dev.cassproject.org/api/";
        } else {
            repo.autoDetectRepository();
        }
        if (repo.selectedServer == null) { repo.selectedServer = "https://dev.cassproject.org/api/"; }
        window.repo = repo;
        EcRepository.caching = true;
        EcCrypto.caching = true;
        EcRepository.cachingSearch = true;

        EcIdentityManager.readIdentities();
        EcIdentityManager.readContacts();

        function ready2() {
            me.$store.commit("login");
            me.$store.commit("me", EcIdentityManager.ids[0].ppk.toPk().toPem());
            me.$store.commit("subject", EcIdentityManager.ids[0].ppk.toPk().toPem());
            openWebSocket();
            if (queryParams.frameworkId != null) {
                me.$store.commit("selectedFramework", EcFramework.getBlocking(queryParams.frameworkId));
            } else {
                me.$store.commit("selectedFramework",
                    localStorage.selectedFramework == null
                        ? null
                        : EcFramework.getBlocking(localStorage.selectedFramework));
                me.$store.commit("selectedCompetency",
                    localStorage.selectedCompetency == null
                        ? null
                        : EcCompetency.getBlocking(localStorage.selectedCompetency));
            }
            EcRemote.getExpectingString(window.repo.selectedServer, "badge/pk", function(badgePk) {
                me.badgePk = EcPk.fromPem(badgePk);
            }, console.error);
            me.identities = EcIdentityManager.ids;
            var request = indexedDB.open("assertions", 1);
            request.onerror = console.error;
            request.onupgradeneeded = me.indexedDbCreate;
            request.onsuccess = function(event) {
                var db = event.target.result;
                var objectStore = db.transaction("assertions").objectStore("assertions");

                var assertions = [];
                objectStore.openCursor().onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        var a = new EcAssertion();
                        a.copyFrom(cursor.value);
                        assertions.push(a);
                        cursor.continue();
                    } else {
                        var eah = new EcAsyncHelper();
                        eah.each(assertions, function(assertion, callback) {
                            assertion.getAssertionDateAsync(function(date) {
                                assertion.assertionDateDecrypted = date;
                                callback();
                            }, callback);
                        },
                        function(assertions) {
                            assertions = assertions.sort(function(a, b) {
                                return b.assertionDateDecrypted - a.assertionDateDecrypted;
                            });
                            me.$store.commit("setAssertions", assertions);
                            console.log("Finished loading assertions. " + assertions.length + " loaded.");
                            me.searchForAssertions(5000);
                        });
                    }
                };
            };
        }

        /*
         * **************************************************************************************************
         * CASS UI VLRC iFrame Communication Functions
         * **************************************************************************************************
         */

        /*
         * **************************************************************************************************
         * Constants
         */

        const WAITING_MESSAGE = "waiting";
        const CONTACT_UPDATED_MESSAGE = "contactsUpdated";
        const INIT_IDENTITY_ACTION = "initIdentity";

        /*
         * **************************************************************************************************
         * Action Executions
         * **************************************************************************************************
         */

        function performInitIdentityAction(data) {
            repo.selectedServer = data.serverParm;
            var ident = new EcIdentity();
            ident.ppk = EcPpk.fromPem(data.pemParm);
            ident.displayName = data.nameParm;
            EcIdentityManager.addIdentity(ident);

            if (queryParams.frameworkId != null) {
                setTimeout(function() {
                    app.selectedFramework = EcFramework.getBlocking(queryParams.frameworkId);
                    ready2();
                }, 1000);
            } else {
                setTimeout(function() {
                    ready2();
                }, 1000);
            }
        }

        /*
         * **************************************************************************************************
         * Message Sender
         * **************************************************************************************************
         */

        function sendWaitingMessage() {
            var message = {
                message: WAITING_MESSAGE
            };
            parent.postMessage(message, queryParams.origin);
        }

        /*
         * **************************************************************************************************
         * Message Listener
         * **************************************************************************************************
         */

        function performAction(action, data) {
            switch (action) {
            case INIT_IDENTITY_ACTION:
                performInitIdentityAction(data);
                break;
            case CONTACT_UPDATED_MESSAGE:
                if (app == null) {
                    setTimeout(function() {
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

        var messageListener = function(evt) {
            var data = evt.data;
            if (data != null && data !== "") {
                if (EcObject.isObject(data) || data.startsWith("{")) {
                    if (!EcObject.isObject(data)) { data = JSON.parse(data); }
                    if (data != null && data !== "") {
                        if (data.action == null || data.action === "") { // nothing
                        } else performAction(data.action, data);
                    } else {
                        // nothing
                    }
                }
            } else {
                // nothing
            }
        };

        if (window.addEventListener) {
            window.addEventListener("message", messageListener, false);
        } else {
            window.attachEvent("onmessage", messageListener);
        }

        function contactsChanged() {
            var ary = [];
            for (var i = 0; i < EcIdentityManager.contacts.length; i++) {
                ary.push({
                    pk: EcIdentityManager.contacts[i].pk.toPem(),
                    displayName: EcIdentityManager.contacts[i].displayName
                });
            }
            var evt = {
                message: CONTACT_UPDATED_MESSAGE,
                contacts: ary
            };
            console.log(evt);
            if (parent != null) {
                if (queryParams.origin != null && queryParams.origin !== '') { parent.postMessage(evt, queryParams.origin); }
            }
        }

        EcIdentityManager.onContactChanged = contactsChanged;

        /*
         *
         * Websocket
         *
         */


        var webSocketBackoff = 100;

        var openWebSocket = function(r) {
            var connection;
            // Instead of /ws/custom, will be /ws in next release.
            if (queryParams.webSocketOverride == null || queryParams.webSocketOverride === undefined) {
                connection = new WebSocket(repo.selectedServer.replace(/http/, "ws").replace(/api\//, "ws/custom"));
            } else {
                connection = new WebSocket(queryParams.webSocketOverride);
            }

            connection.onopen = function() {
                console.log("WebSocket open.");
                window.webSocketConnection = true;
            };

            connection.onerror = function(error) {
                console.log(error);
            };

            // Re-establish connection on close.
            connection.onclose = function(evt) {
                console.log(evt);
                webSocketBackoff *= 2;
                webSocketConnection = false;
                setTimeout(function() {
                    openWebSocket(r);
                }, webSocketBackoff);
            };

            connection.onmessage = function(e) {
                console.log('Server: ' + e.data);
                for (var key in EcRepository.cache) {
                    if (key.startsWith("{")) { delete EcRepository.cache[key]; }
                }
                delete EcRepository.cache[e.data];
                delete EcRepository.cache[EcRemoteLinkedData.trimVersionFromUrl(e.data)];
                app.$store.commit('removeFromAll', e.data);

                app.removeAssertionFromIndexedDb(EcRemoteLinkedData.trimVersionFromUrl(e.data), function() {
                    app.assertionsChanges++;
                });
                EcRepository.get(EcRemoteLinkedData.trimVersionFromUrl(e.data), function(wut) {
                    delete EcRepository.cache[wut.id];
                    delete EcRepository.cache[wut.shortId()];

                    if (new Assertion().isA(wut.getFullType())) {
                        var a = new EcAssertion();
                        a.copyFrom(wut);
                        app.$store.commit('addAssertion', a);
                    }

                    if (new CreativeWork().isA(wut.getFullType())) {
                        var a = new CreativeWork();
                        a.copyFrom(wut);
                        app.$store.commit('addCreativeWork', a);
                    }
                }, console.error);
            };
        };

        if (queryParams.css != null) {
            var ss = document.createElement("link");
            ss.type = "text/css";
            ss.rel = "stylesheet";
            ss.href = queryParams.css;
            document.getElementsByTagName("head")[0].appendChild(ss);
        }

        if (queryParams.user === "wait") {
            console.log("Sending waiting message");
            sendWaitingMessage();
        } else {
            if (EcIdentityManager.ids.length === 0) {
                var i = new EcIdentity();
                i.displayName = "You";
                EcPpk.generateKeyAsync(function(ppk) {
                    i.ppk = ppk;
                    EcIdentityManager.addIdentity(i);
                    ready2();
                    EcIdentityManager.saveIdentities();
                });
            } else {
                ready2();
            }
        }
    },
    methods: {
        searchForAssertions: function(count) {
            var me = this;
            EcAssertion.search(window.repo, "\"" + this.$store.state.me + "\"",
                function(assertions) {
                    var eah = new EcAsyncHelper();
                    eah.each(assertions, function(assertion, callback) {
                        if (assertion.assertionDateDecrypted != null) {
                            callback();
                        } else {
                            assertion.getAssertionDateAsync(
                                function(date) {
                                    assertion.assertionDateDecrypted = date;
                                    callback();
                                }, callback
                            );
                        }
                    },
                    function(assertions) {
                        assertions = assertions.sort(function(a, b) {
                            return b.assertionDateDecrypted - a.assertionDateDecrypted;
                        });
                        me.$store.commit("setAssertions", assertions);
                        me.saveAssertionsToIndexedDb();
                    });
                }, console.error, {
                    sort: '[ { "@version": {"order" : "desc" , "missing" : "_last"}} ]',
                    size: count
                });
        },
        removeAssertionFromIndexedDb: function(a, success) {
            var request = indexedDB.open("assertions", 1);

            request.onerror = console.error;
            request.onupgradeneeded = this.indexedDbCreate;
            request.onsuccess = function(event) {
                var db = event.target.result;
                var assertionStore = db.transaction("assertions", "readwrite").objectStore("assertions");
                var del = assertionStore.delete(a);
                del.onsuccess = function(event) {
                    console.log("Removed assertion from indexedDB: " + a);
                    if (event.returnValue && success != null) { success(); }
                };
                del.onerror = function(event) {
                    console.log("Failed to remove assertion from indexedDB: " + a);
                };
            };
        },
        saveAssertionToIndexedDb: function(a) {
            console.log("Saving assertion to indexedDB.");
            var request = indexedDB.open("assertions", 1);

            request.onerror = console.error;
            request.onupgradeneeded = this.indexedDbCreate;
            request.onsuccess = function(event) {
                var db = event.target.result;
                var assertionStore = db.transaction("assertions", "readwrite").objectStore("assertions");
                var add = assertionStore.put(a);
                add.onsuccess = function(event) {
                    console.log("Added assertion to indexedDB: " + a);
                };
                add.onerror = function(event) {
                    console.log("Failed to add assertion to indexedDB: " + a);
                };
            };
        },
        saveAssertionsToIndexedDb: function() {
            var me = this;
            console.log("Saving assertions to indexedDB.");
            var request = indexedDB.open("assertions", 1);

            request.onerror = console.error;
            request.onupgradeneeded = this.indexedDbCreate;
            request.onsuccess = function(event) {
                var db = event.target.result;

                var assertionStore = db.transaction("assertions", "readwrite").objectStore("assertions");
                assertionStore.clear().onsuccess = function(event) {
                    me.assertions.forEach(function(assertion) {
                        assertionStore.put(assertion);
                    });
                };
            };
            localStorage.removeItem("assertions");
        },
        switchPage: function(goTo) {
            if (goTo !== "") {
                this.page = goTo;
            }
        },
        checkIsActivePage: function(action) {
            if (action !== "" && action === this.page) {
                return true;
            } else {
                return false;
            }
        },
        indexedDbCreate: function(event) {
            var db = event.target.result;
            db.createObjectStore("assertions", {keyPath: "id"});
        },
        computeBecause: function(evidences, success) {
            var explanations = [];
            new EcAsyncHelper().each(evidences, function(e, callback) {
                var evidenceString = "";
                var eoriginal = e;
                if (e.startsWith != null && e.startsWith("{")) { e = JSON.parse(e); }
                if (EcObject.isObject(e)) {
                    if (e.verb != null) {
                        if (e.verb.display != null) {
                            if (e.verb.display.en != null) { evidenceString += e.verb.display.en + " "; }
                        }
                    }
                    if (e.object != null) {
                        if (e.object.definition != null) {
                            if (e.object.definition.type === "http://adlnet.gov/expapi/activities/assessment") {
                                evidenceString += "\"" + e.object.definition.name.en + "\" quiz with a ";
                                if (e.result != null) {
                                    if (e.result.success != null) {
                                        evidenceString += e.result.success ? " passing " : " not passing ";
                                        evidenceString += Math.round(e.result.score.scaled * 100.0) + "%";
                                    }
                                }
                            }
                        }
                    }
                    if (e.object != null) {
                        if (e.object.definition != null) {
                            if (e.object.definition.interactionType != null) {
                                evidenceString += "\"" + e.object.definition.name.en + "\" ";
                                if (e.result != null) {
                                    if (e.result.success != null) { evidenceString += e.result.success ? " correctly" : " incorrectly"; }
                                }
                            }
                        }
                    }
                    if (evidenceString !== "") { explanations.push({text: evidenceString, original: eoriginal}); }
                    callback();
                } else if (e.startsWith != null && e.startsWith("http")) {
                    EcRepository.get(e, function(success) {
                        if (success.isAny(new ChooseAction().getTypes())) {
                            EcRepository.get(success.object, function(creativeWork) {
                                explanations.push({
                                    text: "viewed " + creativeWork.name,
                                    url: creativeWork.url,
                                    original: eoriginal
                                });
                                callback();
                            }, callback);
                        } else { callback(); }
                    }, function(failure) {
                        explanations.push({
                            text: "did this",
                            url: e,
                            original: eoriginal
                        });
                        callback();
                    });
                } else {
                    explanations.push({text: "\"" + e + "\"", original: eoriginal});
                    callback();
                }
            }, function(evidences) {
                success(explanations);
            });
        },
        explain: function(packet, tab, prev, prev2) {
            var because = "";
            if (tab == null) {
                tab = 0;
                if (packet.positive.length > 0) {
                    because += "\n" + packet.positive.length + " direct positive assertion.";
                }
                if (packet.negative.length > 0) {
                    because += "\n" + packet.negative.length + " direct negative assertion.";
                }
            }
            for (var i = 0; i < packet.equivalentPackets.length; i++) {
                var eqp = packet.equivalentPackets[i];
                because += "\n";
                for (var j = 0; j < tab; j++) {
                    if (j === tab - 1) {
                        because += " - ";
                    } else {
                        because += "   ";
                    }
                }
                for (var j = 0; j < eqp.competency.length; j++) {
                    because += "\"" + packet.competency[0].getName() + "\" is equal to \"" + eqp.competency[j].getName() + "\" which is " + eqp.result._name;
                }
                if (eqp.positive.length > 0) {
                    because += " with " + eqp.positive.length + " positive assertion.";
                }
                if (eqp.negative.length > 0) {
                    because += " with " + eqp.negative.length + " negative assertion.";
                }
                because += this.explain(eqp, tab, null, packet);
            }
            for (var i = 0; i < packet.subPackets.length; i++) {
                var eqp = packet.subPackets[i];
                because += "\n";
                for (var j = 0; j < tab; j++) {
                    if (j === tab - 1) {
                        because += " - ";
                    } else {
                        because += "   ";
                    }
                }
                if (eqp.type._name === "COMPETENCY") {
                    for (var j = 0; j < eqp.competency.length; j++) {
                        because += "\"" + eqp.competency[j].getName() + "\" which is " + eqp.result._name;
                        if (eqp.positive.length > 0) {
                            because += " with " + eqp.positive.length + " positive assertion.";
                        }
                        if (eqp.negative.length > 0) {
                            because += " with " + eqp.negative.length + " negative assertion.";
                        }
                    }
                } else {
                    because += (prev2 !== undefined
                        ? ("\"" + prev2.competency[0].getName() + "\" ")
                        : "\"" + packet.competency[0].getName() + "\" ") + eqp.type._name.replace("RELATION_", "").toLowerCase();
                }
                because += this.explain(eqp, tab + 1, packet, prev);
            }
            return because;
        }
    },
    data: () => ({
        foo: "bar"
    })
};
</script>
<style lang="scss">
    @import './styles.scss';
    @import './assets/fonts/webfonts/all.css';
</style>
