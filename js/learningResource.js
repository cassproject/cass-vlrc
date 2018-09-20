Vue.component('resources', {
    props: ['url'],
    data: function () {
        return {
            resources: null,
            empty: false
        };
    },
    created: function () {
        this.getResources();
    },
    watch: {
        url: function (newUrl) {
            this.getResources();
        }
    },
    methods: {
        getResources: function () {
            var me = this;
            if (this.url == null) return;
            var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.url) + "\"";
            repo.searchWithParams(search, {
                    size: 50
                },
                null,
                function (resources) {
                    me.resources = resources;
                    me.empty = resources.length == 0;
                }, console.error);
        }
    },
    template: '<div>' +
        '<div v-if="empty"><br>None found...</div>' +
        '<div v-else>' +
        '<ul v-if="resources"><resourceSelect v-for="item in resources" v-bind:key="item.id" :uri="item.id"></resourceSelect></ul>' +
        '<div v-else>Loading Resources...</div>' +
        '</div>' +
        '</div>'
});

Vue.component('resourceSelect', {
    props: ['uri'],
    computed: {
        name: {
            get: function () {
                if (this.uri == null) return "Untitled Resource.";
                var resource = EcRepository.getBlocking(this.uri);
                if (resource != null && resource.name != null)
                    return resource.name;
                else
                    return "Unknown Resource.";
            }
        },
        url: {
            get: function () {
                if (this.uri == null) return "#";
                var resource = EcRepository.getBlocking(this.uri);
                if (resource != null && resource.url != null)
                    return resource.url;
                else
                    return "#";
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return null;
                var resource = EcRepository.getBlocking(this.uri);
                if (resource != null && resource.description != null)
                    return resource.description;
                else
                    return "Unknown Resource.";
            }
        },
    },
    methods: {
        setResource: function () {
            app.selectedResource = EcRepository.getBlocking(this.uri);
            window.open(app.selectedResource.url, "lernnit");
        }
    },
    template: '<li v-on:click="setResource">' +
        '<a :href="url" target="_blank">{{ name }}</a>' +
        '<small v-if="description" class="block">{{ description }}</small>' +
        '</li>'
});

Vue.component('history', {
    props: [],
    data: function () {
        return {
            assertionResult: null,
            empty: false
        };
    },
    computed: {
        assertions: {
            get: function () {
                var me = this;
                if (this.assertionResult != null) {
                    this.empty = this.assertionResult.length == 0;
                    return this.assertionResult;
                }
                var search = "\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\" AND competency:\"" + app.selectedCompetency.shortId() + "\"";
                EcAssertion.search(repo, search,
                    function (assertions) {
                        me.assertionResult = assertions;
                    }, console.error, {
                        size: 50
                    });
                return null;
            }
        }
    },
    template: '<div>' +
        '<div v-if="empty"><br>None found...</div>' +
        '<div v-else>' +
        '<ul v-if="assertions"><assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion></ul>' +
        '<div v-else>Loading History...</div>' +
        '</div>' +
        '</div>'
});

Vue.component('assertion', {
    props: ['uri'],
    computed: {
        name: {
            get: function () {
                if (this.uri == null) return "Untitled Resource.";
                return EcAssertion.getBlocking(this.uri).getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return null;
                return EcAssertion.getBlocking(this.uri).getDescription();
            }
        },
    },
    template: '<li>' +
        '<span>{{ name }}</span>' +
        '<small v-if="description" class="block">{{ description }}</small>' +
        '</li>'
});
