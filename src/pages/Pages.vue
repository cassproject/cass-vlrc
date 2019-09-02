<template>
    <div id="pages" class>
        <!-- nav bar navigation -->
        <nav class="navbar is-info is-fixed-top" role="navigation" aria-label=" main-navigation">
            <div class="navbar-brand">
                <a class="navbar-item">
                    <img class="has-text-white" />
                </a>

                <a
                    role="button"
                    class="navbar-burger burger"
                    :class="{ 'is-active': navBarActive}"
                    aria-label="menu"
                    aria-expanded="false"
                    data-target="artPagesDropDown"
                    @click="navBarActive = !navBarActive"
                >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>
            </div>
            <!-- nav bar tablet and mobile drop down side navigation -->
            <div
                id="artPagesDropDown"
                class="navbar-menu is-spaced"
                :class="{ 'is-active': navBarActive}"
            >
                <div class="navbar-end">
                    <div
                        class="navbar-item has-dropdown is-hidden-desktop"
                        :class="{ 'is-active': navBarActive}"
                    >
                        <div class="section is-spaced">
                            <h4 class="subtitle is-4 navbar-item">Pages</h4>
                            <span v-for="navItem in navItems" :key="navItem.title">
                                <router-link :to="navItem.action">{{navItem.title}}</router-link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        <!-- right side of page -->
        <!--<div class="section">-->
        <!-- desktop side navigation -->
        <aside class="menu is-info has-background-light is-hidden-touch">
            <div class="section">
                <ul class="menu-list">
                    <li v-for="navItem in navItems" :key="navItem.title">
                        <router-link :to="navItem.action">{{navItem.title}}</router-link>
                    </li>
                </ul>
            </div>
        </aside>
        <div class="section">
            <div class="columns is-multiline is-dekstop is-centered">
                <!-- right page content column -->
                <div class="column is-full pagesRight">
                    <div class="section" id="pagesSection">
                        <router-view/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>

.buttons {
    display: flex;
    align-items: center;
    flex-direction: row;
    flex-flow: wrap;
}

.buttons span {
    display: flex;
    align-items: center;
    flex-direction: row;
}

.buttons ul {
    width:100%;
}

.buttons button {
    display: flex;
    align-items: center;
    width: 6.2rem;
    padding-right: .25rem;
}

.buttons button.wider {
    width: 8rem;
}

.buttons button i {
    padding: .5rem;
    padding-left: .25rem;
}

.btop {
    border-top: 1px lightgray solid;
}

.bbottom {
    border-bottom: 1px lightgray solid;
}

.ptop {
    padding-top: .5rem;
}

.pbottom {
    padding-bottom: .5rem;
}
.fright {
    justify-content: flex-end;
}

.noptop {
    padding-top: 0rem;
}

.nopbottom {
    padding-bottom: 0rem;
}

.nomtop {
    margin-top: 0rem;
}

.nombottom {
    margin-bottom: 0rem;
}

#pagesSection {
    display: flex;
    flex-direction: row;
    justify-content:center;
}
ul,
li {
    list-style: none;
}


ul ul {
    margin-left: 1.5rem;
}

.selected {
    color: green;
}

.tile {
    border: 1px gray solid;
    background-color: white;
    border-radius: .25rem;
    margin-top: .25rem;
    padding: .75rem;
    flex-direction:column;
}

.antitile {
    border: 0px gray solid;
    background-color: #f5f5f5;
    border-radius: .25rem;
    padding: .25rem;
    margin-top: .50rem;
    margin-bottom: .50rem;
}

input.antitile {
    border: 1px gray solid;
    background-color: #f5f5f5;
    border-radius: .5rem;
    padding: .50rem .75rem;
    margin-top: .50rem;
    margin-bottom: .50rem;
}

</style>
<style lang="scss" scoped>
#pages {
    min-height: calc(100vh - 28px);
}
.pagesLeft li {
    border-bottom: 0.25px black solid;
    padding-bottom: 0.25rem;
    padding-top: 0.25rem;
}

.is-disabled {
    color: grey !important;
    cursor: none;
}

.pagesRight {
    //height: calc(100vh - 4rem);
    //max-height: calc(100vh - 4rem);
    width: 100%;
    max-width: 1400px;
}
.menu {
    min-height: calc(100vh - 40px);
    z-index: 1;
    width: 360px;
    position: fixed;
    left:0px;
    top: 52px;
    a {
        cursor: pointer;
    }
    .menu-item {
        padding: 1rem;
    }
}
.navbar {
    max-width: 100vw;
}
</style>
<script>
import {mapState} from 'vuex';
export default {
    name: "Pages",
    props: {},
    computed: mapState({
        me: "me",
        contacts: "contacts",
        assertions: "assertions"
    }),
    components: {
    },
    created: function() {
        var me = this;
    },
    methods: {
    },
    watch: {
        page: function(newPage) {
            localStorage.pagesPage = newPage;
        },
        me: function(newMe, oldMe) {
            this.searchForAssertions(5000);
        },
        inputUrl: function(newUrl) {
            /*
             * $.ajax("https://api.algorithmia.com/v1/web/algo/outofstep/MegaAnalyzeURL/0.1.6", {
             *     'data': "\"" + newUrl + "\"",
             *     'type': 'POST',
             *     'processData': false,
             *     'contentType': 'application/json',
             *     beforeSend: function(xhr) {
             *         xhr.setRequestHeader("Authorization", "Simple simnxB3dwTN8kds9p6SGMpGoOJC1");
             *     },
             *     success: function(success) {
             *         app.inputName = success.result.metadata.title;
             *         app.inputDescription = success.result.summary;
             *     }
             * });
             */
        },
        subject: function(newSubject) {
            var pk = EcPk.fromPem(newSubject);
            var me = this;
            EcRepository.get(window.repo.selectedServer + "data/" + pk.fingerprint(), function(person) {
                var e = new EcEncryptedValue();
                if (person.isAny(e.getTypes())) {
                    e.copyFrom(person);
                    e.decryptIntoObjectAsync(function(person) {
                        var p = new Person();
                        p.copyFrom(person);
                        if (p.name != null) {
                            me.subjectName = p.name;
                        } else if (p.givenName != null && p.familyName != null) {
                            me.subjectName = p.givenName + " " + p.familyName;
                        } else if (p.givenName != null) {
                            me.subjectName = p.givenName;
                        } else {
                            me.subjectName = "Unknown Subject.";
                        }
                    }, console.error);
                } else {
                    var p = new Person();
                    p.copyFrom(person);
                    if (p.name != null) {
                        me.subjectName = p.name;
                    } else if (p.givenName != null && p.familyName != null) {
                        me.subjectName = p.givenName + " " + p.familyName;
                    } else if (p.givenName != null) {
                        me.subjectName = p.givenName;
                    } else {
                        me.subjectName = "Unknown Subject.";
                    }
                }
            }, function(failure) {
                me.subjectName = "Unknown Subject.";
            });
        }
    },
    data: function() {
        return {
            page: localStorage.pagesPage,
            navBarActive: false,
            navItems: [
                {
                    title: "Timeline",
                    action: "/",
                    tasks: "",
                    icon: "mdi-timeline-text",
                    disabled: false
                },
                {
                    title: "Subject Areas",
                    action: "frameworks",
                    tasks: "",
                    icon: "mdi-book-open-page-variant",
                    disabled: false
                },
                {
                    title: "Topic Area",
                    action: "framework",
                    tasks: "",
                    icon: "mdi-book-open",
                    disabled: false
                },
                {
                    title: "Learning Resources",
                    action: "resources",
                    tasks: "",
                    icon: "mdi-file",
                    disabled: false
                },
                {
                    title: "My Goals",
                    action: "goals",
                    tasks: "",
                    icon: "mdi-bullseye",
                    disabled: false
                },

                {
                    title: "My Contacts",
                    action: "profiles",
                    tasks: "",
                    icon: "mdi-account-group",
                    disabled: false
                },
                {
                    title: "Find People",
                    action: "people",
                    tasks: "",
                    icon: "mdi-account-search",
                    disabled: false
                },
                {
                    title: "Jobs, Gigs, Positions",
                    action: "jobPostings",
                    tasks: "",
                    icon: "mdi-briefcase",
                    disabled: false
                }
            ]
        };
    }
};
</script>

