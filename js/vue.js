var app;
app = new Vue({
    el: '#app',
    computed: {
        uri: {
            get: function () {
                return $("iframe").attr("src");
            },
            set: function (v) {
                return $("iframe").attr("src", v);
            }
        }
    },
    created: function () {
        this.identities = EcIdentityManager.ids
    },
    methods: {
        searchGoogle: function () {
            window.open("https://google.com/search?q=" + app.selectedCompetency.getName(), "lernnit");
        },
        addResource: function () {
            var c = new CreativeWork();
            c.assignId(repo.selectedServer, EcCrypto.md5(app.inputUrl + app.selectedCompetency.shortId()));
            c.name = app.inputName;
            c.description = app.inputDescription;
            c.url = app.inputUrl;
            c.educationalAlignment = new AlignmentObject();
            c.educationalAlignment.targetUrl = app.selectedCompetency.shortId();
            c.educationalAlignment.alignmentType = "teaches";
            c.addOwner(EcIdentityManager.ids[0].ppk.toPk());
            EcRepository.save(c, console.log, console.error);
            var c = this.selectedCompetency;
            this.selectedCompetency = null;
            this.$nextTick(function () {
                app.selectedCompetency = c;
                if (topicCompetencies[app.selectedCompetency.shortId()] != null)
                    for (var i = 0; i < topicCompetencies[app.selectedCompetency.shortId()].length; i++)
                        topicCompetencies[app.selectedCompetency.shortId()][i].getResourceCount();
            });
        }
    },
    watch: {
        inputUrl: function (newUrl) {
            var me = this;
            EcRemote.getExpectingObject("https://api.urlmeta.org/", "?url=" + newUrl, function (success) {
                app.inputName = success.meta.title;
                app.inputDescription = success.meta.description;
            }, console.error);
        },
        subject: function (newSubject) {
            var pk = EcPk.fromPem(newSubject);
            var me = this;
            EcRepository.get(repo.selectedServer + "data/" + pk.fingerprint(), function (person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function (person) {
                        var p = new Person();
                        p.copyFrom(person);
                        if (p.name != null)
                            me.subjectName = p.name;
                        else if (p.givenName != null && p.familyName != null)
                            me.subjectName = p.givenName + " " + p.familyName;
                        else if (p.givenName != null)
                            me.subjectName = p.givenName;
                        else
                            me.subjectName = "Unknown Subject.";
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    if (p.name != null)
                        me.subjectName = p.name;
                    else if (p.givenName != null && p.familyName != null)
                        me.subjectName = p.givenName + " " + p.familyName;
                    else if (p.givenName != null)
                        me.subjectName = p.givenName;
                    else
                        me.subjectName = "Unknown Subject.";
                }
            }, function (failure) {
                me.subjectName = "Unknown Subject.";
            });
        }
    },
    data: {
        message: 'Hello Vue!',
        login: false,
        subject: null,
        subjectName: "Not loaded yet...",
        me: null,
        status: 'loading...',
        selectedFramework: null,
        selectedCompetency: null,
        selectedResource: null,
        selectedJobPosting: null,
        profiles: EcIdentityManager.contacts,
        inputUrl: "",
        inputName: "",
        inputDescription: "",
        processing: false,
        processingMessage: "",
        assertions: null,
        jobPostings: null,
    }
});
