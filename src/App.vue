<template>
  <div id="app" >

    <div class="night-mode">
    <p v-if="isNight"   @click="isNight=!isNight">Switch to Day Mode </p>
    <p v-else    @click="isNight=!isNight">Switch to Night Mode </p>
    </div>

    <P >hWindow {{hWindow}}   --- wWindow {{wWindow}} </P>
    <ul class="select-chart">
      <li v-for="(chart,index) in charts"   :key="index" >
        <p  class="number">Chart№{{index+1}}</p>
        <chart-canvas
                :chart = chart
                :isNight = isNight
                :hWindow  = hWindow
                :wWindow  = wWindow
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
      hWindow:null,
      wWindow:null
     }
  },
  methods: {
    onResize() {
       this.hWindow = document.documentElement.clientHeight;
       this.wWindow = document.documentElement.clientWidth;

    }
  },
  created(){
    this.hWindow = document.documentElement.clientHeight;
    this.wWindow = document.documentElement.clientWidth;

  },

  mounted () {
    //Работает в IE 11
    let self =this;

    window.addEventListener('resize', this.onResize);

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

      // fetch('chart_data.json')
      //         .then(response => response.json() )
      //         .then(data=>  this.charts = data )
      //         .catch( alert );



      loadJSON(function(response) {
        // Parse JSON string into object
        self.charts = JSON.parse(response);

      });


  },

  beforeDestroy() {
    // Unregister the event listener before destroying this Vue instance
    window.removeEventListener('resize', this.onResize);
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
   padding: 0;
   /*padding-left: 30px;*/
   /*padding-right: 30px;*/
   margin: auto;
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
