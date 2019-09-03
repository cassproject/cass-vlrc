<template>
    <div class="page">
        <h1>Select a contact</h1>
        <p>This page allows you to switch your focus from yourself to others.</p>
        <hr>
        <h3>Selected:</h3>
        <profile :pk="this.$store.state.subject"></profile>
        <h3>My Identities:</h3>
        <profiles :identities="this.$store.state.identities"></profiles>
        <h3>Contacts:</h3>
        <profiles :profiles="this.$store.state.profiles"></profiles>
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