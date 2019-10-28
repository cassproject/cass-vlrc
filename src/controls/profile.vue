<template>
    <div class="profileRow" v-if="person">
        <span v-if="mine">
            <span v-if="editing">
                <i class="mdi mdi-content-save mdi-36px right" aria-hidden="true" title="Save your personal information." v-on:click="savePerson()"></i>
                <i class="mdi mdi-cancel mdi-36px right" aria-hidden="true" title="Cancel editing." v-on:click="cancelSave();"></i>
            </span>
            <span v-else>
                <i class="mdi mdi-pencil mdi-36px right" aria-hidden="true" title="Edit your personal information." v-on:click="editing = true;"></i>
            </span>
        </span>
        <span v-else-if="showButtons">
            <i class="mdi mdi-account-circle mdi-36px right" aria-hidden="true" title="Remove person from contacts." v-if="isContact" v-on:click="uncontact();"></i>
            <i class="mdi mdi-account-circle-outline mdi-36px right" aria-hidden="true" title="Add person to contacts." v-else v-on:click="contact();"></i>
            <i class="mdi mdi-comment-processing-outline mdi-36px right" aria-hidden="true" :title="unshareStatement" v-if="isSubject == false"
            v-on:click="unshareAssertionsAboutSubjectWith();"></i>
            <i class="mdi mdi-comment-account mdi-36px right" aria-hidden="true" :title="shareStatement" v-if="isSubject == false"
            v-on:click="shareAssertionsAboutSubjectWith();"></i>
        </span>
        <img style="vertical-align: sub;" v-if="fingerprintUrl" :src="fingerprintUrl" :title="fingerprint"/>
        <svg v-else style="vertical-align: sub;" width="44" height="44" :data-jdenticon-value="fingerprint" :title="fingerprint"></svg>
         <span v-if="editing">Name:</span>
        <input type="text" v-if="editing" v-on:keyup.esc="cancelSave()" v-on:keyup.enter="savePerson()" v-model="name">
         <span v-if="editing">Email:</span>
        <input type="text" v-if="editing" v-on:keyup.esc="cancelSave()" v-on:keyup.enter="savePerson()" v-model="email">
        <h2 v-else v-on:click="clickTitle" style="display:inline;">{{ name }}</h2>
        <div v-if="editing"><br><br>
        <input :id="pk" v-model="isPrivate" type="checkbox"><label :for="pk">Private</label></div>
    </div>
</template>
<style scoped>
.right {
    float:right;
    font-size:large
}
.profileRow {
    margin-bottom: .5rem;
}
img {
    margin-right:.5rem;
}
</style>
<script>
import jdenticon from 'jdenticon';
export default {
    props: ['pk', 'displayName', 'onClick'],
    data: function() {
        return {
            editing: false,
            personObj: null,
            inContactList: null
        };
    },
    computed: {
        queryParams: function() {
            return queryParams == null ? {} : queryParams;
        },
        showButtons: function() {
            return this.queryParams.hideProfileButtons == null;
        },
        person: {
            get: function() {
                if (this.personObj != null) {
                    return this.personObj;
                }
                return null;
            },
            set: function(person) {
                this.personObj = person;
            }
        },
        name: {
            get: function() {
                if (this.person == null) { return "Loading..."; }
                if (this.person.givenName != null && this.person.familyName != null) { return this.person.givenName + " " + this.person.familyName; }
                if (this.person.name == null) { return "<Restricted>"; }
                // EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)).displayName = this.personObj.name;
                return this.person.name;
            },
            set: function(newName) {
                this.personObj.name = newName;
                if (EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)) != null) {
                    EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)).displayName = this.personObj.name;
                }
            }
        },
        email: {
            get: function() {
                if (this.person == null) { return "Loading..."; }
                if (this.person.name == null) { return ""; }

                return this.person.email;
            },
            set: function(newEmail) {
                this.personObj.email = newEmail;
            }
        },
        me: function() { return this.$store.state.me; },
        subject: function() { return this.$store.state.subject; },
        subjectName: function() { return this.$store.state.subjectName; },
        mePerson: function() { return this.$store.state.mePerson; },
        profiles: function() { return this.$store.state.profiles; },
        processing: {get: function() { return this.$store.state.mePerson; }},
        processingMessage: {get: function() { return this.$store.state.mePerson; }},
        isPrivate: {
            get: function() {
                if (EcEncryptedValue.encryptOnSaveMap == null)
                    EcEncryptedValue.encryptOnSaveMap = {};
                return EcEncryptedValue.encryptOnSaveMap[this.personObj.shortId()] === true;
            },
            set: function(newValue, oldValue) {
                EcEncryptedValue.encryptOnSave(this.personObj.id, newValue);
                EcEncryptedValue.encryptOnSave(this.personObj.shortId(), newValue);
            }
        },
        mine: {
            get: function() {
                if (this.me == null) { return false; }
                if (this.personObj == null) { return false; }
                return this.personObj.hasOwner(EcPk.fromPem(this.me));
            }
        },
        fingerprint: {
            get: function() {
                if (this.personObj == null) { return null; }
                setTimeout(jdenticon, 0);
                return this.personObj.getGuid();
            }
        },
        fingerprintUrl: {
            get: function() {
                if (this.personObj == null) { return null; }
                if (this.personObj.email != null) {
                    return "https://www.gravatar.com/avatar/" + EcCrypto.md5(this.personObj.email.toLowerCase()) + "?s=44";
                }
                return null;
            }
        },
        isContact: {
            get: function() {
                this.profiles;
                return EcIdentityManager.getContact(EcPk.fromPem(this.pk)) != null;
            }
        },
        shareStatement: {
            get: function() {
                return "Share your claims about " + (this.subject === this.me ? "yourself" : this.subjectName) + " with " + this.name;
            }
        },
        unshareStatement: {
            get: function() {
                return "Unshare your claims about " + (this.subject === this.me ? "yourself" : this.subjectName) + " with " + this.name;
            }
        },
        isSubject: {
            get: function() {
                return this.subject === this.pk;
            }
        }
    },
    created: function() {
        this.getPerson();
    },
    destroyed: function() {
    },
    watch: {
        pk: function() {
            this.personObj = null;
            this.editing = false;
            this.inContactList = null;
            this.getPerson();
        }
    },
    methods: {
        savePerson: function() {
            this.editing = false;
            var thingToSave = this.personObj;
            var me = this;
            if (this.isPrivate) {
                EcEncryptedValue.toEncryptedValueAsync(thingToSave, false, function(thingToSave) {
                    thingToSave.name = null; // Delete PII.
                    EcRepository.save(thingToSave, function() {
                        me.getPerson();
                        /*
                         * for (var i = 0; i < vueProfiles.length; i++) {
                         *     if (vueProfiles[i].pk === me.pk) { vueProfiles[i].getPerson(); }
                         * }
                         */
                    }, console.error);
                }, console.error);
            } else {
                EcRepository.save(thingToSave, function() {
                    me.getPerson();
                    /*
                     * for (var i = 0; i < vueProfiles.length; i++) {
                     *     if (vueProfiles[i].pk === me.pk) { vueProfiles[i].getPerson(); }
                     * }
                     */
                }, console.error);
            }
        },
        setPerson: function(person) {
            var p = new Person();
            p.copyFrom(person);
            if (p.seeks == null) { p.seeks = []; }
            this.person = p;
            if (this.pk === this.$store.state.subject) { this.$store.commit("subjectPerson", p); }
            if (this.pk === this.$store.state.me) { this.$store.commit("mePerson", p); }
        },
        getPerson: function() {
            this.personObj = null;
            var pk = EcPk.fromPem(this.pk);
            var me = this;
            EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + pk.fingerprint(), function(person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(me.setPerson, console.error);
                } else {
                    me.setPerson(person);
                }
            }, function(failure) {
                var pk = EcPk.fromPem(me.pk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                p.seeks = [];
                me.setPerson(p);
                if (me.displayName == null) { p.name = "Unknown Person."; } else { p.name = me.displayName; }
                if (me.pk === me.$store.state.subject) { me.$store.commit("subjectPerson", p); }
                if (me.pk === me.$store.state.me) { me.$store.commit("mePerson", p); }
                if (me.mine) { me.savePerson(); }
            });
        },
        cancelSave: function() {
            this.editing = false;
            this.getPerson();
        },
        clickTitle: function() {
            if (this.onClick != null) { this.onClick(this.pk); }
        },
        contact: function() {
            var c = new EcContact();
            c.pk = EcPk.fromPem(this.pk);
            c.displayName = this.name;
            EcIdentityManager.addContact(c);
            this.inContactList = true;
            this.mePerson.addReader(EcPk.fromPem(this.pk));
            repo.saveTo(this.mePerson, console.log, console.error);
        },
        uncontact: function() {
            for (var i = 0; i < EcIdentityManager.contacts.length; i++) {
                if (EcIdentityManager.contacts[i].pk.toPem() === this.pk) { EcIdentityManager.contactChanged(EcIdentityManager.contacts.splice(i, 1)); }
            }
            this.inContactList = false;
            this.mePerson.removeReader(EcPk.fromPem(this.pk));
            repo.saveTo(this.mePerson, console.log, console.error);
        },
        shareAssertionsAboutSubjectWith: function() {
            var me = this;
            this.$store.commit("processing", true);
            this.$store.commit("processingMessage", "Fetching assertions about " + me.subjectName);
            var complete = 0;
            var count = 0;
            EcAssertion.search(repo,
                "@owner:\"" + me.me + "\" AND \\*@reader:\"" + me.subject + "\"",
                function(assertions) {
                    count = assertions.length;
                    me.$store.commit("processingMessage", count + " claims found. Sharing with " + me.name + ".");
                    var eah = new EcAsyncHelper();
                    eah.each(assertions, function(assertion, after) {
                        assertion.getSubjectAsync(function(subject) {
                            if (me.subject === subject.toPem()) {
                                assertion.getAgentAsync(function(agent) {
                                    if (me.me === agent.toPem()) {
                                        assertion.addReaderAsync(EcPk.fromPem(me.pk), function() {
                                            EcRepository.save(assertion, function() {
                                                me.$store.commit("processingMessage", ++complete + " of " + count + " claims shared with " + me.name + ".");
                                                after();
                                            }, after);
                                        }, after);
                                    } else { after(); }
                                }, console.error);
                            } else { after(); }
                        }, console.error);
                    }, function(assertions) {
                        me.$store.commit("processing", false);
                    });
                }, console.error, {
                    size: 5000
                });
        },
        unshareAssertionsAboutSubjectWith: function(evt, after) {
            var me = this;
            me.processing = true;
            me.processingMessage = "Fetching assertions about " + me.subjectName;
            var complete = 0;
            var count = 0;
            EcAssertion.search(repo,
                "@owner:\"" + me.me + "\" AND \\*@reader:\"" + me.subject + "\"",
                function(assertions) {
                    var eah = new EcAsyncHelper();
                    eah.each(assertions, function(assertion, after) {
                        count = assertions.length;
                        me.processingMessage = count + " claims found. Unsharing with " + me.name + ".";
                        assertion.getSubjectAsync(function(subject) {
                            if (me.subject === subject.toPem()) {
                                assertion.getAgentAsync(function(agent) {
                                    if (me.me === agent.toPem()) {
                                        assertion.removeReaderAsync(EcPk.fromPem(me.pk), function() {
                                            EcRepository.save(assertion, function() {
                                                me.processingMessage = ++complete + " of " + count + " claims unshared with " + me.name + ".";
                                                after();
                                            }, after);
                                        }, after);
                                    } else { after(); }
                                }, console.error);
                            } else { after(); }
                        }, console.error);
                    }, function(assertions) {
                        me.processing = false;
                    });
                }, console.error, {
                    size: 5000
                });
        }
    }
};
</script>