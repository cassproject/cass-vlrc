Vue.component('jobpostings', {
    props: [],
    data: function () {
        return {
            jobPostingsResult: null,
            search: null,
            lastSearch: null
        };
    },
    computed: {
        jobPostings: {
            get: function () {
                var me = this;
                if (this.lastSearch != this.search)
                    this.jobPostingsResult = null;
                this.lastSearch = this.search;
                if (this.jobPostingsResult != null) {
                    return this.jobPostingsResult;
                }
                var search = this.search;
                if (search == null) search = "*";
                search = "(" + search + ") AND @type:JobPosting";
                repo.searchWithParams(search, {
                    size: 50
                }, function (result) {}, function (results) {
                    me.jobPostingsResult = results;
                }, console.error);
                return null;
            }
        }
    },
    template: '<div>' +
        '<input type="text" class="jobPostingsSearchInput" placeholder="Search..." v-model="search"/>' +
        '<ul v-if="jobPostings">' +
        '<jobPostingSelect v-for="item in jobPostings" v-bind:key="item.id" :uri="item.id"></jobPostingSelect>' +
        '</ul>' +
        '<div v-else><br>Loading Postings...</div>' +
        '<jobPostingCreate/>' +
        '</div>'
});
