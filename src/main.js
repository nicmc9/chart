import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false;
Vue.mixin({
  data: function () {
    return {

    }
  },
  methods:{
    setFilteredData(newGraph,columns){
      let yArray =[];
      this.filteredData=[];
      this.filteredData.push(columns[0]);

      for(let i = 1; i <columns.length;i++){
        yArray = columns[i];
        if(newGraph.indexOf(yArray[0]) === -1){
          continue;
        }
        this.filteredData.push(yArray);
      }
      console.log('this.filteredData',this.filteredData);
      console.log('newGraph',newGraph);
    },
    setInit(columns){

      this.filteredData=columns;
      console.log('this.filteredData',this.filteredData);

    },

  }
});


new Vue({
  render: h => h(App),
}).$mount('#app');
