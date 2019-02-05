var topicCompetencies = {};
Vue.component('competency', {
    props: ['uri', 'hasChild', 'parentCompetent', 'dontRegister', 'subject'],
    data: function () {
        return {
            counter: 0,
            competent: false,
            incompetent: false,
            assertionsByOthers: []
        };
    },
    computed: {
        count: {
            get: function () {
                var me = this;
                if (this.uri == null) return 0;
                return this.counter;
            }
        },
        name: {
            get: function () {
                if (this.uri == null) return "Invalid Competency";
                return EcCompetency.getBlocking(this.uri).getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                var descriptionArray = EcCompetency.getBlocking(this.uri).getDescription();
                if (descriptionArray == null) return null;
                if (EcArray.isArray(descriptionArray))
                    return descriptionArray[0];
                return descriptionArray;
            }
        },
        isCompetent: {
            get: function () {
                return this.competent || this.parentCompetent;
            }
        },
        countPhrase: {
            get: function () {
                if (this.count == 0) return null;
                return "(" + this.count + " resource" + (this.count == 1 ? "" : "s") + " available)";
            }
        },
        claimCompetencePhrase: {
            get: function () {
                return "By clicking this, I think " + (app.subject == app.me ? "I" : app.subjectName) + " can demonstrate this.";
            }
        },
        unclaimCompetencePhrase: {
            get: function () {
                return "By clicking this, I no longer think " + (app.subject == app.me ? "I" : app.subjectName) + " can demonstrate this.";
            }
        },
        claimIncompetencePhrase: {
            get: function () {
                return "By clicking this, I think " + (app.subject == app.me ? "I" : app.subjectName) + " could not demonstrate this.";
            }
        },
        unclaimIncompetencePhrase: {
            get: function () {
                return "By clicking this, I no longer think " + (app.subject == app.me ? "I" : app.subjectName) + " cannot demonstrate this.";
            }
        }
    },
    created: function () {
        if (topicCompetencies[this.uri] == null)
            topicCompetencies[this.uri] = [this];
        else
            topicCompetencies[this.uri].push(this);
    },
    watch: {
        uri: function (newUri, oldUri) {
            this.getCompetence(null, true);
        },
        subject: function (newSubject, oldSubject) {
            this.assertionsByOthers = [];
            this.competent = false;
            this.incompetent = false;
            this.getCompetence(null, true);
        }
    },
    methods: {
        initialize: function (isVisible, entry) {
            if (isVisible) {
                this.getCompetence();
                this.getResourceCount();
            }
        },
        getResourceCount: function () {
            var me = this;
            var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\"";
            repo.searchWithParams(search, {
                    size: 50
                },
                null,
                function (resources) {
                    me.counter = resources.length;
                }, console.error);
        },
        setCompetency: function () {
            app.selectedCompetency = EcCompetency.getBlocking(this.uri);
            app.availableResources = null;
            $("#rad3").click();
        },
        getCompetence: function (evt, dontPropegate) {
            if (this.parentCompetent) return;
            var me = this;
            if (dontPropegate != true && topicCompetencies[this.uri] != null)
                for (var i = 0; i < topicCompetencies[this.uri].length; i++)
                    if (this != topicCompetencies[this.uri][i])
                        topicCompetencies[this.uri][i].getCompetence(evt, true);
            repo.search(
                "@type:Assertion AND competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND (\\*@owner:\"" + app.subject + "\" OR \\*@reader:\"" + app.subject + "\")",
                function (assertion) {},
                function (assertions) {
                    me.competent = false;
                    me.incompetent = false;
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (app.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative != null)
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (negative)
                                                        me.incompetent = true;
                                                    else
                                                        me.competent = true;
                                                });
                                            else
                                                me.competent = true;
                                        } else {
                                            me.assertionsByOthers.push(assertion);
                                        }
                                    }, console.error);
                                }
                            }, console.error);
                        })(obj);
                    }
                }, console.error);
        },
        claimCompetence: function (evt, after) {
            var me = this;
            this.unclaimIncompetence(evt, function () {
                var a = new EcAssertion();
                a.generateId(repo.selectedServer);
                a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                //a.addReader(EcPk.fromPem("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAixq5WEp+F5HEJZj12N791JATM+vkVJuolfOq0KbqtZwiygPao12fnpTwZdRCmb/4O1n6PXkJJ1XbufAx6k7hGNyM1kTngbs743QuyzP15SmYcP9l9FluL9ISvIECt1eHo4sSKdaKxLRguOj79HjZXtFg3UDIhvvLBVqPQm5d5OQ1OPgu4WzL4GN7hYwK6PYJf2zJjxs9vEQ6agrvpAZI+Rm1DT5x3i4xtcB+Mip473Xe+6IPoRmJ/NqzcP3c0xBf6xV1GDBBIQIaRRkIJgoAb/k0fb+Hl0uXnKxcSm86nYk4Kq5GSbeZ+G+B3rrnQfXbLZnle6nTj1YdAOErOKKi2wIDAQAB-----END PUBLIC KEY-----")); //Eduworks Researcher
                a.setSubject(EcPk.fromPem(app.subject));
                a.setAgent(EcPk.fromPem(app.me));
                a.setCompetency(EcRemoteLinkedData.trimVersionFromUrl(me.uri));
                a.setAssertionDate(Date.now()); //UTC Milliseconds
                a.setExpirationDate(Date.now() + 1000 * 60 * 60 * 24 * 365); //UTC Milliseconds, 365 days in the future.
                a.setNegative(false); //This is an assertion that an individual *can* do something, not that they *cannot*.
                a.setConfidence(1.0);
                EcRepository.save(a, me.getCompetence, console.error);
                if (assertionHistory[app.subject] != null)
                    assertionHistory[app.subject].addAssertion(a);
            });
        },
        unclaimCompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcAssertion.search(repo,
                "competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + app.me + "\"",
                function (assertions) {
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (app.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative == null) {
                                                EcRepository._delete(assertion, me.getCompetence, console.error);
                                                if (assertionHistory[app.subject] != null)
                                                    assertionHistory[app.subject].removeAssertion(assertion);
                                            } else
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (!negative) {
                                                        EcRepository._delete(assertion, me.getCompetence, console.error);
                                                        if (assertionHistory[app.subject] != null)
                                                            assertionHistory[app.subject].removeAssertion(assertion);
                                                    }
                                                }, console.error);
                                        }
                                    }, console.error);
                                }
                            }, console.error);
                        })(obj);
                    }
                    if (a != null) a();
                }, console.error);
        },
        claimIncompetence: function (evt, after) {
            var me = this;
            this.unclaimCompetence(evt, function () {
                var a = new EcAssertion();
                a.generateId(repo.selectedServer);
                a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                //a.addReader(EcPk.fromPem("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAixq5WEp+F5HEJZj12N791JATM+vkVJuolfOq0KbqtZwiygPao12fnpTwZdRCmb/4O1n6PXkJJ1XbufAx6k7hGNyM1kTngbs743QuyzP15SmYcP9l9FluL9ISvIECt1eHo4sSKdaKxLRguOj79HjZXtFg3UDIhvvLBVqPQm5d5OQ1OPgu4WzL4GN7hYwK6PYJf2zJjxs9vEQ6agrvpAZI+Rm1DT5x3i4xtcB+Mip473Xe+6IPoRmJ/NqzcP3c0xBf6xV1GDBBIQIaRRkIJgoAb/k0fb+Hl0uXnKxcSm86nYk4Kq5GSbeZ+G+B3rrnQfXbLZnle6nTj1YdAOErOKKi2wIDAQAB-----END PUBLIC KEY-----")); //Eduworks Researcher
                a.setSubject(EcPk.fromPem(app.subject));
                a.setAgent(EcPk.fromPem(app.me));
                a.setCompetency(EcRemoteLinkedData.trimVersionFromUrl(me.uri));
                a.setAssertionDate(Date.now()); //UTC Milliseconds
                a.setExpirationDate(Date.now() + 1000 * 60 * 60 * 24 * 365); //UTC Milliseconds, 365 days in the future.
                a.setNegative(true); //This is an assertion that an individual *cannot* do something, not that they *can*.
                a.setConfidence(1.0);
                EcRepository.save(a, me.getCompetence, console.error);
                if (assertionHistory[app.subject] != null)
                    assertionHistory[app.subject].addAssertion(a);
            });
        },
        unclaimIncompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcAssertion.search(repo,
                "competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + app.me + "\"",
                function (assertions) {
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (app.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative != null)
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (negative) {
                                                        EcRepository._delete(assertion, me.getCompetence, console.error);
                                                        if (assertionHistory[app.subject] != null)
                                                            assertionHistory[app.subject].removeAssertion(assertion);
                                                    }
                                                }, console.error);
                                        }
                                    }, console.error);
                                }
                            }, console.error);
                        })(obj);
                    }
                    if (a != null) a();
                }, console.error);
        }
    },
    template: '<li class="competency" :id="uri">' +
        '<span v-if="parentCompetent"></span>' +
        '<span v-else>' +
        '<button class="inline" v-if="competent" v-on:click="unclaimCompetence" :title="unclaimCompetencePhrase"><i class="mdi mdi-checkbox-marked-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-else v-on:click="claimCompetence" :title="claimCompetencePhrase"><i class="mdi mdi-checkbox-blank-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="incompetent" v-on:click="unclaimIncompetence" :title="unclaimIncompetencePhrase"><i class="mdi mdi-close-box-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-else v-on:click="claimIncompetence" :title="claimIncompetencePhrase"><i class="mdi mdi-checkbox-blank-outline" aria-hidden="true"></i></button>' +
        ' </span> ' +
        '<a v-observe-visibility="{callback: initialize,once: true}" v-on:click="setCompetency">{{ name }}</a> <span v-on:click="setCompetency">{{ countPhrase }}</span> ' +
        '<small v-on:click="setCompetency" v-if="description" class="block">{{ description }}</small>' +
        '<assertion v-for="item in assertionsByOthers" :short="true" :uri="item.id" title="Assertion from elsewhere"></assertion>' +
        '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild" :parentCompetent="isCompetent" :subject="subject"></competency></ul>' +
        '</li>'

});
