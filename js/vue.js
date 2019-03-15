var app;

function startVlrc() {
    app = new Vue({
        el: '#app',
        computed: {
            uri: {
                get: function () {
                    return $("iframe").attr("src");
                },
                set: function (v) {
                    return $("iframe").attr("src", v);
                }
            }
        },
        created: function () {
            $("#app").show();
            this.identities = EcIdentityManager.ids;
            var assertions = localStorage.getItem("assertions");
            if (assertions != null) {
                assertions = JSON.parse(LZString.decompress(assertions));
                if (assertions == null)
                    assertions = [];
                for (var i = 0; i < assertions.length; i++) {
                    var a = new EcAssertion();
                    a.copyFrom(assertions[i]);
                    assertions[i] = a;
                }
                this.assertions = assertions;
            }
            EcAssertion.search(repo, "*", function (assertions) {
                var eah = new EcAsyncHelper();
                eah.each(assertions, function (assertion, callback) {
                        assertion.getAssertionDateAsync(function (date) {
                            assertion.assertionDateDecrypted = date;
                            callback();
                        }, callback)
                    },
                    function (assertions) {
                        assertions = assertions.sort(function (a, b) {
                            return b.assertionDateDecrypted - a.assertionDateDecrypted;
                        });
                        app.assertions = assertions;
                    });
            }, console.error, {
                size: 5000
            });
        },
        methods: {
            searchGoogle: function () {
                window.open("https://google.com/search?q=" + app.selectedCompetency.getName(), "lernnit");
            },
            addResource: function () {
                var c = new CreativeWork();
                c.assignId(repo.selectedServer, EcCrypto.md5(app.inputUrl + app.selectedCompetency.shortId()));
                c.name = app.inputName;
                c.description = app.inputDescription;
                c.url = app.inputUrl;
                c.educationalAlignment = new AlignmentObject();
                c.educationalAlignment.targetUrl = app.selectedCompetency.shortId();
                c.educationalAlignment.alignmentType = "teaches";
                c.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                EcRepository.save(c, console.log, console.error);
                var c = this.selectedCompetency;
                this.selectedCompetency = null;
                this.$nextTick(function () {
                    app.selectedCompetency = c;
                    if (topicCompetencies[app.selectedCompetency.shortId()] != null)
                        for (var i = 0; i < topicCompetencies[app.selectedCompetency.shortId()].length; i++)
                            topicCompetencies[app.selectedCompetency.shortId()][i].getResourceCount();
                });
            },
            computeBecause: function (evidences) {
                var evidenceString = " because they ";
                for (var i = 0; i < evidences.length; i++) {
                    if (i > 0)
                        evidenceString += " and they ";
                    var e = JSON.parse(evidences[i]);
                    if (EcObject.isObject(e)) {
                        if (e.verb != null)
                            if (e.verb.display != null)
                                if (e.verb.display.en != null)
                                    evidenceString += e.verb.display.en + " ";
                        if (e.object != null)
                            if (e.object.definition != null)
                                if (e.object.definition.type == "http://adlnet.gov/expapi/activities/assessment") {
                                    evidenceString += "\"" + e.object.definition.name.en + "\" quiz with a ";
                                    if (e.result != null)
                                        if (e.result.success != null) {
                                            evidenceString += e.result.success ? " passing " : " not passing ";
                                            evidenceString += Math.round(e.result.score.scaled * 100.0) + "%";
                                        }
                                }
                        if (e.object != null)
                            if (e.object.definition != null)
                                if (e.object.definition.interactionType != null) {
                                    evidenceString += "\"" + e.object.definition.name.en + "\" ";
                                    if (e.result != null)
                                        if (e.result.success != null)
                                            evidenceString += e.result.success ? " correctly" : " incorrectly";
                                }
                    }
                }
                return evidenceString;
            },
            explain: function (packet, tab, prev, prev2) {
                var because = "";
                if (tab == null) {
                    tab = 0;
                    if (packet.positive.length > 0)
                        because += "\n" + packet.positive.length + " direct positive assertion.";
                    if (packet.negative.length > 0)
                        because += "\n" + packet.negative.length + " direct negative assertion.";
                }
                for (var i = 0; i < packet.equivalentPackets.length; i++) {
                    var eqp = packet.equivalentPackets[i];
                    because += "\n";
                    for (var j = 0; j < tab; j++)
                        if (j == tab - 1)
                            because += " - ";
                        else
                            because += "   ";
                    for (var j = 0; j < eqp.competency.length; j++)
                        because += "\"" + packet.competency[0].getName() + "\" is equal to \"" + eqp.competency[j].getName() + "\" which is " + eqp.result._name;
                    if (eqp.positive.length > 0)
                        because += " with " + eqp.positive.length + " positive assertion.";
                    if (eqp.negative.length > 0)
                        because += " with " + eqp.negative.length + " negative assertion.";
                    because += this.explain(eqp, tab, null, packet);
                }
                for (var i = 0; i < packet.subPackets.length; i++) {
                    var eqp = packet.subPackets[i];
                    because += "\n";
                    for (var j = 0; j < tab; j++)
                        if (j == tab - 1)
                            because += " - ";
                        else
                            because += "   ";
                    if (eqp.type._name == "COMPETENCY")
                        for (var j = 0; j < eqp.competency.length; j++) {
                            because += "\"" + eqp.competency[j].getName() + "\" which is " + eqp.result._name;
                            if (eqp.positive.length > 0)
                                because += " with " + eqp.positive.length + " positive assertion.";
                            if (eqp.negative.length > 0)
                                because += " with " + eqp.negative.length + " negative assertion.";
                        }
                    else
                        because += (prev2 !== undefined ? ("\"" + prev2.competency[0].getName() + "\" ") : "\"" + packet.competency[0].getName() + "\" ") + eqp.type._name.replace("RELATION_", "").toLowerCase();
                    because += this.explain(eqp, tab + 1, packet, prev);
                }
                return because;
            }
        },
        watch: {
            assertions: function (newAssertions, oldAssertions) {
            },
            inputUrl: function (newUrl) {
                var me = this;
                EcRemote.getExpectingObject("https://api.urlmeta.org/", "?url=" + newUrl, function (success) {
                    app.inputName = success.meta.title;
                    app.inputDescription = success.meta.description;
                }, console.error);
            },
            subject: function (newSubject) {
                var pk = EcPk.fromPem(newSubject);
                var me = this;
                EcRepository.get(repo.selectedServer + "data/" + pk.fingerprint(), function (person) {
                    var e = new EcEncryptedValue();
                    if (person.isAny(e.getTypes())) {
                        e.copyFrom(person);
                        e.decryptIntoObjectAsync(function (person) {
                            var p = new Person();
                            p.copyFrom(person);
                            if (p.name != null)
                                me.subjectName = p.name;
                            else if (p.givenName != null && p.familyName != null)
                                me.subjectName = p.givenName + " " + p.familyName;
                            else if (p.givenName != null)
                                me.subjectName = p.givenName;
                            else
                                me.subjectName = "Unknown Subject.";
                        }, console.error);
                    } else {
                        var p = new Person();
                        p.copyFrom(person);
                        if (p.name != null)
                            me.subjectName = p.name;
                        else if (p.givenName != null && p.familyName != null)
                            me.subjectName = p.givenName + " " + p.familyName;
                        else if (p.givenName != null)
                            me.subjectName = p.givenName;
                        else
                            me.subjectName = "Unknown Subject.";
                    }
                }, function (failure) {
                    me.subjectName = "Unknown Subject.";
                });
            }
        },
        data: {
            message: 'Hello Vue!',
            login: false,
            subject: null,
            subjectName: "Not loaded yet...",
            subjectPerson: null,
            me: null,
            mePerson: null,
            status: 'loading...',
            selectedFramework: null,
            selectedCompetency: null,
            selectedResource: null,
            selectedJobPosting: null,
            profiles: EcIdentityManager.contacts,
            inputUrl: "",
            inputName: "",
            inputDescription: "",
            processing: false,
            processingMessage: "",
            assertions: null,
            jobPostings: null,
            people: null,
        }
    });
}

window.addEventListener("beforeunload", function (e) {
    console.log("Saving assertions to localstorage.");
    localStorage.setItem("assertions", LZString.compress(JSON.stringify(app.assertions)));
}, false);
