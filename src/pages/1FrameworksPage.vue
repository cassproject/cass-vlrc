<template>
    <div class="page">
        <profile v-if="subject" :pk="subject"></profile>
        <frameworks/>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
import frameworks from "@/controls/frameworks.vue";
export default {
    name: "FrameworksPage",
    props: {},
    computed: {
        subject: function() {
            return this.$store.state.subject;
        }
    },
    components: {profile, frameworks}
};
</script>