Vue.component('profiles', {
    props: ['profiles','identities'],
    data: function () {
        return {};
    },
    computed: {},
    methods: {
        changeSelected: function (pk) {
            app.subject = pk;
            //$("#rad2").click();
        }
    },
    template: '<div>' +
        '<ul>' +
        '<profile v-if="identities" v-for="item in identities" v-bind:key="item.ppk.toPk().toPem()" :pk="item.ppk.toPk().toPem()" :displayName="item.displayName" :onClick="changeSelected"></profile>' +
        '<profile v-if="profiles" v-for="item in profiles" v-bind:key="item.pk.toPem()" :pk="item.pk.toPem()" :displayName="item.displayName" :onClick="changeSelected"></profile>' +
        '<div v-else><br>Loading Profiles...</div>' +
        '</ul>' +
        '</div>'
});
Vue.component('people', {
    props: [],
    data: function () {
        return {
            peopleResult: [],
            searched: false,
            search: null,
            lastSearch: null
        };
    },
    computed: {
        people: {
            get: function () {
                var me = this;
                if (this.lastSearch != this.search)
                    this.peopleResult = null;
                this.lastSearch = this.search;
                if (this.searched) {
                    return this.peopleResult;
                }
                var search = this.search;
                if (search == null) search = "*";
                me.peopleResult.splice(0, me.peopleResult.length);
                EcPerson.search(repo, search, function (people) {
                    for (var i = 0; i < people.length; i++)
                        if (people[i].owner != null)
                            if (EcPk.fromPem(people[i].owner[0]).fingerprint() == people[i].getGuid())
                                me.peopleResult.push(people[i]);
                    me.searched = true;
                }, console.error, {
                    size: 50
                });
                return null;
            }
        }
    },
    template: '<div>' +
        '<input type="text" class="frameworksSearchInput" placeholder="Search for people..." v-model="search"/>' +
        '<ul v-if="people">' +
        '<profile v-for="item in people" v-bind:key="item.owner[0]" :pk="item.owner[0]" :displayName="item.name" :onClick="changeSelected"></profile>' +
        '</ul>' +
        '<div v-else><br>Loading People...</div>' +
        '</div>'
});
