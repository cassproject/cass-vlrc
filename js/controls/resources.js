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
    '<div v-if="empty">None found...</div>' +
    '<div v-else>' +
    '<ul class="noIndent" v-if="resources"><resourceSelect v-for="item in resources" v-bind:key="item.id" :uri="item.id"></resourceSelect></ul>' +
    '<div v-else>Loading Resources...</div>' +
    '</div>' +
    '</div>'
});