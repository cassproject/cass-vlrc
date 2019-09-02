import Vue from 'vue';
import Vuex from 'vuex';
import router from './router';
import {store} from './store';
import App from './App.vue';
import Pages from "@/pages/Pages.vue";
import VueObserveVisibility from 'vue-observe-visibility';
import '@mdi/font/css/materialdesignicons.css'; // Ensure you are using css-loader


require("cassproject");

Vue.use(Vuex);
Vue.use(VueObserveVisibility);

Vue.config.productionTip = false;

new Vue({
    router,
    components: {Pages},
    store,
    render: h => h(App)
}).$mount('#app');
