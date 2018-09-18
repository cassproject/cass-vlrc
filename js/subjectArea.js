Vue.component('frameworks', {
    props: [],
    data: function () {
        return {
            frameworksResult: null,
            search: null,
            lastSearch: null
        };
    },
    computed: {
        frameworks: {
            get: function () {
                var me = this;
                if (this.lastSearch != this.search)
                    this.frameworksResult = null;
                this.lastSearch = this.search;
                if (this.frameworksResult != null) {
                    $("#rad1").click();
                    return this.frameworksResult;
                }
                var search = this.search;
                if (search == null) search = "*";
                var f = EcFramework.search(repo, search, function (frameworks) {
                    me.frameworksResult = frameworks;
                }, console.error, {
                    size: 50
                });
                return null;
            }
        }
    },
    template: '<div>' +
        '<input class="frameworksSearchInput" placeholder="Search..." v-model="search"/>' +
        '<ul v-if="frameworks"><frameworkSelect v-for="item in frameworks" v-bind:key="item.id" :uri="item.id"></frameworkSelect></ul>' +
        '<div v-else><br>Loading Frameworks...</div>' +
        '</div>'
});

Vue.component('frameworkSelect', {
    props: ['uri'],
    computed: {
        name: {
            get: function () {
                if (this.uri == null) return "Invalid Framework";
                return EcFramework.getBlocking(this.uri).getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                return EcFramework.getBlocking(this.uri).getDescription();
            }
        },
    },
    methods: {
        setFramework: function () {
            app.selectedFramework = EcFramework.getBlocking(this.uri);
            $("#rad2").click();
        }
    },
    template: '<li v-on:click="setFramework">' +
        '<span>{{ name }}</span>' +
        '<small v-if="description" class="block">{{ description }}</small>' +
        '</li>'
});
