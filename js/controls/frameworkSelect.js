Vue.component('frameworkSelect', {
    props: ['uri'],
    computed: {
        name: {
            get: function () {
                if (this.uri == null) return "Invalid Framework";
                return EcFramework.getBlocking(this.uri).getName();
            }
        },
        description: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                return EcFramework.getBlocking(this.uri).getDescription();
            }
        },
        count: {
            get: function () {
                if (this.uri == null) return "Could not resolve URI.";
                var f = EcFramework.getBlocking(this.uri);
                if (f == null || f.competency == null)
                    return 0;
                return f.competency.length;
            }
        }
    },
    methods: {
        setFramework: function () {
            app.selectedFramework = EcFramework.getBlocking(this.uri);
            $("#rad2").click();
        }
    },
    template: '<li v-on:click="setFramework">' +
    '<span>{{ name }}</span> ({{ count }} topics)' +
    '<small v-if="description" class="block">{{ description }}</small>' +
    '</li>'
});