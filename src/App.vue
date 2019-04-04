<template>
  <div id="app">

    <ul class="select-chart">
      <li v-for="(chart,index) in charts"   :key="index" >
        <chart-canvas
                :chart = chart
        ></chart-canvas>

      </li>

    </ul>

</div>

</template>

<script>
import ChartCanvas from './components/ChartCanvas.vue'

export default {
  data: function () {
    return{
      charts:[],
     }
  },

  created () {
    fetch('chart_data.json')
            .then(response => response.json() )
            .then(data=>  this.charts = data )
            .catch( alert );

  },
  name: 'app',
  components: {
    ChartCanvas
  }
}
</script>

<style scoped>

 .select-chart{
   list-style: none;

  }


</style>
