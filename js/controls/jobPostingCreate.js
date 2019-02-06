Vue.component('jobPostingCreate', {
    props: [],
    data: function () {
        return {
            jobPostingObject: new JobPosting(),
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
        },
        requirements: {
            get: function () {
                return this.skills;
            },
            set: function (skills) {
                this.skills = skills;
            }
        },
        requirement: {
            get: function () {
                var me = this;
                EcCompetency.search(repo, this.candidateRequirement, function (competencies) {
                    for (var i = 0; i < competencies.length; i++) {
                        competencies[i].label = competencies[i].getName();
                        competencies[i].value = competencies[i].shortId();
                    }
                    $("#tags").autocomplete({
                        source: competencies,
                        select: function (event, ui) {
                            me.skills.push(ui.item.shortId());
                            me.requirement = "";
                        }
                    });
                }, console.error);
                return this.candidateRequirement;
            },
            set: function (newVal) {
                this.candidateRequirement = newVal;
                var me = this;
                EcCompetency.search(repo, newVal, function (competencies) {
                    for (var i = 0; i < competencies.length; i++) {
                        competencies[i].label = competencies[i].getName();
                        competencies[i].value = competencies[i].shortId();
                    }
                    $("#tags").autocomplete({
                        source: competencies,
                        select: function (event, ui) {
                            me.skills.push(ui.item.shortId());
                            me.requirement = "";
                        }
                    });
                }, console.error);
            }
        }
    },
    created: function () {
        this.jobPostingObject.name = "New Position";
        this.jobPostingObject.additionalType = "jobPostingType://gig";
        this.jobPostingObject.addOwner(EcPk.fromPem(app.me));
    },
    methods: {
        saveNewPosting: function () {
            this.jobPostingObject.skills = this.skills;
            this.jobPostingObject.generateId(repo.selectedServer);
            EcRepository.save(this.jobPostingObject, function () {}, console.error);
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
        '<input type="text" placeholder="Position, Job or Gig Title." v-model="title"/>' +
        '<textarea placeholder="Position, Job or Gig Description." v-model="description"/>' +
        '<h4>An applicant for this job should be able to:</h4>' +
        '<ul><div v-for="(item,index) in requirements" :key="item"><button v-on:click="removeRequirement(index);">Remove</button><competency :uri="item" :parentCompetent="true"/></div></ul>' +
        '<label for="tags">Add Requirements: </label><input type="text" id="tags" v-model="requirement">' +
        '<button v-on:click="saveNewPosting">Create New Posting</button>' +
        '</div>'
});
