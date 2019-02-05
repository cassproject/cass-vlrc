Vue.component('timeline', {
    props: [],
    data: function () {
        return {
            assertionResult: null,
            searched: false
        }
    },
    computed: {
        assertions: {
            get: function () {
                var me = this;
                if (this.assertionResult != null) return this.assertionResult;
                EcAssertion.search(repo, "*", function (assertions) {
                    assertions = assertions.sort(function (a, b) {
                        return parseInt(b.id.substring(b.id.lastIndexOf("/") + 1)) - parseInt(a.id.substring(a.id.lastIndexOf("/") + 1));
                    });
                    me.assertionResult = assertions;
                }, console.error, {
                    size: 5000
                });
                return null;
            }
        }
    },
    created: function () {},
    watch: {},
    methods: {},
    template: '<div><h3>Timeline</h3>' +
        '<div class="timeline" v-if="assertions">' +
        '<timelineElement v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></timelineElement>' +
        '<span v-if="assertions.length == 0">None.</span>' +
        '</div>' +
        '<div v-else><br>Loading Timeline...</div>' +
        '</div>'
});
