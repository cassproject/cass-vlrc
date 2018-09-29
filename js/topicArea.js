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
    props: ['uri', 'hasChild', 'parentCompetent'],
    data: function () {
        return {
            counter: 0,
            competent: false
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
        isCompetent: {
            get: function () {
                return this.competent || this.parentCompetent;
            }
        }
    },
    created: function () {
        this.getCompetence();
    },
    methods: {
        setCompetency: function () {
            app.selectedCompetency = EcCompetency.getBlocking(this.uri);
            app.availableResources = null;
            $("#rad3").click();
        },
        getCompetence: function (evt) {
            if (this.parentCompetent) return;
            var me = this;
            repo.search(
                "@type:Assertion AND competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\"",
                function (assertion) {},
                function (assertions) {
                    me.competent = false;
                    var addresses = {};
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        var assertion = new EcAssertion();
                        assertion.copyFrom(obj);
                        assertion.getSubjectAsync(function (subject) {
                            if (EcIdentityManager.ids[0].ppk.toPk().toPem() == subject.toPem())
                                me.competent = true;
                        }, console.error);
                    }
                }, console.error);
        },
        claimCompetence: function (evt, after) {
            var a = new EcAssertion();
            a.generateId(repo.selectedServer);
            a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
            a.setSubject(EcIdentityManager.ids[0].ppk.toPk());
            a.setAgent(EcIdentityManager.ids[0].ppk.toPk());
            a.setCompetency(EcRemoteLinkedData.trimVersionFromUrl(this.uri));
            a.setAssertionDate(Date.now()); //UTC Milliseconds
            a.setExpirationDate(Date.now() + 1000 * 60 * 60 * 24 * 365); //UTC Milliseconds, 365 days in the future.
            EcRepository.save(a, this.getCompetence, console.error);
        },
        unclaimCompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcAssertion.search(repo,
                "competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\"",
                function (assertions) {
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        var assertion = new EcAssertion();
                        assertion.copyFrom(obj);
                        assertion.getSubjectAsync(function (subject) {
                            if (EcIdentityManager.ids[0].ppk.toPk().toPem() == subject.toPem())
                                EcRepository._delete(assertion, me.getCompetence, console.error);
                        }, console.error);
                    }
                    if (a != null) a();
                }, console.error);
        }
    },
    template: '<li>' +
        '<span v-if="parentCompetent"></span>' +
        '<span v-else>' +
        '<a v-if="competent" v-on:click="unclaimCompetence" title="By clicking this, I no longer think I can demonstrate this."><i class="mdi mdi-checkbox-marked-circle-outline" aria-hidden="true"></i></a> ' +
        '<a v-else v-on:click="claimCompetence" title="By clicking this, I think I can demonstrate this."><i class="mdi mdi-checkbox-blank-circle-outline" aria-hidden="true"></i></a> ' +
        '</span> ' +
        '<span v-on:click="setCompetency">{{ name }}</span> (<span v-on:click="setCompetency">{{ count }} resource{{ count == 1 ? "" : "s" }}</span>)' +
        '<small v-on:click="setCompetency" v-if="description" class="block">{{ description }}</small>' +
        '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild" :parentCompetent="isCompetent"></competency></ul>' +
        '</li>'

});
