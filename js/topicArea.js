Vue.component('framework', {
    props: ['uri'],
    data: function () {
        return {
            competency: null
        }
    },
    computed: {
        competencies: {
            get: function () {
                var me = this;
                if (this.uri == null) return null;
                if (this.competency != null)
                    return this.competency;
                EcFramework.get(this.uri, function (f) {
                    var precache = [];
                    if (f.competency != null) precache = precache.concat(f.competency);
                    if (f.relation != null) precache = precache.concat(f.relation);
                    repo.precache(precache, function (success) {
                        var r = {};
                        var top = {};
                        if (f == null)
                            return r;
                        if (f.competency != null)
                            for (var i = 0; i < f.competency.length; i++) {
                                var c = EcCompetency.getBlocking(f.competency[i]);
                                if (c != null)
                                    r[c.shortId()] = top[c.shortId()] = c;
                            }
                        if (f.relation != null)
                            for (var i = 0; i < f.relation.length; i++) {
                                var a = null;
                                try {
                                    a = EcAlignment.getBlocking(f.relation[i]);
                                } catch (e) {}
                                if (a != null) {
                                    if (a.relationType == Relation.NARROWS) {
                                        if (r[a.target] == null) continue;
                                        if (r[a.source] == null) continue;
                                        if (r[a.target].hasChild == null)
                                            r[a.target].hasChild = [];
                                        r[a.target].hasChild.push(r[a.source]);
                                        delete top[a.source];
                                    }
                                }
                            }
                        if (f.competency != null)
                            for (var i = 0; i < f.competency.length; i++) {
                                if (r[f.competency[i]].hasChild == null) continue;
                                r[f.competency[i]].hasChild.sort(function (a, b) {
                                    return f.competency.indexOf(a.shortId()) - f.competency.indexOf(b.shortId());
                                });
                            }
                        me.competency = [];
                        var keys = EcObject.keys(top);
                        for (var i = 0; i < keys.length; i++)
                            me.competency.push(top[keys[i]]);
                        me.competency.sort(function (a, b) {
                            return f.competency.indexOf(a.shortId()) - f.competency.indexOf(b.shortId());
                        });
                    });
                }, console.error);
                return null;
            },
            set: function (v) {
                this.competency = v;
            }
        },
        name: function () {
            if (this.uri == null)
                return "N/A";
            return EcFramework.getBlocking(this.uri).getName();
        },
        description: function () {
            if (this.uri == null)
                return null;
            return EcFramework.getBlocking(this.uri).getDescription();
        },
        permalink: function () {
            return window.location.origin + window.location.pathname + "?frameworkId=" + EcRemoteLinkedData.trimVersionFromUrl(this.uri);
        }
    },
    watch: {
        uri: function (newUri, oldUri) {
            this.competency = null;
            console.log(this.uri);
        }
    },
    template: '<div>' +
        '<a style="float:right;cursor:pointer;" :href="permalink">permalink</a>' +
        '<div>{{ name }}<small v-if="description" class="block">{{ description }}</small></div>' +
        '<ul v-if="competencies"><competency v-for="item in competencies" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul>' +
        '<div v-else><br>Loading Framework...</div></div>'
});

Vue.component('competency', {
    props: ['uri', 'hasChild'],
    data: function () {
        return {
            counter: 0
        };
    },
    computed: {
        count: {
            get: function () {
                var me = this;
                if (this.uri == null) return 0;

                var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\"";
                repo.searchWithParams(search, {
                        size: 50
                    },
                    null,
                    function (resources) {
                        me.counter = resources.length;
                    }, console.error);
                return this.counter;
            }
        },
        name: {
            get: function () {
                if (this.uri == null) return "Invalid Competency";
                return EcCompetency.getBlocking(this.uri).getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                return EcCompetency.getBlocking(this.uri).getDescription();
            }
        },
    },
    methods: {
        setCompetency: function () {
            app.selectedCompetency = EcCompetency.getBlocking(this.uri);
            app.availableResources = null;
            $("#rad3").click();
        }
    },
    template: '<li>' +
        '<span v-on:click="setCompetency">{{ name }}</span> (<span v-on:click="setCompetency">{{ count }} resources</span>)' +
        '<small v-on:click="setCompetency" v-if="description" class="block">{{ description }}</small>' +
        '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul>' +
        '</li>'
});
