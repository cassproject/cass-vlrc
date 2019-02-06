var topicCompetencies = {};
Vue.component('competency', {
    props: ['uri', 'hasChild', 'parentCompetent', 'subject'],
    data: function () {
        return {
            counter: 0,
            assertionCounter: -1,
            assertionCounterIncompetent: -1,
            competentState: null,
            incompetentState: null,
            assertionsByOthers: [],
            competencyObj: null,
            visible: false
        };
    },
    computed: {
        competency: {
            get: function () {
                var me = this;
                if (this.competencyObj == null) {
                    EcCompetency.get(this.uri, function (c) {
                        me.competencyObj = c;
                    });
                }
                return this.competencyObj;
            }
        },
        competent: {
            get: function () {
                var me = this;
                if (this.competency == null)
                    return null;
                if (app.assertions == null)
                    return null;
                if (this.visible && app.assertions.length != this.assertionCounter) {
                    this.assertionCounter = app.assertions.length;
                    this.competentStateNew = null;
                    var eah = new EcAsyncHelper();
                    eah.each(app.assertions, function (assertion, callback) {
                        if (assertion == null) {
                            callback();
                            return;
                        }
                        if (me.competency.isId(assertion.competency)) {
                            assertion.getSubjectAsync(function (subject) {
                                if (me.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative != null)
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (negative);
                                                    else
                                                        me.competentStateNew = true;
                                                    callback();
                                                });
                                            else {
                                                me.competentStateNew = true;
                                                callback();
                                            }
                                        } else {
                                            EcArray.setAdd(me.assertionsByOthers, assertion);
                                            callback();
                                        }
                                    }, callback);
                                } else
                                    callback();
                            }, callback);
                        } else
                            callback();
                    }, function (assertions) {
                        if (me.competentStateNew == null) me.competentStateNew = false;
                        me.competentState = me.competentStateNew;
                    });
                }
                return this.competentState;
            }
        },
        incompetent: {
            get: function () {
                var me = this;
                if (this.competency == null)
                    return null;
                if (app.assertions == null)
                    return null;
                if (this.visible && app.assertions.length != this.assertionCounterIncompetent) {
                    this.assertionCounterIncompetent = app.assertions.length;
                    this.incompetentStateNew = null;
                    var eah = new EcAsyncHelper();
                    eah.each(app.assertions, function (assertion, callback) {
                        if (assertion == null) return;
                        if (me.competency.isId(assertion.competency)) {
                            assertion.getSubjectAsync(function (subject) {
                                if (me.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative != null)
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (negative)
                                                        me.incompetentStateNew = true;
                                                    callback();
                                                });
                                            else {
                                                callback();
                                            }
                                        } else {
                                            EcArray.setAdd(me.assertionsByOthers, assertion);
                                            callback();
                                        }
                                    }, callback);
                                } else
                                    callback();
                            }, callback);
                        } else
                            callback();
                    }, function (assertions) {
                        if (me.incompetentStateNew == null) me.incompetentStateNew = false;
                        me.incompetentState = me.incompetentStateNew;
                    });
                }
                return this.incompetentState;
            }
        },
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
                if (this.competency == null) return "Loading...";
                return this.competency.getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                if (this.competency == null) return "Loading...";
                var descriptionArray = this.competency.getDescription();
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
                return "By selecting this, I think " + (app.subject == app.me ? "I" : app.subjectName) + " can demonstrate this.";
            }
        },
        unclaimCompetencePhrase: {
            get: function () {
                return "By deselecting this, I no longer think " + (app.subject == app.me ? "I" : app.subjectName) + " can demonstrate this.";
            }
        },
        claimIncompetencePhrase: {
            get: function () {
                return "By selecting this, I think " + (app.subject == app.me ? "I" : app.subjectName) + " could not demonstrate this.";
            }
        },
        unclaimIncompetencePhrase: {
            get: function () {
                return "By deselecting this, I no longer think " + (app.subject == app.me ? "I" : app.subjectName) + " cannot demonstrate this.";
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
            this.assertionsByOthers = [];
            this.competencyObj = null;
            this.assertionCounter = -1;
            this.assertionCounterIncompetent = -1;
            this.competentState = null;
            this.incompetentState = null;
        },
        subject: function (newSubject, oldSubject) {
            this.assertionsByOthers = [];
            this.assertionCounter = -1;
            this.assertionCounterIncompetent = -1;
            this.competentState = null;
            this.incompetentState = null;
        }
    },
    methods: {
        initialize: function (isVisible, entry) {
            this.visible = isVisible;
            if (isVisible) {
                this.getResourceCount();
            }
        },
        getResourceCount: function () {
            var me = this;
            var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\"";
            EcRepository.unsigned = true;
            repo.searchWithParams(search, {
                    size: 50
                },
                null,
                function (resources) {
                    me.counter = resources.length;
                }, console.error);

            EcRepository.unsigned = false;
        },
        setCompetency: function () {
            app.selectedCompetency = EcCompetency.getBlocking(this.uri);
            app.availableResources = null;
            $("#rad3").click();
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
                EcRepository.save(a, function () {
                    me.competentState = null;
                    app.assertions.unshift(a);
                }, console.error);
            });
        },
        unclaimCompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcCompetency.get(this.uri, function (c) {
                me.competencyObj = c;
                var assertions = app.assertions;
                if (app.assertions == null)
                    return;
                for (var i = 0; i < assertions.length; i++) {
                    var obj = assertions[i];
                    if (me.competencyObj.isId(obj.competency))
                        (function (obj) {
                            var assertion = obj;
                            assertion.getSubjectAsync(function (subject) {
                                if (me.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative == null) {
                                                EcRepository._delete(assertion, function () {
                                                    for (var delIndex = 0; delIndex < app.assertions.length; delIndex++)
                                                        if (app.assertions[delIndex].id == assertion.id)
                                                            app.assertions.splice(delIndex, 1);
                                                    me.competentState = null;
                                                }, console.error);
                                            } else
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (!negative) {
                                                        EcRepository._delete(assertion, function () {
                                                            for (var delIndex = 0; delIndex < app.assertions.length; delIndex++)
                                                                if (app.assertions[delIndex].id == assertion.id)
                                                                    app.assertions.splice(delIndex, 1);
                                                            me.competentState = null;
                                                        }, console.error);
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
                EcRepository.save(a, function () {
                    me.incompetentState = null;
                    app.assertions.unshift(a);
                }, console.error);
            });
        },
        unclaimIncompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcCompetency.get(this.uri, function (c) {
                me.competencyObj = c;
                var assertions = app.assertions;
                if (app.assertions == null)
                    return;
                for (var i = 0; i < assertions.length; i++) {
                    var obj = assertions[i];
                    if (me.competencyObj.isId(obj.competency))
                        (function (obj) {
                            var assertion = obj;
                            assertion.getSubjectAsync(function (subject) {
                                if (app.subject == subject.toPem()) {
                                    assertion.getAgentAsync(function (agent) {
                                        if (app.me == agent.toPem()) {
                                            if (assertion.negative != null)
                                                assertion.getNegativeAsync(function (negative) {
                                                    if (negative) {
                                                        EcRepository._delete(assertion, function () {
                                                            for (var delIndex = 0; delIndex < app.assertions.length; delIndex++)
                                                                if (app.assertions[delIndex].id == assertion.id)
                                                                    app.assertions.splice(delIndex, 1);
                                                            me.incompetentState = null;
                                                        }, console.error);
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
    template: '<li class="competency" v-observe-visibility="{callback: initialize}" :id="uri">' +
        '<span v-if="parentCompetent"></span>' +
        '<span v-else>' +
        '<button class="inline" v-if="competent == null"><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="competent == true" v-on:click="unclaimCompetence" :title="unclaimCompetencePhrase"><i class="mdi mdi-checkbox-marked-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="competent == false" v-on:click="claimCompetence" :title="claimCompetencePhrase"><i class="mdi mdi-checkbox-blank-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="incompetent == null"><i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="incompetent == true" v-on:click="unclaimIncompetence" :title="unclaimIncompetencePhrase"><i class="mdi mdi-close-box-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="incompetent == false" v-on:click="claimIncompetence" :title="claimIncompetencePhrase"><i class="mdi mdi-checkbox-blank-outline" aria-hidden="true"></i></button>' +
        ' </span> ' +
        '<a v-observe-visibility="{callback: initialize,once: true}" v-on:click="setCompetency">{{ name }}</a> <span v-on:click="setCompetency">{{ countPhrase }}</span> ' +
        '<small v-on:click="setCompetency" v-if="description" class="block">{{ description }}</small>' +
        '<assertion v-for="item in assertionsByOthers" v-bind:key="item.id" :short="true" :uri="item.id" title="Assertion from elsewhere"></assertion>' +
        '<ul><competency v-for="item in hasChild" :uri="item.id" :hasChild="item.hasChild" :parentCompetent="isCompetent" :subject="subject"></competency></ul>' +

        '</li>'

});
