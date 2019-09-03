<template>
    <div class="page">
        <profile v-if="me" :pk="me"></profile>
        <timeline/>
    </div>
</template>

<script>
import profile from "@/controls/profile.vue";
import timeline from "@/controls/timeline.vue";
export default {
    name: "TimelinePage",
    props: {},
    computed: {
        me: function() {
            return this.$store.state.me;
        }
    },
    components: {profile, timeline}
};
</script>