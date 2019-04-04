<template>
  <div id="app">
    <h4>Select a chart please: </h4>
    <label>
      <select class="select-chart" v-model="currentChart">
        <option v-for="(chart,index) in charts"   :key="index"  :value="chart" >
          Chart № {{index+1}}
        </option>
      </select>

    </label>

    <br>

    <template v-if="currentChart">
      <chart-canvas
              :chart = currentChart
      ></chart-canvas>
    </template>
  </div>
</template>

<script>
import ChartCanvas from './components/ChartCanvas.vue'

export default {
  data: function () {
    return{
      charts:[],
      currentChart:0
    }
  },
  methods:{
    init(data){
      this.charts = data;
      this.currentChart = this.charts[0];
    }

  },

  created () {
    fetch('chart_data.json')
            .then(response => response.json() )
            .then(data=>this.init(data) )
            .catch( alert );

  },
  name: 'app',
  components: {
    ChartCanvas
  }
}
</script>


