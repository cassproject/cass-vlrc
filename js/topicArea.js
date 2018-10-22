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
                    topicCompetencies = {};
                    repo.multiget(precache, function (success) {
                        var r = {};
                        var top = {};
                        if (f == null)
                            return r;
                        if (f.competency != null)
                            for (var i = 0; i < f.competency.length; i++) {
                                var c = EcCompetency.getBlocking(f.competency[i]);
                                if (c != null)
                                    r[f.competency[i]] = r[c.shortId()] = top[c.shortId()] = c;
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
                    },console.error,console.log);
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

var topicCompetencies = {};
Vue.component('competency', {
    props: ['uri', 'hasChild', 'parentCompetent', 'dontRegister'],
    data: function () {
        return {
            counter: 0,
            competent: false,
            incompetent: false
        };
    },
    computed: {
        count: {
            get: function () {
                var me = this;
                if (this.uri == null) return 0;
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
                var descriptionArray = EcCompetency.getBlocking(this.uri).getDescription();
                if (descriptionArray == null) return null;
                if (EcArray.isArray(descriptionArray))
                    return descriptionArray[0];
                return descriptionArray;
            }
        },
        isCompetent: {
            get: function () {
                return this.competent || this.parentCompetent;
            }
        },
        countPhrase: {
            get: function () {
                if (this.count == 0)
                    return "";
                return "(" + this.count + " resource" + (this.count == 1 ? "" : "s") + ")";
            }
        }
    },
    created: function () {
        if (topicCompetencies[this.uri] == null)
            topicCompetencies[this.uri] = [this];
        else
            topicCompetencies[this.uri].push(this);
    },
    watch: {
        uri: function (newUri, oldUri) {
            this.getCompetence(null, true);
        }
    },
    methods: {
        initialize: function(isVisible, entry) {
            if (isVisible) {
                this.getCompetence();
                this.getResourceCount();
                console.log(entry);
            }
        },
        getResourceCount: function () {
            var me = this;
            var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\"";
            repo.searchWithParams(search, {
                    size: 50
                },
                null,
                function (resources) {
                    me.counter = resources.length;
                }, console.error);
        },
        setCompetency: function () {
            app.selectedCompetency = EcCompetency.getBlocking(this.uri);
            app.availableResources = null;
            $("#rad3").click();
        },
        getCompetence: function (evt, dontPropegate) {
            if (this.parentCompetent) return;
            var me = this;
            if (dontPropegate != true && topicCompetencies[this.uri] != null)
                for (var i = 0; i < topicCompetencies[this.uri].length; i++)
                    if (this != topicCompetencies[this.uri][i])
                        topicCompetencies[this.uri][i].getCompetence(evt, true);
            repo.search(
                "@type:Assertion AND competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\"",
                function (assertion) {},
                function (assertions) {
                    me.competent = false;
                    me.incompetent = false;
                    var addresses = {};
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (EcIdentityManager.ids[0].ppk.toPk().toPem() == subject.toPem()) {
                                    if (assertion.negative != null)
                                        assertion.getNegativeAsync(function (negative) {
                                            if (negative)
                                                me.incompetent = true;
                                            else
                                                me.competent = true;
                                        });
                                    else
                                        me.competent = true;
                                }

                            }, console.error);
                        })(obj);
                    }
                }, console.error);
        },
        claimCompetence: function (evt, after) {
            var me = this;
            this.unclaimIncompetence(evt, function () {
                var a = new EcAssertion();
                a.generateId(repo.selectedServer);
                a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                a.addReader(EcPk.fromPem("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAixq5WEp+F5HEJZj12N791JATM+vkVJuolfOq0KbqtZwiygPao12fnpTwZdRCmb/4O1n6PXkJJ1XbufAx6k7hGNyM1kTngbs743QuyzP15SmYcP9l9FluL9ISvIECt1eHo4sSKdaKxLRguOj79HjZXtFg3UDIhvvLBVqPQm5d5OQ1OPgu4WzL4GN7hYwK6PYJf2zJjxs9vEQ6agrvpAZI+Rm1DT5x3i4xtcB+Mip473Xe+6IPoRmJ/NqzcP3c0xBf6xV1GDBBIQIaRRkIJgoAb/k0fb+Hl0uXnKxcSm86nYk4Kq5GSbeZ+G+B3rrnQfXbLZnle6nTj1YdAOErOKKi2wIDAQAB-----END PUBLIC KEY-----")); //Eduworks Researcher
                a.setSubject(EcIdentityManager.ids[0].ppk.toPk());
                a.setAgent(EcIdentityManager.ids[0].ppk.toPk());
                a.setCompetency(EcRemoteLinkedData.trimVersionFromUrl(me.uri));
                a.setAssertionDate(Date.now()); //UTC Milliseconds
                a.setExpirationDate(Date.now() + 1000 * 60 * 60 * 24 * 365); //UTC Milliseconds, 365 days in the future.
                a.setNegative(false); //This is an assertion that an individual *can* do something, not that they *cannot*.
                EcRepository.save(a, me.getCompetence, console.error);
            });
        },
        unclaimCompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcAssertion.search(repo,
                "competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\"",
                function (assertions) {
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (EcIdentityManager.ids[0].ppk.toPk().toPem() == subject.toPem()) {
                                    if (assertion.negative == null)
                                        EcRepository._delete(assertion, me.getCompetence, console.error);
                                    else
                                        assertion.getNegativeAsync(function (negative) {
                                            if (!negative)
                                                EcRepository._delete(assertion, me.getCompetence, console.error);
                                        });
                                }
                            }, console.error);
                        })(obj);
                    }
                    if (a != null) a();
                }, console.error);
        },
        claimIncompetence: function (evt, after) {
            var me = this;
            this.unclaimCompetence(evt, function () {
                var a = new EcAssertion();
                a.generateId(repo.selectedServer);
                a.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                a.addReader(EcPk.fromPem("-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAixq5WEp+F5HEJZj12N791JATM+vkVJuolfOq0KbqtZwiygPao12fnpTwZdRCmb/4O1n6PXkJJ1XbufAx6k7hGNyM1kTngbs743QuyzP15SmYcP9l9FluL9ISvIECt1eHo4sSKdaKxLRguOj79HjZXtFg3UDIhvvLBVqPQm5d5OQ1OPgu4WzL4GN7hYwK6PYJf2zJjxs9vEQ6agrvpAZI+Rm1DT5x3i4xtcB+Mip473Xe+6IPoRmJ/NqzcP3c0xBf6xV1GDBBIQIaRRkIJgoAb/k0fb+Hl0uXnKxcSm86nYk4Kq5GSbeZ+G+B3rrnQfXbLZnle6nTj1YdAOErOKKi2wIDAQAB-----END PUBLIC KEY-----")); //Eduworks Researcher
                a.setSubject(EcIdentityManager.ids[0].ppk.toPk());
                a.setAgent(EcIdentityManager.ids[0].ppk.toPk());
                a.setCompetency(EcRemoteLinkedData.trimVersionFromUrl(me.uri));
                a.setAssertionDate(Date.now()); //UTC Milliseconds
                a.setExpirationDate(Date.now() + 1000 * 60 * 60 * 24 * 365); //UTC Milliseconds, 365 days in the future.
                a.setNegative(true); //This is an assertion that an individual *can* do something, not that they *cannot*.
                EcRepository.save(a, me.getCompetence, console.error);
            });
        },
        unclaimIncompetence: function (evt, after) {
            var me = this;
            var a = after;
            EcAssertion.search(repo,
                "competency:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.uri) + "\" AND @owner:\"" + EcIdentityManager.ids[0].ppk.toPk().toPem() + "\"",
                function (assertions) {
                    for (var i = 0; i < assertions.length; i++) {
                        var obj = assertions[i];
                        (function (obj) {
                            var assertion = new EcAssertion();
                            assertion.copyFrom(obj);
                            assertion.getSubjectAsync(function (subject) {
                                if (EcIdentityManager.ids[0].ppk.toPk().toPem() == subject.toPem())
                                    if (assertion.negative != null)
                                        assertion.getNegativeAsync(function (negative) {
                                            if (negative)
                                                EcRepository._delete(assertion, me.getCompetence, console.error);
                                        });
                            }, console.error);
                        })(obj);
                    }
                    if (a != null) a();
                }, console.error);
        }
    },
    template: '<li>' +
        '<span v-if="parentCompetent"></span>' +
        '<span v-else>' +
        '<button class="inline" v-if="competent" v-on:click="unclaimCompetence" title="By clicking this, I no longer think I can demonstrate this."><i class="mdi mdi-checkbox-marked-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-else v-on:click="claimCompetence" title="By clicking this, I think I can demonstrate this."><i class="mdi mdi-checkbox-blank-circle-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-if="incompetent" v-on:click="unclaimIncompetence" title="By clicking this, I no longer think I cannot demonstrate this."><i class="mdi mdi-close-box-outline" aria-hidden="true"></i></button>' +
        '<button class="inline" v-else v-on:click="claimIncompetence" title="By clicking this, I think I would demonstrate that I cannot do this."><i class="mdi mdi-checkbox-blank-outline" aria-hidden="true"></i></button>' +
        ' </span> ' +
        '<a v-observe-visibility="{callback: initialize,once: true}" v-on:click="setCompetency">{{ name }}</a> <span v-on:click="setCompetency">{{ countPhrase }}</span>' +
        '<small v-on:click="setCompetency" v-if="description" class="block">{{ description }}</small>' +
        '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild" :parentCompetent="isCompetent"></competency></ul>' +
        '</li>'

});
