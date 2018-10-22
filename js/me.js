Vue.component('profile', {
    props: ['pk'],
    data: function () {
        return {
            editing: false,
            private: false,
            personObj: null
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
        '<h1 v-else>{{ name }}</h1><br><br>' +
        '<div v-if="editing"><input :id="pk" v-model="private" type="checkbox"><label :for="pk">Private</label></div>' +
        '</div>'
});
