<template>
    <div>
        <h3>Timeline</h3>
        <div class="timeline" v-if="assertions">
        <timelineElement v-for="item in assertions" v-bind:key="item.id" :uri="item.id"></timelineElement>
        <span v-if="assertions.length == 0">None.</span>
        </div>
        <div v-else><br>Loading Timeline...</div>
    </div>
</template>
<style scoped>

.timeline {
    padding: 10px 0px;
    position: relative;
    background-color: inherit;
}

.timeline::before {
    content: '';
    position: absolute;
    width: 6px;
    background-color: black;
    top: 0rem;
    bottom: 0;
    margin-left: 3.9rem;
}

</style>
<script>
import timelineElement from "@/controls/timelineElement.vue";
export default {
    name: "timeline",
    props: [],
    components: {timelineElement},
    data: function() {
        return {
            searched: false
        };
    },
    computed: {
        assertions: {
            get: function() {
                return this.$store.state.assertions;
            }
        }
    },
    created: function() {},
    watch: {},
    methods: {}
};
</script>