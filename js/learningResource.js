Vue.component('resources', {
    props: [],
    data: function () {
        return {
            resourcesResult: null,
            empty: false
        };
    },
    computed: {
        resources: {
            get: function () {
                var me = this;
                if (this.resourcesResult != null) {
                    this.empty = this.resourcesResult.length == 0;
                    return this.resourcesResult;
                }
                var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + app.selectedCompetency.shortId() + "\"";
                repo.searchWithParams(search, {
                        size: 50
                    },
                    null,
                    function (resources) {
                        me.resourcesResult = resources;
                    }, console.error);
                return null;
            }
        }
    },
    template: '<div>' +
        '<div v-if="empty"><br>None found...<br><br></div>' +
        '<div v-else>' +
        '<ul v-if="resources"><resourceSelect v-for="item in resources" v-bind:key="item.id" :uri="item.id"></resourceSelect></ul>' +
        '<div v-else><br>Loading Resources...<br><br></div>' +
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
                    return resource.getName();
                else
                    return "Unknown Resource.";
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return null;
                var resource = EcRepository.getBlocking(this.uri);
                if (resource != null && resource.description != null)
                    return resource.getDescription();
                else
                    return "Unknown Resource.";
            }
        },
    },
    methods: {
        setResource: function () {
            app.selectedResource = EcRepository.getBlocking(this.uri);
            window.open(app.selectedResource.url, "lernnit");
            $("#rad4").click();
        }
    },
    template: '<li v-on:click="setResource">' +
        '<span>{{ name }}</span>' +
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
        '<div v-if="empty"><br>None found...<br><br></div>' +
        '<div v-else>' +
        '<ul v-if="assertions"><assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion></ul>' +
        '<div v-else><br>Loading History...</div>' +
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
