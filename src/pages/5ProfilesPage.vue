<template>
    <div class="page">
        <h1>Selected:</h1>
        <profile :pk="subject"></profile>
        <hr>
        <h1>Contacts:</h1>
        <profiles :profiles="profiles" :identities="identities"></profiles>
    </div>
</template>
<script>
import profiles from "@/controls/profiles.vue";
import profile from "@/controls/profile.vue";
export default {
    name: "ProfilesPage",
    props: {subject: null, profiles: null, identities: null},
    components: {profile, profiles}
};
</script>