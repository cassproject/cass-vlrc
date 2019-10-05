import Vue from 'vue';
import Vuex from 'vuex';

require("cassproject");

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
        assertions: null,
        assertionsChanges: 0,
        badgePk: null,
        collapseState: {},
        creativeWorks: {},
        creativeWorksChanges: 0,
        identities: EcIdentityManager.ids,
        inputUrl: "",
        inputName: "",
        inputDescription: "",
        frameworks: null,
        frameworkSearch: null,
        jobPostings: null,
        jobPostingsSearch: null,
        login: false,
        me: null,
        mePerson: null,
        profiles: EcIdentityManager.contacts,
        processing: false,
        processingMessage: "",
        people: null,
        subject: null,
        subjectName: "Not loaded yet...",
        subjectPerson: null,
        status: 'loading...',
        selectedFramework: null,
        selectedCompetency: null,
        selectedResource: null,
        selectedJobPosting: null
    },
    mutations: {
        setAssertions(state, as) {
            state.assertions = as;
        },
        addAssertion(state, a) {
            if (state.assertions == null) {
                state.assertions = [];
            }
            for (var i = 0; i < state.assertions.length; i++) {
                if (state.assertions[i].isId(a.shortId())) {
                    state.assertions.splice(i, 1);
                }
            }
            state.assertions.push(a);
            EcArray.setAdd(state.assertions, a);
            a.getAssertionDateAsync(function(date) {
                a.assertionDateDecrypted = date;
                state.assertions.sort(function(a, b) {
                    return b.assertionDateDecrypted - a.assertionDateDecrypted;
                });
            }, console.error);
            app.saveAssertionToIndexedDb(a);
            state.assertionsChanges++;
        },
        creativeWorks(state, obj) {
            if (state.creativeWorks == null) {
                state.creativeWorks = {};
            }
            state.creativeWorks[obj.url] = obj.resources;
            state.creativeWorksChanges++;
        },
        addCreativeWork(state, a) {
            if (state.creativeWorks == null) {
                state.creativeWorks = {};
            }
            if (a.educationalAlignment != null) {
                if (a.educationalAlignment.targetUrl != null) {
                    if (state.creativeWorks[a.educationalAlignment.targetUrl] == null) {
                        state.creativeWorks[a.educationalAlignment.targetUrl] = [];
                    }
                    EcArray.setAdd(state.creativeWorks[a.educationalAlignment.targetUrl], a);
                }
            }
            state.creativeWorksChanges++;
        },
        login(state) { state.login = true; },
        me(state, pk) { state.me = pk; },
        badgePk(state, pk) { state.badgePk = pk; },
        frameworks(state, frameworks) { state.frameworks = frameworks; },
        frameworkSearch(state, search) { state.frameworkSearch = search; },
        jobPostings(state, jobPostings) { state.jobPostings = jobPostings; },
        jobPostingsSearch(state, jobPostingsSearch) { state.jobPostingsSearch = jobPostingsSearch; },
        people(state, people) { state.people = people; },
        mePerson(state, person) { state.mePerson = person; },
        processing(state, processing) { state.processing = processing; },
        processingMessage(state, processingMessage) { state.processingMessage = processingMessage; },
        subject(state, pk) { state.subject = pk; },
        subjectPerson(state, person) { state.subjectPerson = person; },
        selectedFramework(state, framework) {
            state.selectedFramework = framework;
            localStorage.selectedFramework = framework.shortId();
        },
        selectedCompetency(state, competency) {
            state.selectedCompetency = competency;
            if (competency != null) {
                localStorage.selectedCompetency = competency.shortId();
            } else {
                localStorage.selectedCompetency = null;
            }
            state.availableResources = null;
        },
        selectedJobPosting(state, jobPosting) {
            state.selectedJobPosting = jobPosting;
            if (jobPosting != null) {
                localStorage.selectedJobPosting = jobPosting.shortId();
            } else {
                localStorage.selectedJobPosting = null;
            }
        },
        collapseState(state, uri, b) { state.collapseState[uri] = b; },
        removeFromAll(state, uri) {
            for (var i = 0; i < state.assertions.length; i++) {
                if (state.assertions[i].isId(uri)) {
                    state.assertions.splice(i, 1);
                }
            }
            for (var key in state.creativeWorks) {
                for (var i = 0; i < state.creativeWorks[key].length; i++) {
                    if (state.creativeWorks[key][i].isId(uri)) {
                        state.creativeWorks[key].splice(i, 1);
                    }
                }
            }
        }
    },
    actions: {
        setAssertions: function(context, assertions) { context.commit('assertions', assertions); }
    }
});
