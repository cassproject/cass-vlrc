<template>
    <div class="page">
        <profile :pk="subject"></profile>
        <jobPostings></jobPostings>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
import jobPostings from "@/controls/jobPostings.vue";
export default {
    name: "JobPostingsPage",
    props: {subject: null},
    components: {profile, jobPostings}
};
</script>