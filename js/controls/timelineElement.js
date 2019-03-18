Vue.component('timelineElement', {
    props: ['uri'],
    data: function () {
        return {
            assertion: null,
            subject: null,
            subjectPk: null,
            agentPk: null,
            agent: null,
            timestamp: null,
            expiry: null,
            competency: null,
            negative: null,
            agentPerson: null,
            subjectPerson: null,
            evidence: null
        };
    },
    computed: {
        ok: {
            get: function () {
                if (this.subject == null)
                    return false;
                if (this.agent == null)
                    return false;
                if (this.competency == null)
                    return false;
                return true;
            }

        },
        timeAgo: {
            get: function () {
                if (this.timestamp == null)
                    return null;
                return moment(this.timestamp).fromNow();
            }
        },
        competencyName: {
            get: function () {
                if (this.competency == null)
                    return null;
                return this.competency.getName();
            }
        },
        frameworkName: {
            get: function () {
                if (this.framework == null)
                    return null;
                return this.framework.getName();
            }
        },
        competencyDescription: {
            get: function () {
                if (this.competency == null)
                    return null;
                return this.competency.getDescription();
            }
        },
        fingerprintUrlAgent: {
            get: function () {
                if (this.agentPerson == null) {
                    return null;
                }
                if (this.agentPerson.email != null) {
                    return "https://www.gravatar.com/avatar/" + EcCrypto.md5(this.agentPerson.email.toLowerCase()) + "?s=44";
                }
                return "http://tinygraphs.com/spaceinvaders/" + this.agentPerson.getGuid() + "?theme=base&numcolors=16&size=44&fmt=svg";
            }
        },
        fingerprintUrlSubject: {
            get: function () {
                if (this.subjectPerson == null) {
                    return null;
                }
                if (this.subjectPerson.email != null) {
                    return "https://www.gravatar.com/avatar/" + EcCrypto.md5(this.subjectPerson.email.toLowerCase()) + "?s=44";
                }
                return "http://tinygraphs.com/spaceinvaders/" + this.subjectPerson.getGuid() + "?theme=base&numcolors=16&size=44&fmt=svg";
            }
        },
        evidenceText: {
            get: function () {
                if (this.evidence != null)
                    if (this.evidence.length > 0) {
                        return app.computeBecause(this.evidence);
                    }
                return "";
            }
        },
    },
    created: function () {},
    watch: {},
    methods: {
        initialize: function (isVisible, entry) {
            var me = this;
            if (true && isVisible) {
                EcAssertion.get(this.uri, function (assertion) {
                    me.assertion = assertion;
                    if (assertion.subject == null)
                        me.subject = "nobody"
                    else {
                        assertion.getSubjectNameAsync(function (name) {
                            me.subject = name;
                        }, console.error);
                        assertion.getSubjectAsync(function (pk) {
                            me.subjectPk = pk.toPem();
                            me.getSubject();
                        }, console.error);
                    }
                    if (assertion.agent == null)
                        me.agent = "nobody"
                    else
                        assertion.getAgentNameAsync(function (name) {
                            me.agent = name;
                        }, console.error);
                    assertion.getAgentAsync(function (pk) {
                        me.agentPk = pk.toPem();
                        me.getAgent();
                    }, console.error);
                    if (assertion.assertionDate != null)
                        assertion.getAssertionDateAsync(function (assertionDate) {
                            me.timestamp = assertionDate;
                        }, console.error);
                    if (assertion.expirationDate != null)
                        assertion.getExpirationDateAsync(function (expirationDate) {
                            me.expiry = expirationDate;
                        }, console.error);
                    if (assertion.negative != null)
                        assertion.getNegativeAsync(function (negative) {
                            me.negative = negative;
                        }, console.error);
                    else
                        me.negative = false;
                    if (assertion.evidence != null)
                        for (var i = 0; i < assertion.getEvidenceCount(); i++)
                            (function (i) {
                                assertion.getEvidenceAsync(i, function (evidence) {
                                    if (me.evidence == null)
                                        me.evidence = [];
                                    me.evidence[i] = evidence;
                                }, console.error);
                            })(i);
                    if (assertion.framework != null)
                        EcFramework.get(assertion.framework, function (framework) {
                            me.framework = framework;
                        }, console.error);
                    EcCompetency.get(assertion.competency, function (competency) {
                        me.competency = competency;
                    }, function (error) {
                        for (var i = 0; i < app.assertions.length; i++)
                            while (app.assertions[i].id == assertion.id)
                                app.assertions.splice(i, 1);
                        console.error(error);
                    });
                }, console.error);
            }
        },
        gotoCompetency: function () {
            var me = this;
            EcFramework.search(repo, "competency:\"" + this.assertion.competency + "\"", function (frameworks) {
                if (frameworks.length > 0) {
                    app.selectedFramework = frameworks[0];
                    app.selectedCompetency = EcCompetency.getBlocking(me.assertion.competency);
                    app.subject = me.subjectPk;
                    $("#rad2").click();
                    setTimeout(
                        function () {
                            $("[id=\"" + app.selectedCompetency.id + "\"]").each(function () {
                                $(this)[0].scrollIntoView();
                            })
                        }, 1000);
                }
            }, console.error);
        },
        getAgent: function () {
            this.agentPerson = null;
            var me = this;
            EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + EcPk.fromPem(me.agentPk).fingerprint(), function (person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function (person) {
                        var p = new Person();
                        p.copyFrom(person);
                        me.agentPerson = p;
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    me.agentPerson = p;
                }
            }, function (failure) {
                var pk = EcPk.fromPem(me.agentPk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                if (me.displayName == null)
                    p.name = "Unknown Person.";
                else
                    p.name = me.displayName;
                me.agentPerson = p;
            });
        },
        getSubject: function () {
            this.subjectPerson = null;
            var me = this;
            EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + EcPk.fromPem(me.subjectPk).fingerprint(), function (person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function (person) {
                        var p = new Person();
                        p.copyFrom(person);
                        me.subjectPerson = p;
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    me.subjectPerson = p;
                }
            }, function (failure) {
                var pk = EcPk.fromPem(me.agentPk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                if (me.displayName == null)
                    p.name = "Unknown Person.";
                else
                    p.name = me.displayName;
                me.subjectPerson = p;
            });
        },
    },
    template: '<div class="timelineElement" v-observe-visibility="{callback: initialize,once: true}">' +
        '<span v-if="ok"><div class="time" v-if="timestamp">{{ timeAgo }},</div>' +
        '<img style="vertical-align: sub;" v-if="fingerprintUrlAgent" :src="fingerprintUrlAgent" :title="agent"/><img style="vertical-align: sub;" v-if="fingerprintUrlSubject" :src="fingerprintUrlSubject" :title="subject"/> ' +
        '<div class="content">' +
        '{{agent}} claimed {{subject}} ' +
        '<span v-if="negative">could not</span><span v-else>could</span>' +
        ' demonstrate ' +
        '<a href="#" v-on:click="gotoCompetency" :title="assertion.competency">' +
        '{{ competencyName }}' +
        '<span v-if="frameworkName"> in the subject area {{ frameworkName }}</span>' +
        '</a> {{evidenceText}}.' +
        '<br>' +
        '<small>{{ competencyDescription }}</small>' +
        '</div>' +
        '</span>' +
        '<div class="time" v-else><i class="mdi mdi-spin mdi-loading"/></div>' +
        '</div>'

});
