<template>
    <div class="page">
        <profile v-if="subject" :pk="subject"></profile>
        <framework id="leftFramework" v-if="selectedFramework" :uri="selectedFramework.id"
                    :subjectperson="subjectPerson" :subject="subject"></framework>
        <div v-else>No subject has been selected.</div>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
import framework from "@/controls/framework.vue";
export default {
    name: "FrameworkPage",
    props: {},
    computed: {
        subject: function() {
            return this.$store.state.subject;
        },
        selectedFramework: function() {
            return this.$store.state.selectedFramework;
        },
        subjectPerson: function() {
            return this.$store.state.subjectPerson;
        }
    },
    components: {profile, framework}
};
</script>