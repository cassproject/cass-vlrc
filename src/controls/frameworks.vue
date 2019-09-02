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
            frameworksResult: null,
            search: null
        };
    },
    watch: {
        search: function(newSearch, oldSearch) {
            this.frameworksResult = null;
        }
    },
    computed: {
        frameworks: {
            get: function() {
                var me = this;
                if (this.frameworksResult != null) {
                    return this.frameworksResult;
                }
                var search = this.search;
                if (search == null) search = "*";
                EcFramework.search(window.repo, search, function(frameworks) {
                    me.frameworksResult = frameworks;
                }, console.error, {
                    size: 500
                });
                return this.frameworksResult;
            }
        }
    }
};
</script>