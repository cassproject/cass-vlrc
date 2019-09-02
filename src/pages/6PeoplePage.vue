<template>
    <div class="page">
        <people></people>
    </div>
</template>
<script>
import people from "@/controls/people.vue";
export default {
    name: "PeoplePage",
    props: {},
    components: {people}
};
</script>