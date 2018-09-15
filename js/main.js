var repo = new EcRepository();
repo.selectedServer = "https://dev.cassproject.org/api/"; 
EcRepository.caching = true;
Vue.component('framework',{
  props: ['uri'],
  computed: {
    competency:{
      get:function(){
        var r = {};
        var top = {};
        var f = EcFramework.getBlocking(this.uri);
        if (f == null || f.competency == null) return r;
        for (var i = 0;i < f.competency.length;i++)
        {
          var c = EcCompetency.getBlocking(f.competency[i]);
          if (c != null)
          r[c.shortId()]=top[c.shortId()]=c;
        }
        for (var i = 0;i < f.relation.length;i++)
        {
          var a = EcAlignment.getBlocking(f.relation[i]);
          if (a != null)
          {
            if (a.relationType==Relation.NARROWS)
            {
              if (r[a.target] == null) continue;
              if (r[a.target].hasChild == null)
                r[a.target].hasChild = [];
              r[a.target].hasChild.push(r[a.source]);
              delete top[a.source];
            }
          }
        }
        console.log(top);
        return top;
      }
    },
    name: function () {
      if (this.uri == null)
        return "N/A";
      return EcFramework.getBlocking(this.uri).getName();
    },
    description: function() {
      if (this.uri == null)
        return null;
      return EcFramework.getBlocking(this.uri).getDescription();
    }
  },
  template: '<div>'+
    '<div>{{ name }}<small v-if="description" class="block">{{ description }}</small></div>'+
    '<ul><competency v-for="item in competency" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul></div>'
});

Vue.component('competency',{
  props: ['uri','hasChild'],
  computed:{
    name:{
      get:function(){
        if (this.uri == null) return null;
        return EcCompetency.getBlocking(this.uri).getName();
      }
    },
    description:{
      get:function(){
        if (this.uri == null) return null;
        return EcCompetency.getBlocking(this.uri).getDescription();
      }
    },
  },
  template: '<li><span>{{ name }}</span><small v-if="description" class="block">{{ description }}</small>'+
  '<ul><competency v-for="item in hasChild" v-bind:key="item.id" :uri="item.id" :hasChild="item.hasChild"></competency></ul></div>'
+'</li>'
});

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    login: false,
    status: 'loading...',
    selectedFramework: ''
  }
});
