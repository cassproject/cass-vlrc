var app;
//$(document).ready(function () {
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
    created: function () {},
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
        }
    },
    data: {
        message: 'Hello Vue!',
        login: false,
        subject: null,
        status: 'loading...',
        selectedFramework: null,
        selectedCompetency: null,
        selectedResource: null,
        profiles: EcIdentityManager.contacts,
        inputUrl: "",
        inputName: "",
        inputDescription: ""
    }
});
//});
