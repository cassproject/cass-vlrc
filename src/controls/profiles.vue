<template>
    <div>
    <ul>
        <span v-if="identities">
            <profile
                v-for="item in identities"
                v-bind:key="item.ppk.toPk().toPem()"
                :pk="item.ppk.toPk().toPem()"
                :displayName="item.displayName"
                :onClick="changeSelected"/>
        </span>
        <span v-if="profiles">
            <profile v-for="item in profiles" v-bind:key="item.pk.toPem()" :pk="item.pk.toPem()" :displayName="item.displayName" :onClick="changeSelected"/>
        </span>
        <span v-if="none">
            None found.
        </span>
    </ul>
    </div>
</template>
<script>

import profile from "@/controls/profile.vue";
export default {
    props: ['profiles', 'identities'],
    data: function() {
        return {};
    },
    components: {profile},
    computed: {
        none: function() {
            if (this.profiles == null || this.profiles.length === 0) {
                if (this.identities == null || this.identities.length === 0) {
                    return true;
                }
            }
            return false;
        }
    },
    methods: {
        changeSelected: function(pk) {
            app.subject = pk;
            // $("#rad2").click();
        }
    }
};
</script>