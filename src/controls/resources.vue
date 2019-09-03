<template>
    <div>
    <div v-if="empty">No resources have been associated with this competency. To add a resource, use the form below.</div>
    <div v-else>
    <ul class="noIndent" v-if="resources">
        <resourceSelect v-for="item in resources" :uri="item.id" v-bind:key="item.id"></resourceSelect></ul>
    <div v-else>Loading Resources...</div>
    </div>
    </div>
</template>
<script>
import resourceSelect from "@/controls/resourceSelect.vue";
export default {
    props: ['url'],
    components: {resourceSelect},
    data: function() {
        return {
        };
    },
    computed: {
        resources: function() {
            return this.$store.state.creativeWorks[this.url];
        },
        empty: function() {
            if (this.resources == null) { return true; }
            return this.resources.length === 0;
        }
    },
    created: function() {
        this.getResources();
    },
    watch: {
        url: function(newUrl) {
            this.getResources();
        }
    },
    methods: {
        getResources: function() {
            var me = this;
            if (this.url == null) return;
            var search = "@type:CreativeWork AND educationalAlignment.targetUrl:\"" + EcRemoteLinkedData.trimVersionFromUrl(this.url) + "\"";
            repo.searchWithParams(search, {
                size: 50
            },
            null,
            function(resources) {
                me.$store.commit("creativeWorks", {url: me.url, resources: resources});
            }, console.error);
        }
    }
};
</script>