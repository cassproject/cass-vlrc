Vue.component('profiles', {
    props: ['profiles'],
    data: function () {
        return {};
    },
    computed: {},
    methods: {
        changeSelected: function (pk) {
            app.subject = pk;
        }
    },
    template: '<div>' +
        '<ul>' +
        '<profile v-if="profiles" v-for="item in profiles" v-bind:key="item.pk.toPem()" :pk="item.pk.toPem()" :displayName="item.displayName" :onClick="changeSelected"></profile>' +
        '<div v-else><br>Loading Profiles...</div>' +
        '</ul>' +
        '</div>'
});
Vue.component('persons', {
    props: [],
    data: function () {
        return {};
    },
    computed: {
        profiles: {
            get: function () {
                return [];
            }
        }
    },
    template: '<div>' +
        '<ul>' +
        '<div><br>Loading People...</div>' +
        '</ul>' +
        '</div>'
});
