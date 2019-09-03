<template>
    <div class="page" >
        <div v-if="selectedCompetency">
            <profile :pk="me"></profile>
            <div>
                <h4>The following resources exist for:</h4>
                <competency :uri="selectedCompetency.shortId()" :subject="me"/>
            </div>

            <hr>
            <resources :url="selectedCompetency.shortId()"></resources>
            <hr>
            <!--<div>You have the following history:</div>
                <history></history>
                <hr>-->
            <button v-on:click="searchGoogle">Search for additional resources on Google.</button>
            <hr>
            <h3>Add a resource</h3>
            <label for="inputUrl">URL: </label><input type="text" id="inputUrl" v-model="inputUrl"
                                                        placeholder="Url"/><br>
            <label for="inputName">Name: </label><input type="text" id="inputName" v-model="inputName"
                                                        placeholder="Name of Resource"/><br>
            <label for="inputDescription">Description: </label><textarea id="inputDescription"
                                                                            v-model="inputDescription"
                                                                            placeholder="Description of Resource"></textarea><br>
            <button style="float:right;" v-on:click="addResource">Add Resource</button>
        </div>
        <div v-else>No topic has been selected.</div>
    </div>
</template>
<style scoped>

.resource {
    margin-bottom: .5rem;
}

textarea{
    border-radius:.25rem;
    width: 100%;
    padding: .25rem;
    margin: .25rem;
}
</style>
<script>
import profile from "@/controls/profile.vue";
import competency from "@/controls/competency.vue";
import resources from "@/controls/resources.vue";
export default {
    name: "ResourcesPage",
    props: {},
    computed: {
        selectedCompetency: function() {
            return this.$store.state.selectedCompetency;
        },
        me: function() {
            return this.$store.state.me;
        }
    },
    data: function() { return {inputUrl: null, inputName: null, inputDescription: null}; },
    components: {profile, competency, resources},
    methods: {
        searchGoogle: function() {
            window.open("https://google.com/search?q=" + this.selectedCompetency.getName(), "lernnit");
        },
        addResource: function() {
            var c = new CreativeWork();
            c.assignId(window.repo.selectedServer, EcCrypto.md5(this.inputUrl + this.selectedCompetency.shortId()));
            c.name = this.inputName;
            c.description = this.inputDescription;
            c.url = this.inputUrl;
            c.educationalAlignment = new AlignmentObject();
            c.educationalAlignment.targetUrl = this.selectedCompetency.shortId();
            c.educationalAlignment.alignmentType = "teaches";
            c.addOwner(EcIdentityManager.ids[0].ppk.toPk());
            EcRepository.save(c, console.log, console.error);
        }
    }
};
</script>