<template>
  <div id="app">

    <div class="night-mode">
    <p v-if="isNight"   @click="isNight=!isNight">Switch to Day Mode </p>
    <p v-else    @click="isNight=!isNight">Switch to Night Mode </p>
    </div>

    <ul class="select-chart">
      <li v-for="(chart,index) in charts"   :key="index" >
        <p  class="number">Chart№{{index+1}}</p>
        <chart-canvas
                :chart = chart
                :isNight = isNight
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
      isNight: false,  // флаг для перехода в ночной режим и обратно
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
 .night-mode{
   text-align: center;
   color: #36a8f1 ;
   font: bold italic 2.5rem sans-serif;
   cursor: pointer;
 }

 .number{
   color: #36a8f1 ;
   font: bold italic 1.5rem sans-serif;
   margin-left: 2%;

 }

</style>
