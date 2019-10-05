<template>
    <div>
    <input type="text" class="frameworksSearchInput" placeholder="Search..." v-model="search"/>
    <ul v-if="frameworks">
    <frameworkSelect v-for="item in frameworks" v-bind:key="item.id" :uri="item.id"></frameworkSelect>
    </ul>
    <div v-else><br>Loading Frameworks...</div>
    </div>
</template>
<script>
import frameworkSelect from "@/controls/frameworkSelect.vue";
export default {
    name: "frameworks",
    components: {frameworkSelect},
    props: [],
    data: function() {
        return {
        };
    },
    computed: {
        frameworks: function() { return this.$store.state.frameworks; },
        search: {
            get: function() {
                return this.$store.state.frameworkSearch;
            },
            set: function(val) {
                this.$store.commit("frameworkSearch", val);
                this.getFrameworks();
            }
        }
    },
    watch: {
    },
    created: function() {
        if (this.frameworks == null)
            this.getFrameworks();
    },
    methods: {
        getFrameworks: function(search) {
            var me = this;
            if (search === undefined)
                search = this.search;
            if (search == null || search === "") search = "*";
            EcFramework.search(window.repo, search, function(frameworks) {
                me.$store.commit("frameworks", frameworks);
            }, console.error, {
                size: 500
            });
        }
    }
};
</script>