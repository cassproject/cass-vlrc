<template>

            <div id="div8" class="page" style="display:none;">
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
    props: {selectedJobPosting, subject, profiles, identities},
    components: {profile, jobPostingDetail, profiles}
};
</script>