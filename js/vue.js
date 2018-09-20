var app = new Vue({
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
            EcRepository.save(c, console.log, console.error);
            var c = this.selectedCompetency;
            this.selectedCompetency = null;
            setTimeout(function () {
                app.selectedCompetency = c;
            }, 100);
        }
    },
    data: {
        message: 'Hello Vue!',
        login: false,
        status: 'loading...',
        selectedFramework: null,
        selectedCompetency: null,
        selectedResource: null,
        inputUrl: "",
        inputName: "",
        inputDescription: ""
    }
});
if (EcIdentityManager.ids.length == 0) {
    var i = new EcIdentity();
    i.displayName = "You";
    EcPpk.generateKeyAsync(function (ppk) {
        i.ppk = ppk;
        EcIdentityManager.addIdentity(i);
        app.login = true;
        EcIdentityManager.saveIdentities();
    });
} else
    app.login = true;
