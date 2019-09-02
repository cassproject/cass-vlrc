<template>
    <div>
    <ul v-if="goals">
    <framework v-for="item in goals"
    v-bind:key="item.itemOffered.serviceOutput.competency"
    :uri="item.itemOffered.serviceOutput.framework"
    :subject="pk" :subjectperson="person" :competencyUri="item.itemOffered.serviceOutput.competency"></framework>
    </ul>
    <div v-else><br>You don&rsquo;t have any goals specified. Please browse subjects and mark one as a goal to see it here.</div>
    </div>
</template>
<script>
import framework from "@/controls/framework.vue";
export default {
    props: ['pk', 'person'],
    components: {framework},
    data: function() {
        return {
        };
    },
    computed: {
        goals: {
            get: function() {
                if (this.person == null) return null;
                if (this.person.seeks == null) { return null; }
                if (this.person.seeks.length === 0) { return null; }
                return this.person.seeks;
            }
        }
    }
};
</script>