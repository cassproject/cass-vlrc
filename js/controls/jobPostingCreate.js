Vue.component('jobPostingCreate', {
    props: [],
    data: function () {
        return {
            jobPostingObject: null,
            candidateRequirement: "",
            skills: [],
        };
    },
    computed: {
        title: {
            get: function () {
                return this.jobPostingObject.title;
            },
            set: function (newVal) {
                this.jobPostingObject.title = newVal;
            }
        },
        description: {
            get: function () {
                return this.jobPostingObject.description;
            },
            set: function (newVal) {
                this.jobPostingObject.description = newVal;
            }
        },
        type: {
            get: function () {
                return this.jobPostingObject.additionalType;
            },
            set: function (newVal) {
                this.jobPostingObject.additionalType = newVal;
            }
        }
    },
    created: function () {
        this.jobPostingObject = new JobPosting();
        this.jobPostingObject.title = "New Position";
        this.jobPostingObject.additionalType = "jobPostingType://gig";
        this.jobPostingObject.addOwner(EcPk.fromPem(app.me));
        var me = this;
        this.$nextTick(function () {
            $("#tags").autocomplete({
                source: function (request, response) {
                    EcCompetency.search(repo, request.term, function (competencies) {
                        for (var i = 0; i < competencies.length; i++) {
                            competencies[i].label = competencies[i].getName();
                            competencies[i].value = competencies[i].shortId();
                        }
                        response(competencies);
                    }, console.error);
                },
                select: function (event, ui) {
                    me.skills.push(ui.item.shortId());
                    me.candidateRequirement = "";
                }
            });
        });
    },
    methods: {
        saveNewPosting: function () {
            this.jobPostingObject.skills = this.skills;
            this.jobPostingObject.generateId(repo.selectedServer);
            app.jobPostings.unshift(this.jobPostingObject);
            EcRepository.save(this.jobPostingObject, function () {}, console.error);
            this.skills = [];
            this.jobPostingObject = new JobPosting();
            this.jobPostingObject.title = "New Position";
            this.jobPostingObject.additionalType = "jobPostingType://gig";
            this.jobPostingObject.addOwner(EcPk.fromPem(app.me));
        },
        removeRequirement: function (index) {
            this.skills.splice(index, 1);
        }
    },
    template: '<div class="jobPostingCreate"><hr><h3>New Posting</h3>' +
        '<select v-model="type">' +
        '<option value="jobPostingType://gig">Gig</option>' +
        '<option value="jobPostingType://job">Job</option>' +
        '<option value="jobPostingType://position">Position</option>' +
        '<option value="jobPostingType://temp">Temporary Position</option>' +
        '</select>' +
        '<input type="text" placeholder="Position, Job or Gig Title." id="jobPostingCreateTitle" v-model="jobPostingObject.title"/>' +
        '<textarea placeholder="Position, Job or Gig Description." id="jobPostingCreateDescription" v-model="jobPostingObject.description"/>' +
        '<h4>An applicant for this job should be able to:</h4>' +
        '<ul><div v-for="(item,index) in skills" :key="item"><button v-on:click="removeRequirement(index);">Remove</button><competency :uri="item" :parentCompetent="true"/></div></ul>' +
        '<label for="tags">Add Requirements: </label><input type="text" id="tags" v-model="candidateRequirement">' +
        '<button v-on:click="saveNewPosting">Create New Posting</button>' +
        '</div>'
});
