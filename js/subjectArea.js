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
                if (this.uri == null) return null;
                if (this.competency != null)
                    return this.competency;
                var f = EcFramework.getBlocking(this.uri);
                var precache = [];
                if (f.competency != null) precache = precache.concat(f.competency);
                if (f.relation != null) precache = precache.concat(f.relation);
                var me = this;
                repo.precache(precache, function (success) {
                    var r = {};
                    var top = {};
                    if (f == null) return r;
                    if (f.competency != null)
                        for (var i = 0; i < f.competency.length; i++) {
                            var c = EcCompetency.getBlocking(f.competency[i]);
                            if (c != null)
                                r[c.shortId()] = top[c.shortId()] = c;
                        }
                    if (f.relation != null)
                        for (var i = 0; i < f.relation.length; i++) {
                            var a = EcAlignment.getBlocking(f.relation[i]);
                            if (a != null) {
                                if (a.relationType == Relation.NARROWS) {
                                    if (r[a.target] == null) continue;
                                    if (r[a.target].hasChild == null)
                                        r[a.target].hasChild = [];
                                    r[a.target].hasChild.push(r[a.source]);
                                    delete top[a.source];
                                }
                            }
                        }
                    me.competency = top;
                    return top;
                });
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
        }
    },
    watch: {
        uri: function (newUri, oldUri) {
            this.competency = null;
            console.log(this.uri);
        }
    },
    template: '<div>' +
        '<div>{{ name }}<small v-if="description" class="block">{{ description }}</small></div>' +
        '<ul v-if="competencies"><competency v-for="item in competencies" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul>' +
        '<div v-else><br>Loading Framework...</div></div>'
});

Vue.component('competency', {
    props: ['uri', 'hasChild'],
    computed: {
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
            $("#rad3").click();
        }
    },
    template: '<li v-on:click="setCompetency">' +
        '<span>{{ name }}</span>' +
        '<small v-if="description" class="block">{{ description }}</small>' +
        '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul>' +
        '</li>'
});
