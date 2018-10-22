Vue.component('profile', {
    props: ['pk'],
    data: function () {
        return {
            editing: false,
            private: false,
            personObj: null,
            refreshesStuff: true
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
                return this.person.name;
            },
            set: function (newName) {
                this.personObj.name = newName;
            }
        },
        mine: {
            get: function () {
                if (this.person == null)
                    return false;
                return this.person.hasOwner(EcIdentityManager.ids[0].ppk.toPk());
            }
        }
    },
    watch: {
        private: function () {}
    },
    methods: {
        savePerson: function () {
            this.editing = false;
            var thingToSave = this.personObj;
            var me = this;
            if (this.private) {
                if (thingToSave.reader == null)
                    thingToSave.reader = [];
                EcEncryptedValue.toEncryptedValueAsync(thingToSave, false, function (thingToSave) {
                    thingToSave.name = null;
                    EcRepository.save(thingToSave, me.getPerson, console.error);
                }, console.error);
            } else
                EcRepository.save(thingToSave, me.getPerson, console.error);
        },
        getPerson: function () {
            this.personObj = null;
            if (this.refreshesStuff) {
                assertionHistory.assertions = null;
                viewHistory.views = null;
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
                var p = new Person();
                p.copyFrom(person);
                me.person = p;
            }, function (failure) {
                var pk = EcPk.fromPem(me.pk);
                me.person = new Person();
                me.person.assignId(repo.selectedServer, pk.fingerprint());
                me.person.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                me.person.name = "Unknown Person.";
                me.private = true;
                me.savePerson();
            });
        },
        cancelSave: function () {
            this.editing = false;
            this.getPerson();
        }
    },
    template: '<div>' +
        '<span v-if="mine">' +
        '<span v-if="editing">' +
        '<i class="mdi mdi-content-save" aria-hidden="true" style="float:right;font-size:x-large" placeholder="Save your person." v-on:click="savePerson()"></i>' +
        '<i class="mdi mdi-cancel" aria-hidden="true" style="float:right;font-size:x-large" placeholder="Cancel editing." v-on:click="cancelSave();"></i>' +
        '</span>' +
        '<span v-else>' +
        '<i class="mdi mdi-pencil" aria-hidden="true" style="float:right;font-size:x-large" placeholder="Edit your person." v-on:click="editing = true;"></i>' +
        '</span>' +
        '</span>' +
        '<input v-if="editing" v-on:keyup.esc="cancelSave()" v-on:keyup.enter="savePerson()" v-model="name">' +
        '<h1 v-else>{{ name }}</h1>' +
        '<div v-if="editing"><br><br><input :id="pk" v-model="private" type="checkbox"><label :for="pk">Private</label></div>' +
        '</div>'
});
var assertionHistory = null;
Vue.component('assertionhistory', {
    props: ['pk'],
    data: function () {
        return {
            assertionResult: null
        }
    },
    computed: {
        assertions: {
            get: function () {
                var me = this;
                if (this.pk == null) return null;
                if (this.assertionResult != null)
                    return this.assertionResult;
                EcAssertion.search(repo, "\"" + this.pk + "\"", function (assertions) {
                    assertions = assertions.sort(function (a, b) {
                        return parseInt(b.id.substring(b.id.lastIndexOf("/") + 1)) - parseInt(a.id.substring(a.id.lastIndexOf("/") + 1));
                    });
                    me.assertionResult = assertions;
                }, console.error, {
                    size: 5000
                });
                return null;
            },
            set: function (v) {
                this.assertionResult = v;
            }
        }
    },
    created: function () {
        assertionHistory = this;
    },
    watch: {},
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
    template: '<div><h3>Claims</h3>' +
        '<span v-if="assertions"><span v-if="assertions.length == 0">None.</span></span>' +
        '<ul v-if="assertions" style="max-height:10rem;overflow-y:scroll;"><assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion></ul>' +
        '<div v-else><br>Loading Assertions...</div>' +
        '</div>'
});
Vue.component('assertion', {
    props: ['uri'],
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
                statement += "demonstrate " + this.competencyText + ".";
                return statement;
            }
        },
        competencyText: {
            get: function () {
                if (this.competency == null)
                    return null;
                return this.competency.name;
            }
        }
    },
    created: function () {},
    watch: {},
    methods: {
        initialize: function (isVisible, entry) {
            var me = this;
            if (isVisible) {
                EcAssertion.get(this.uri, function (assertion) {
                    me.assertion = assertion;
                    assertion.getSubjectAsync(function (subjectPk) {
                        EcRepository.get(repo.selectedServer + "data/" + subjectPk.fingerprint(), function (person) {
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
                        }, function (failure) {
                            me.subject = "someone";
                        });
                    }, console.error);
                    assertion.getAgentAsync(function (agentPk) {
                        EcRepository.get(repo.selectedServer + "data/" + agentPk.fingerprint(), function (person) {
                            var e = new EcEncryptedValue();
                            if (person.isAny(e.getTypes())) {
                                e.copyFrom(person);
                                e.decryptIntoObjectAsync(function (person) {
                                    var p = new Person();
                                    p.copyFrom(person);
                                    me.agent = p.name;
                                }, function (failure) {
                                    me.agent = "someone";
                                });
                            } else {
                                var p = new Person();
                                p.copyFrom(person);
                                me.agent = p.name;
                            }
                        }, function (failure) {
                            me.agent = "someone";
                        });
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
        }
    },
    template: '<div v-observe-visibility="{callback: initialize,once: true}"><li v-if="statement" >{{ statement }}</li></div>'

});

var viewHistory = null;
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
        viewHistory = this;
    },
    watch: {},
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
    template: '<div><h3>Views</h3>' +
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
                    EcRepository.get(repo.selectedServer + "data/" + EcPk.fromPem(view.owner[0]).fingerprint(), function (person) {
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
