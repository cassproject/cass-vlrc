Vue.component('people', {
    props: [],
    data: function () {
        return {
            peopleResult: [],
            searched: false,
            search: "",
            lastSearch: null
        };
    },
    computed: {
        people: {
            get: function () {
                if (this.lastSearch != this.search) {
                    this.peopleResult.splice(0, this.peopleResult.length);
                    this.searched = false;
                }
                this.lastSearch = this.search;
                if (this.searched) {
                    return this.peopleResult;
                }
                var search = this.search;
                if (search == null || search == "") search = "*";
                var me = this;
                this.peopleResult.splice(0, this.peopleResult.length);
                EcPerson.search(repo, search, function (people) {
                    me.peopleResult.splice(0, me.peopleResult.length);
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
    methods: {
        changeSelected: function (pk) {
            app.subject = pk;
            $("#rad2").click();
        }
    },
    template: '<div>' +
        '<input type="text" class="frameworksSearchInput" placeholder="Search for people..." v-model="search"/>' +
        '<ul v-if="people">' +
        '<profile v-for="item in people" v-bind:key="item.owner[0] + \'people\'":pk="item.owner[0]" :displayName="item.name" :onClick="changeSelected"></profile>' +
        '</ul>' +
        '<div v-else><br>Loading People...</div>' +
        '</div>'
});
