<template>
    <div class="timelineElement" v-observe-visibility="{callback: initialize}">
        <div v-if="competencyName">
        <span v-if="ok"><div class="time" v-if="timestamp">{{ timeAgo }},</div>
        <img style="vertical-align: sub;" v-if="fingerprintUrlAgent" :src="fingerprintUrlAgent" :title="agent"/>
        <svg v-else style="vertical-align: sub;" width="44" height="44" :data-jdenticon-value="fingerprintAgent" :title="fingerprintAgent"></svg>
        <img style="vertical-align: sub;" v-if="fingerprintUrlSubject" :src="fingerprintUrlSubject" :title="subject"/>
        <svg v-else style="vertical-align: sub;" width="44" height="44" :data-jdenticon-value="fingerprintSubject" :title="fingerprintSubject"></svg>
        <div class="content">
        <div v-if="mine" v-on:click="deleteMe" title="Delete this claim." style="float:right;cursor:pointer;">X</div>
        {{agent}} claimed {{subject}}
        <span v-if="negative">could not</span><span v-else>could</span>
         demonstrate
        <a class="competencyText" href="#" v-on:click="gotoCompetency" :title="assertion.competency">
        "{{ competencyName }}"
        <span v-if="frameworkName"> in the subject area {{ frameworkName }}</span>
        </a>
        <span v-if="evidenceText"> because they
        <span v-for="(evidence, index) in evidenceText" v-bind:key="evidence">
            <span v-if="index != 0"> and they </span>
            <a v-if="evidence.url" :href="evidence.url" target="_blank">{{evidence.text}}</a>
            <span v-else >{{evidence.text}}</span>
        </span>
        </span>
        <span v-if="badged"> and has issued a <a target="_blank" :href="badgeUrl">badge</a></span>.
        <br>
        <small>{{ competencyDescription }}</small>
        </div>
        </span>
        <div class="time" v-else><i class="mdi mdi-spin mdi-loading"/></div>
        </div>
    </div>
</template>
<style scoped>

.timelineElement .time {
    content: 'aa';
    position: relative;
    display: block;
    float: left;
    padding: .5rem;
    left: -.2rem;
    width: 140px;
    background-color: white;
    border: 4px solid black;
    text-align: center;
    top: -.0rem;
    z-index: 5;
}

.timelineElement .content {
    margin-left: 13rem;
}

.timelineElement {
    left: 0rem;
    width:100%;
    min-height: 4rem;
}

.timelineElement img,.timelineElement svg {
    float: left;
    clip-path: circle(22px at center);
    margin-left: .25rem;
    margin-right: .25rem;
}

.timelineElement {
    margin-top: .25rem;
    padding: .5rem;
    min-height: 30px;
}

</style>
<script>
import jdenticon from 'jdenticon';
var moment = require('moment');
export default {
    name: "timelineElement",
    props: ['uri'],
    data: function() {
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
            evidence: null,
            evidenceExplanation: null
        };
    },
    computed: {
        timeAgo: function() {
            var m = this.$store.state.minute;
            return moment(this.timestamp).fromNow();
        },
        ok: {
            get: function() {
                if (this.subject == null) { return false; }
                if (this.agent == null) { return false; }
                if (this.competency == null) { return false; }
                return true;
            }
        },
        competencyName: {
            get: function() {
                if (this.competency == null) { return null; }
                return this.competency.getName();
            }
        },
        competencyNameTrunc: {
            get: function() {
                if (this.competency == null) { return null; }
                var s = this.competency.getName();
                if (s.length > 160) { s = s.substring(0, 160) + "..."; }
                return s;
            }
        },
        frameworkName: {
            get: function() {
                if (this.framework == null) { return null; }
                return this.framework.getName();
            }
        },
        competencyDescription: {
            get: function() {
                if (this.competency == null) { return null; }
                return this.competency.getDescription();
            }
        },
        fingerprintUrlAgent: {
            get: function() {
                if (this.agentPerson == null) {
                    return null;
                }
                if (this.agentPerson.email != null) {
                    return "https://www.gravatar.com/avatar/" + EcCrypto.md5(this.agentPerson.email.toLowerCase()) + "?s=44";
                }
                return null;
            }
        },
        fingerprintUrlSubject: {
            get: function() {
                if (this.subjectPerson == null) {
                    return null;
                }
                if (this.subjectPerson.email != null) {
                    return "https://www.gravatar.com/avatar/" + EcCrypto.md5(this.subjectPerson.email.toLowerCase()) + "?s=44";
                }
                return null;
            }
        },
        fingerprintAgent: {
            get: function() {
                if (this.agentPerson == null) {
                    return null;
                }
                setTimeout(jdenticon, 0);
                return this.agentPerson.getGuid();
            }
        },
        fingerprintSubject: {
            get: function() {
                if (this.subjectPerson == null) {
                    return null;
                }
                setTimeout(jdenticon, 0);
                return this.subjectPerson.getGuid();
            }
        },
        mine: {
            get: function() {
                if (this.uri == null) return null;
                var assertion = this.assertion;
                if (assertion != null) {
                    if (assertion.owner == null || assertion.owner.length === 0) { return true; }
                    return assertion.hasOwner(EcIdentityManager.ids[0].ppk.toPk());
                } else { return null; }
            }
        },
        evidenceText: {
            get: function() {
                var me = this;
                if (this.evidenceExplanation == null) {
                    if (this.evidence != null) {
                        if (this.evidence.length > 0) {
                            var count = this.evidence.length;
                            app.computeBecause(this.evidence, function(because) {
                                me.$nextTick(function() {
                                    if (count === me.evidence.length) { me.evidenceExplanation = because; }
                                });
                            });
                        }
                    }
                }
                return this.evidenceExplanation;
            }
        },
        badged: {
            get: function() {
                if (this.assertion == null) { return false; }
                return this.assertion.hasReader(app.badgePk);
            }
        },
        badgeUrl: {
            get: function() {
                if (this.assertion != null) {
                    if (this.assertion.hasReader(app.badgePk)) {
                        return EcRemote.urlAppend(repo.selectedServer, "badge/assertion/") + this.assertion.getGuid();
                    }
                }
                return "";
            }
        }
    },
    created: function() {
    },
    destroyed: function() {
        clearInterval(this.invl);
    },
    watch: {
        evidence: function(oldEvidence, newEvidence) {
            evidenceExplanation = null;
        }
    },
    methods: {
        initialize: function(isVisible, entry) {
            this.isVisible = isVisible;
            if (isVisible) {
                if (this.once) return;
                this.once = true;
                this.getAssertion(isVisible, entry);
            }
        },

        getAssertion: function(isVisible, entry) {
            var me = this;
            if (true && isVisible) {
                EcAssertion.get(this.uri, function(assertion) {
                    me.assertion = assertion;
                    if (assertion.subject == null) { me.subject = "nobody"; } else {
                        assertion.getSubjectNameAsync(function(name) {
                            me.subject = name;
                        }, console.error);
                        assertion.getSubjectAsync(function(pk) {
                            me.subjectPk = pk.toPem();
                            me.getSubject();
                        }, console.error);
                    }
                    if (assertion.agent == null) { me.agent = "nobody"; } else {
                        assertion.getAgentNameAsync(function(name) {
                            me.agent = name;
                        }, console.error);
                    }
                    assertion.getAgentAsync(function(pk) {
                        me.agentPk = pk.toPem();
                        me.getAgent();
                    }, console.error);
                    if (assertion.assertionDate != null) {
                        assertion.getAssertionDateAsync(function(assertionDate) {
                            me.timestamp = assertionDate;
                        }, console.error);
                    }
                    if (assertion.expirationDate != null) {
                        assertion.getExpirationDateAsync(function(expirationDate) {
                            me.expiry = expirationDate;
                        }, console.error);
                    }
                    if (assertion.negative != null) {
                        assertion.getNegativeAsync(function(negative) {
                            me.negative = negative;
                        }, console.error);
                    } else { me.negative = false; }
                    if (assertion.evidence != null) {
                        for (var i = 0; i < assertion.getEvidenceCount(); i++) {
                            (function(i) {
                                assertion.getEvidenceAsync(i, function(evidence) {
                                    if (me.evidence == null) { me.evidence = []; }
                                    me.evidence.push(evidence);
                                    me.evidenceExplanation = null;
                                }, console.error);
                            })(i);
                        }
                    }
                    if (assertion.framework != null) {
                        EcFramework.get(assertion.framework, function(framework) {
                            me.framework = framework;
                        }, console.error);
                    }
                    EcCompetency.get(assertion.competency, function(competency) {
                        me.competency = competency;
                    }, function() {
                        for (var i = 0; i < app.assertions.length; i++) {
                            while (app.assertions[i].id === assertion.id) { app.assertions.splice(i, 1); }
                        }
                    });
                }, console.error);
            }
        },
        gotoCompetency: function() {
            var me = this;
            EcFramework.search(repo, "competency:\"" + this.assertion.competency + "\"", function(frameworks) {
                if (frameworks.length > 0) {
                    me.$store.commit("selectedFramework", frameworks[0]);
                    me.$store.commit("selectedCompetency", EcCompetency.getBlocking(me.assertion.competency));
                    me.$store.commit("subject",me.subjectPk);
                    me.$router.push("framework");
                }
            }, console.error);
        },
        getAgent: function() {
            this.agentPerson = null;
            var me = this;
            EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + EcPk.fromPem(me.agentPk).fingerprint(), function(person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function(person) {
                        var p = new Person();
                        p.copyFrom(person);
                        me.agentPerson = p;
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    me.agentPerson = p;
                }
            }, function(failure) {
                var pk = EcPk.fromPem(me.agentPk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                if (me.displayName == null) { p.name = "Unknown Person."; } else { p.name = me.displayName; }
                me.agentPerson = p;
            });
        },
        getSubject: function() {
            this.subjectPerson = null;
            var me = this;
            EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + EcPk.fromPem(me.subjectPk).fingerprint(), function(person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function(person) {
                        var p = new Person();
                        p.copyFrom(person);
                        me.subjectPerson = p;
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    me.subjectPerson = p;
                }
            }, function(failure) {
                var pk = EcPk.fromPem(me.agentPk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                if (me.displayName == null) { p.name = "Unknown Person."; } else { p.name = me.displayName; }
                me.subjectPerson = p;
            });
        },
        deleteMe: function() {
            var resource = EcRepository.getBlocking(this.uri);
            EcRepository._delete(resource, function() {
            }, console.error);
        }
    }
};
</script>
