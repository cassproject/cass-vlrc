var assertionHistory = {};
Vue.component('assertionhistory', {
    props: ['pk'],
    data: function () {
        return {
            assertionResult: [],
            searched: false
        }
    },
    computed: {
        assertions: {
            get: function () {
                var me = this;
                if (this.pk == null) return null;
                if (this.searched)
                    return this.assertionResult;
                EcAssertion.search(repo, "(\\*@reader:\"" + this.pk + "\") OR (\\*@owner:\"" + this.pk + "\")", function (assertions) {
                    assertions = assertions.sort(function (a, b) {
                        return parseInt(b.id.substring(b.id.lastIndexOf("/") + 1)) - parseInt(a.id.substring(a.id.lastIndexOf("/") + 1));
                    });
                    me.assertionResult.splice(0, me.assertionResult.length);
                    for (var i = 0; i < assertions.length; i++)
                        me.assertionResult.push(assertions[i]);
                    me.searched = true;
                }, console.error, {
                    size: 5000
                });
                return null;
            },
            set: function (assertions) {
                if (assertions == null) {
                    this.assertionResult.splice(0, this.assertionResult.length);
                } else {
                    this.assertionResult.splice(0, this.assertionResult.length);
                    for (var i = 0; i < assertions.length; i++)
                        this.assertionResult.push(assertions[i]);
                }
            }
        }
    },
    created: function () {},
    watch: {
        pk: function (newPk, oldPk) {
            delete assertionHistory[oldPk];
            this.assertionResult = [];
            this.searched = false;
            assertionHistory[newPk] = this;
        }
    },
    methods: {
        addAssertion: function (a) {
            this.assertionResult.unshift(a);
        },
        removeAssertion: function (a) {
            for (var i = 0; i < this.assertionResult.length; i++) {
                if (this.assertionResult[i].id == a.id)
                    this.assertionResult.splice(i, 1);
            }
        }
    },
    template: '<div><h3>Claims (Private)</h3>' +
    '<span v-if="assertions"><span v-if="assertions.length == 0">None.</span></span>' +
    '<ul v-if="assertions" style="max-height:10rem;overflow-y:scroll;">' +
    '<assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion>' +
    '</ul>' +
    '<div v-else><br>Loading Assertions...</div>' +
    '</div>'
});