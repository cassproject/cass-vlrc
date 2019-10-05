<template>
    <div>
    <input type="text" class="frameworksSearchInput" placeholder="Search for people..." v-model="search"/>
    <ul v-if="people" >
        <profile v-for="item in people" :key="item.id" :pk="item.owner[0]" :displayName="item.getName()" :onClick="changeSelected"></profile>
    </ul>
    <div v-if="people != null && people.length == 0"><br>None found...</div>
    <div v-if="people == null"><br>Loading People...</div>
    </div>
</template>
<script>
import profile from "@/controls/profile.vue";
export default {
    props: [],
    components: {profile},
    data: function() {
        return {
            search: ""
        };
    },
    computed: {
        people: {
            get: function() {
                var ppl = this.$store.state.people;
                if (ppl == null) return null;
                var results = [];
                for (var i = 0; i < ppl.length; i++) {
                    if (ppl[i].owner == null || ppl[i].length === 0) { continue; }
                    if (EcPk.fromPem(ppl[i].owner[0]).fingerprint() !== ppl[i].getGuid()) { continue; }
                    if (ppl[i].getName() == null) { continue; }
                    if (this.search === "" || ppl[i].getName().toLowerCase().indexOf(this.search.toLowerCase()) !== -1) { results.push(ppl[i]); }
                }
                return results;
            }
        }
    },
    created: function() {
        var me = this;
        EcPerson.search(repo, "*", function(people) {
            for (var i = 0; i < people.length; i++) {
                if (people[i].owner == null || people[i].length === 0) {
                    people.splice(i, 1);
                } else if (EcPk.fromPem(people[i].owner[0]).fingerprint() !== people[i].getGuid()) {
                    people.splice(i, 1);
                }
            }
            me.$store.commit("people", people);
        }, console.error, {
            size: 5000
        });
    },
    watch: {
        search: function(newSearch) {
            this.$recompute("people");
        }
    },
    methods: {
        changeSelected: function(pk) {
            app.subject = pk;
            $("#rad2").click();
        }
    }
};
</script>