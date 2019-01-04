Vue.component('profile', {
    props: ['pk', 'displayName', 'onClick'],
    data: function () {
        return {
            editing: false,
            private: false,
            personObj: null,
            refreshesStuff: true,
            inContactList: null
        }
    },
    computed: {
        person: {
            get: function () {
                if (this.personObj != null)
                    return this.personObj;
                if (this.pk == null)
                    return null;
                this.getPerson();
                return null;
            },
            set: function (newPerson) {
                this.personObj = newPerson;
            }
        },
        name: {
            get: function () {
                if (this.person == null)
                    return "Loading...";
                if (this.person.givenName != null && this.person.familyName != null)
                    return this.person.givenName + " " + this.person.familyName;
                if (this.person.name == null)
                    return "<Restricted>";
                //EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)).displayName = this.personObj.name;
                return this.person.name;
            },
            set: function (newName) {
                this.personObj.name = newName;
                if (EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)) != null)
                    EcIdentityManager.getIdentity(EcPk.fromPem(this.pk)).displayName = this.personObj.name;
            }
        },
        mine: {
            get: function () {
                if (app.me == null)
                    return false;
                if (this.personObj == null)
                    return false;
                return this.personObj.hasOwner(EcPk.fromPem(app.me));
            }
        },
        fingerprint: {
            get: function () {
                if (this.personObj == null)
                    return null;
                return this.personObj.getGuid();
            }
        },
        fingerprintUrl: {
            get: function () {
                if (this.personObj == null)
                    return null;
                return "http://tinygraphs.com/spaceinvaders/" + this.personObj.getGuid() + "?theme=base&numcolors=16&size=22&fmt=svg";
            }
        },
        isContact: {
            get: function () {
                if (this.inContactList == null) this.inContactList = EcIdentityManager.getContact(EcPk.fromPem(this.pk)) != null;
                return this.inContactList;
            }
        },
        shareStatement: {
            get: function () {
                return "Share your claims about " + (app.subject == app.me ? "yourself" : app.subjectName) + " with " + this.name;
            }
        },
        unshareStatement: {
            get: function () {
                return "Unshare your claims about " + (app.subject == app.me ? "yourself" : app.subjectName) + " with " + this.name;
            }
        },
        isSubject: {
            get: function () {
                return app.subject == this.pk;
            }
        }
    },
    watch: {
        pk: function () {
            this.personObj = null;
            this.editing = false;
            this.private = false;
        },
        private: function () {}
    },
    methods: {
        savePerson: function () {
            this.editing = false;
            var thingToSave = this.personObj;
            var me = this;
            if (this.private) {
                if (thingToSave.reader == null) //Can delete when https://github.com/Eduworks/ec/issues/21 is resolved and integrated.
                    thingToSave.reader = []; //Can delete when https://github.com/Eduworks/ec/issues/21 is resolved and integrated.
                EcEncryptedValue.toEncryptedValueAsync(thingToSave, false, function (thingToSave) {
                    thingToSave.name = null; //Delete PII.
                    EcRepository.save(thingToSave, me.getPerson, console.error);
                }, console.error);
            } else {
                EcRepository.save(thingToSave, me.getPerson, console.error);
            }
        },
        getPerson: function () {
            this.personObj = null;
            if (this.refreshesStuff) {
                if (assertionHistory[this.pk] != null)
                    assertionHistory[this.pk].assertions = null;
                if (viewHistory[this.pk] != null)
                    viewHistory[this.pk].views = null;
            }
            var pk = EcPk.fromPem(this.pk);
            var me = this;
            EcRepository.get(repo.selectedServer + "data/" + pk.fingerprint(), function (person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    me.private = true;
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function (person) {
                        var p = new Person();
                        p.copyFrom(person);
                        me.person = p;
                    }, console.error);
                } else {
                    me.private = false;
                    var p = new Person();
                    p.copyFrom(person);
                    me.person = p;
                }
            }, function (failure) {
                var pk = EcPk.fromPem(me.pk);
                var p = new Person();
                p.assignId(repo.selectedServer, pk.fingerprint());
                p.addOwner(pk);
                if (me.displayName == null)
                    p.name = "Unknown Person.";
                else
                    p.name = me.displayName;
                me.person = p;
                me.private = true;
                if (me.mine)
                    me.savePerson();
            });
        },
        cancelSave: function () {
            this.editing = false;
            this.getPerson();
        },
        clickTitle: function () {
            if (this.onClick != null)
                this.onClick(this.pk);
        },
        contact: function () {
            var c = new EcContact();
            c.pk = EcPk.fromPem(this.pk);
            c.displayName = this.name;
            EcIdentityManager.addContact(c);
            this.inContactList = true;
        },
        uncontact: function () {
            for (var i = 0; i < EcIdentityManager.contacts.length; i++) {
                if (EcIdentityManager.contacts[i].pk.toPem() == this.pk)
                    EcIdentityManager.contactChanged(EcIdentityManager.contacts.splice(i, 1));
            }
            this.inContactList = false;
        },
        shareAssertionsAboutSubjectWith: function () {
            var me = this;
            app.processing = true;
            app.processingMessage = "Fetching assertions about " + app.subjectName;
            var complete = 0;
            var count = 0;
            EcAssertion.search(repo,
                "@owner:\"" + app.subject + "\" AND \\*@reader:\"" + app.me + "\"",
                function (assertions) {
                    count = assertions.length;
                    app.processingMessage = count + " claims found. Sharing with " + me.name + ".";
                    var eah = new EcAsyncHelper();
                    eah.each(assertions, function (assertion, after) {
                        assertion.getSubjectAsync(function (subject) {
                            if (app.subject == subject.toPem()) {
                                assertion.getAgentAsync(function (agent) {
                                    if (app.me == agent.toPem()) {
                                        assertion.addReader(EcPk.fromPem(me.pk));
                                        EcRepository.save(assertion, function () {
                                            app.processingMessage = ++complete + " of " + count + " claims shared with " + me.name + ".";
                                            after();
                                        }, after);
                                    } else
                                        after();
                                }, console.error);
                            } else
                                after();
                        }, console.error);
                    }, function (assertions) {
                        app.processing = false;
                    });
                }, console.error, {
                    size: 5000
                });
        },
        unshareAssertionsAboutSubjectWith: function (evt, after) {
            var me = this;
            app.processing = true;
            app.processingMessage = "Fetching assertions about " + app.subjectName;
            var complete = 0;
            var count = 0;
            EcAssertion.search(repo,
                "@owner:\"" + app.subject + "\" AND \\*@reader:\"" + app.me + "\"",
                function (assertions) {
                    var eah = new EcAsyncHelper();
                    eah.each(assertions, function (assertion, after) {
                        count = assertions.length;
                        app.processingMessage = count + " claims found. Unsharing with " + me.name + ".";
                        assertion.getSubjectAsync(function (subject) {
                            if (app.subject == subject.toPem()) {
                                assertion.getAgentAsync(function (agent) {
                                    if (app.me == agent.toPem()) {
                                        assertion.removeReader(EcPk.fromPem(me.pk));
                                        EcRepository.save(assertion, function () {
                                            app.processingMessage = ++complete + " of " + count + " claims unshared with " + me.name + ".";
                                            after();
                                        }, after);
                                    } else
                                        after();
                                }, console.error);
                            } else
                                after();
                        }, console.error);
                    }, function (assertions) {
                        app.processing = false;
                    });
                }, console.error, {
                    size: 5000
                });
        }
    },
    template: '<div class="profileRow" v-if="person">' +
        '<span v-if="mine">' +
        '<span v-if="editing">' +
        '<i class="mdi mdi-content-save" aria-hidden="true" style="float:right;font-size:large" title="Save your person." v-on:click="savePerson()"></i>' +
        '<i class="mdi mdi-cancel" aria-hidden="true" style="float:right;font-size:large" title="Cancel editing." v-on:click="cancelSave();"></i>' +
        '</span>' +
        '<span v-else>' +
        '<i class="mdi mdi-pencil" aria-hidden="true" style="float:right;font-size:large" title="Edit your person." v-on:click="editing = true;"></i>' +
        '</span>' +
        '</span>' +
        '<span v-else>' +
        '<i class="mdi mdi-account-circle" aria-hidden="true" style="float:right;font-size:large" title="Remove person from contacts." v-if="isContact" v-on:click="uncontact();"></i> ' +
        '<i class="mdi mdi-account-circle-outline" aria-hidden="true" style="float:right;font-size:large" title="Add person to contacts." v-else v-on:click="contact();"></i> ' +
        '<i class="mdi mdi-comment-processing-outline" aria-hidden="true" style="float:right;font-size:large" :title="unshareStatement" v-if="isSubject == false" v-on:click="unshareAssertionsAboutSubjectWith();"></i> ' +
        '<i class="mdi mdi-comment-account" aria-hidden="true" style="float:right;font-size:large" :title="shareStatement" v-if="isSubject == false" v-on:click="shareAssertionsAboutSubjectWith();"></i> ' +
        '</span>' +
        '<img style="vertical-align: sub;" v-if="fingerprint" :src="fingerprintUrl" :title="fingerprint"/> <input v-if="editing" v-on:keyup.esc="cancelSave()" v-on:keyup.enter="savePerson()" v-model="name">' +
        '<h2 v-else v-on:click="clickTitle" style="display:inline;">{{ name }}</h2>' +
        '<div v-if="editing"><br><br><input :id="pk" v-model="private" type="checkbox"><label :for="pk">Private</label></div>' +
        '</div>'
});
var assertionHistory = {};
Vue.component('assertionhistory', {
    props: ['pk'],
    data: function () {
        return {
            assertionResult: [],
            searched: false
        }
    },
    computed: {
        assertions: {
            get: function () {
                var me = this;
                if (this.pk == null) return null;
                if (this.searched)
                    return this.assertionResult;
                EcAssertion.search(repo, "(\\*@reader:\"" + this.pk + "\") OR (\\*@owner:\"" + this.pk + "\")", function (assertions) {
                    assertions = assertions.sort(function (a, b) {
                        return parseInt(b.id.substring(b.id.lastIndexOf("/") + 1)) - parseInt(a.id.substring(a.id.lastIndexOf("/") + 1));
                    });
                    me.assertionResult.splice(0, me.assertionResult.length);
                    for (var i = 0; i < assertions.length; i++)
                        me.assertionResult.push(assertions[i]);
                    me.searched = true;
                }, console.error, {
                    size: 5000
                });
                return null;
            },
            set: function (assertions) {
                if (assertions == null) {
                    this.assertionResult.splice(0, this.assertionResult.length);
                } else {
                    this.assertionResult.splice(0, this.assertionResult.length);
                    for (var i = 0; i < assertions.length; i++)
                        this.assertionResult.push(assertions[i]);
                }
            }
        }
    },
    created: function () {},
    watch: {
        pk: function (newPk, oldPk) {
            delete assertionHistory[oldPk];
            this.assertionResult = [];
            this.searched = false;
            assertionHistory[newPk] = this;
        }
    },
    methods: {
        addAssertion: function (a) {
            this.assertionResult.unshift(a);
        },
        removeAssertion: function (a) {
            for (var i = 0; i < this.assertionResult.length; i++) {
                if (this.assertionResult[i].id == a.id)
                    this.assertionResult.splice(i, 1);
            }
        }
    },
    template: '<div><h3>Claims (Private)</h3>' +
        '<span v-if="assertions"><span v-if="assertions.length == 0">None.</span></span>' +
        '<ul v-if="assertions" style="max-height:10rem;overflow-y:scroll;">' +
        '<assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion>' +
        '</ul>' +
        '<div v-else><br>Loading Assertions...</div>' +
        '</div>'
});
Vue.component('assertion', {
    props: ['uri', 'icon'],
    data: function () {
        return {
            assertion: null,
            subject: null,
            agent: null,
            timestamp: null,
            expiry: null,
            competency: null,
            negative: null,
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
        statement: {
            get: function () {
                if (this.subject == null)
                    return "Decrypting...";
                if (this.agent == null)
                    return "Decrypting...";
                if (this.competency == null)
                    return "Decrypting...";
                var statement = "";
                if (this.timestamp != null)
                    statement += moment(this.timestamp).fromNow() + ", ";
                statement += this.agent + " claimed " + this.subject;
                if (this.negative == true)
                    statement += " could not ";
                else
                    statement += " could ";
                statement += "demonstrate \"" + this.competencyText + "\".";
                return statement;
            }
        },
        timeAgo: {
            get: function () {
                if (this.timestamp == null)
                    return null;
                return moment(this.timestamp).fromNow();
            }
        },
        competencyText: {
            get: function () {
                if (this.competency == null)
                    return null;
                return this.competency.name;
            }
        },
        fingerprintUrl: {
            get: function () {
                if (this.subjectPk == null)
                    return null;
                return "http://tinygraphs.com/spaceinvaders/" + this.subjectPk.fingerprint() + "?theme=base&numcolors=16&size=11&fmt=svg";
            }
        }
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
                            me.subjectPk = pk;
                        }, console.error);
                    }
                    if (assertion.agent == null)
                        me.agent = "nobody"
                    else
                        assertion.getAgentNameAsync(function (name) {
                            me.agent = name;
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
                    EcCompetency.get(assertion.competency, function (competency) {
                        me.competency = competency;
                    }, console.error);
                }, console.error);
            }
        },
        gotoCompetency: function () {
            var me = this;
            EcFramework.search(repo, "competency:\"" + this.assertion.competency + "\"", function (frameworks) {
                if (frameworks.length > 0) {
                    app.selectedFramework = frameworks[0];
                    app.selectedCompetency = EcCompetency.getBlocking(me.assertion.competency);
                    app.subject = me.assertion.getAgent().toPem();
                    $("#rad2").click();
                    setTimeout(
                        function () {
                            $("[id=\"" + app.selectedCompetency.id + "\"]").each(function () {
                                $(this)[0].scrollIntoView();
                            })
                        }
                        , 1000);
                }
            }, console.error);
        }
    },
    template: '<span v-observe-visibility="{callback: initialize,once: true}">' +
        '<span v-if="icon">' +
        '<i v-if="negative" class="mdi mdi-close-box-outline" aria-hidden="true" :title="statement"></i>' +
        '<i v-else class="mdi mdi-checkbox-marked-circle-outline" aria-hidden="true" :title="statement"></i>' +
        '</span>' +
        '<span v-else>' +
        '<li v-if="ok">' +
        '<span v-if="timestamp">{{ timeAgo }}, </span>' +
        '{{agent}} claimed {{subject}} ' +
        '<span v-if="negative">could not</span><span v-else>could</span>' +
        ' demonstrate <a href="#" v-on:click="gotoCompetency" :title="assertion.competency">{{ competencyText }}</a>' +
        '</li>' +
        '</span>' +
        '</span>'

});

var viewHistory = {};
Vue.component('viewhistory', {
    props: ['pk'],
    data: function () {
        return {
            viewResult: null
        }
    },
    computed: {
        views: {
            get: function () {
                var me = this;
                if (this.pk == null) return null;
                if (this.viewResult != null)
                    return this.viewResult;
                repo.searchWithParams("@type:ChooseAction AND @owner:\"" + this.pk + "\"", {
                    size: 5000
                }, null, function (views) {
                    views = views.sort(function (a, b) {
                        return parseInt(b.id.substring(b.id.lastIndexOf("/") + 1)) - parseInt(a.id.substring(a.id.lastIndexOf("/") + 1));
                    });
                    me.viewResult = views;
                }, console.error, {
                    size: 5000
                });
                return null;
            },
            set: function (v) {
                this.viewResult = v;
            }
        }
    },
    created: function () {
        viewHistory[this.pk] = this;
    },
    watch: {
        pk: function () {
            this.viewResult = null;
        }
    },
    methods: {
        addView: function (a) {
            this.viewResult.unshift(a);
        },
        removeView: function (a) {
            for (var i = 0; i < this.viewResult.length; i++) {
                if (this.viewResult[i].id == a.id)
                    this.viewResult.splice(i, 1);
            }
        }
    },
    template: '<div><h3>Views (Public)</h3>' +
        '<span v-if="views"><span v-if="views.length == 0">None.</span></span>' +
        '<ul v-if="views" style="max-height:10rem;overflow-y:scroll;"><chooseAction v-for="item in views" v-bind:key="item.id" :uri="item.id"></chooseAction></ul>' +
        '<div v-else><br>Loading Views...</div>' +
        '</div>'
});
Vue.component('chooseAction', {
    props: ['uri'],
    data: function () {
        return {
            subject: null,
            action: null,
            resource: null
        };
    },
    computed: {
        timestamp: {
            get: function () {
                if (this.action == null) return null;
                return moment(parseInt(this.action.id.substring(this.action.id.lastIndexOf("/") + 1))).fromNow();
            }
        }
    },
    created: function () {},
    watch: {},
    methods: {
        initialize: function (isVisible, entry) {
            var me = this;
            if (isVisible) {
                EcRepository.get(this.uri, function (view) {
                    me.action = view;
                    EcRepository.get(repo.selectedServer + "data/schema.org.Person/" + EcPk.fromPem(view.owner[0]).fingerprint(), function (person) {
                        var e = new EcEncryptedValue();
                        if (person.isAny(e.getTypes())) {
                            e.copyFrom(person);
                            e.decryptIntoObjectAsync(function (person) {
                                var p = new Person();
                                p.copyFrom(person);
                                me.subject = p.name;
                            }, function (failure) {
                                me.subject = "someone";
                            });
                        } else {
                            var p = new Person();
                            p.copyFrom(person);
                            me.subject = p.name;
                        }
                    }, console.error);
                    EcRepository.get(view.object, function (resourceAlignment) {
                        me.resource = resourceAlignment;
                    }, console.error);
                }, console.error);
            }
        }
    },
    template: '<div v-observe-visibility="{callback: initialize,once: true}"><li v-if="subject" >{{ timestamp }}, {{ subject }} viewed <a v-if="resource" target="_blank" :href="resource.url">{{resource.name}}</a><span v-else>...</span></li></div>'

});
