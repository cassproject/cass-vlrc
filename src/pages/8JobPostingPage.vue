<template>
    <div class="page">
        <profile :pk="subject"></profile>
        <jobPostingDetail :uri="selectedJobPosting" :subject="subject"></jobPostingDetail>
        <hr>
        <h3>Select a contact to compare them against the posting.</h3>
        <profiles :profiles="profiles" :identities="identities"></profiles>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
import jobPostingDetail from "@/controls/jobPostingDetail.vue";
import profiles from "@/controls/profiles.vue";
export default {
    name: "jobPostingPage",
    props: {},
    components: {profile, jobPostingDetail, profiles},
    computed: {
        subject: function() {
            return this.$store.state.subject;
        },
        selectedJobPosting: function() {
            if (this.$store.state.selectedJobPosting != null)
                return this.$store.state.selectedJobPosting.shortId();
            return null;
        },
        profiles: function() {
            return this.$store.state.profiles;
        },
        identities: function() {
            return this.$store.state.identities;
        }
    }
};
</script>