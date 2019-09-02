<template>
    <div class="page">
        <profile :pk="this.$store.state.me"></profile>
        <goals :pk="this.$store.state.me" :person="this.$store.state.mePerson"></goals>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
import goals from "@/controls/goals.vue";
export default {
    name: "GoalsPage",
    props: {},
    components: {profile, goals}
};
</script>