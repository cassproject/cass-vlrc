<template>
    <div>
        <input type="text" class="jobPostingsSearchInput" placeholder="Search..." v-model="search"/>
        <ul v-if="jobPostings">
            <jobPostingSelect v-for="item in jobPostings" v-bind:key="item.id" :uri="item.id"></jobPostingSelect>
        </ul>
        <div v-else><br>Loading Postings...</div>
        <jobPostingCreate/>
    </div>
</template>
<script>
import jobPostingSelect from "@/controls/jobPostingSelect.vue";
import jobPostingCreate from "@/controls/jobPostingCreate.vue";
export default {
    name: "jobPostings",
    props: [],
    components: {jobPostingSelect, jobPostingCreate},
    data: function() {
        return {
            jobPostingsResult: null
        };
    },
    created: function() {
        this.getJobPostings();
    },
    computed: {
        jobPostings: {
            get: function() { return this.$store.state.jobPostings; },
            set: function(val) { this.$store.commit("jobPostings", val); }
        },
        search: {
            get: function() { return this.$store.state.jobPostingsSearch; },
            set: function(val) { this.$store.commit("jobPostingsSearch", val); this.getJobPostings(); }
        }
    },
    methods: {
        getJobPostings: function() {
            var me = this;
            var search = this.search;
            if (search == null || search === "")
                search = "*";
            search = "(" + search + ") AND @type:JobPosting";
            repo.searchWithParams(search, {
                size: 50
            }, function(result) {}, function(results) {
                me.jobPostings = results;
            }, console.error);
        }
    }
};
</script>