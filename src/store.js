import Vue from 'vue';
import Vuex from 'vuex';

require("cassproject");

Vue.use(Vuex);

export const store = new Vuex.Store({
    state: {
        login: false,
        subject: null,
        subjectName: "Not loaded yet...",
        subjectPerson: null,
        me: null,
        mePerson: null,
        status: 'loading...',
        selectedFramework: null,
        selectedCompetency: null,
        selectedResource: null,
        selectedJobPosting: null,
        profiles: EcIdentityManager.contacts,
        inputUrl: "",
        inputName: "",
        inputDescription: "",
        processing: false,
        processingMessage: "",
        assertions: null,
        assertionsChanges: 0,
        creativeWorks: {},
        creativeWorksChanges: 0,
        jobPostings: null,
        people: null,
        collapseState: {}
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
        subject(state, pk) { state.subject = pk; },
        selectedFramework(state, framework) {
            state.selectedFramework = framework;
            localStorage.selectedFramework = framework.shortId();
        },
        selectedCompetency(state, competency) {
            state.selectedCompetency = competency;
            localStorage.selectedCompetency = competency.shortId();
            state.availableResources = null;
        },
        collapseState(state, uri, b) { state.collapseState[uri] = b; },
        removeFromAll(state, uri) {
            for (var i = 0; i < state.assertions.length; i++) {
                if (state.assertions[i].isId(uri)) {
                    state.assertions.splice(i, 1);
                }
            }
            for (var i = 0; i < state.creativeWorks.length; i++) {
                if (state.creativeWorks[i].isId(uri)) {
                    state.creativeWorks.splice(i, 1);
                }
            }
        }
    },
    actions: {
        setAssertions: function(context, assertions) { context.commit('assertions', assertions); }
    }
});
