<template>
  <div id="app" >

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
  mounted () {
    //Работает в IE 11
    let self =this;
    function loadJSON(callback) {
      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', 'chart_data.json', true); // Replace 'my_data' with the path to your file
      xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
      };
      xobj.send(null);
    }

    loadJSON(function(response) {
      // Parse JSON string into object
      self.charts = JSON.parse(response);
    });


    // if(fetch){
    //   fetch('chart_data.json')
    //           .then(response => response.json() )
    //           .then(data=>  this.charts = data )
    //           .catch( alert );
    //
    //   console.log('есть fetch');
    // }else{
    //   console.log('нету fetch');
    // }

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
