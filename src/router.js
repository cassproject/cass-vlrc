import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    mode: 'history',
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'timeline',
            component: () => import(/* webpackChunkName: "timelinePage" */ './pages/0Timeline.vue')
        },
        {
            path: '/frameworks',
            name: 'frameworks',
            component: () => import(/* webpackChunkName: "frameworksPage" */ './pages/1FrameworksPage.vue')
        },
        {
            path: '/framework',
            name: 'framework',
            component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/2FrameworkPage.vue')
        },
        {
            path: '/resources',
            name: 'resources',
            component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/3ResourcesPage.vue')
        },
        {
            path: '/goals',
            name: 'goals',
            component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/4GoalsPage.vue')
        },
        {
            path: '/profiles',
            name: 'profiles',
            component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/5ProfilesPage.vue')
        },
        {
            path: '/people',
            name: 'people',
            component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/6PeoplePage.vue')
        }
        // ,
        // {
        //     path: '/jobPostings',
        //     name: 'jobPostings',
        //     component: () => import(/* webpackChunkName: "frameworkPage" */ './pages/7JobPostingsPage.vue')
        // }
    ]
});
