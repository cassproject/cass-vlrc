Vue.component('assertionhistory', {
    props: ['pk'],
    data: function () {
        return {
            assertionResult: [],
            visible: false
        }
    },
    computed: {
        assertions: {
            get: function () {
                if (this.pk == null) return null;
                if (app.assertions == null) return null;
                var results = [];
                for (var i = 0; i < app.assertions.length; i++) {
                    if (app.assertions[i].getSubject().toPem() == this.pk)
                        results.push(app.assertions[i]);
                }
                return results;
            }
        }
    },
    created: function () {},
    watch: {},
    methods: {
        initialize: function (isVisible, entry) {
            if (isVisible) {
                this.visible = true;
            }

        }
    },
    template: '<div v-observe-visibility="{callback: initialize,once: true}"><h3>Claims (Private)</h3>' +
        '<span v-if="visible"><span v-if="assertions.length == 0">None.</span></span>' +
        '<ul v-if="visible" style="max-height:10rem;overflow-y:scroll;">' +
        '<assertion v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></assertion>' +
        '</ul>' +
        '<div v-else><br>Loading Assertions...</div>' +
        '</div>'
});
