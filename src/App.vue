<template>
  <div id="app" >

    <div class="night-mode">
    <p v-if="isNight"   @click="switchDayMode()">Switch to Day Mode </p>
    <p v-else    @click="switchDayMode()">Switch to Night Mode </p>
    </div>


    <ul class="select-chart">
      <li>
        <line-chart
                :isNight =  isNight
                :mainHeight  = mainHeight
                :prevWidth  = prevWidth
                :prevHeight  = prevHeight
                :prevShift  = prevShift
                :mainShift  = mainShift
                :mainCanvasHeight  = mainCanvasHeight
                :prevCanvasHeight = prevCanvasHeight
                :boxStop = boxStop
                :countLine = countLine
                ></line-chart>
      </li>


<!--        <li>-->
<!--            <line2-y-chart-->
<!--                    :isNight =  isNight-->
<!--                    :mainHeight  = mainHeight-->
<!--                    :prevWidth  = prevWidth-->
<!--                    :prevHeight  = prevHeight-->
<!--                    :prevShift  = prevShift-->
<!--                    :mainShift  = mainShift-->
<!--                    :mainCanvasHeight  = mainCanvasHeight-->
<!--                    :prevCanvasHeight = prevCanvasHeight-->
<!--                    :boxStop = boxStop-->
<!--                    :countLine = countLine-->
<!--            ></line2-y-chart>-->
<!--        </li>-->
<!--        <li>-->
<!--        <stacked-bar-chart-->

<!--                :isNight =  isNight-->
<!--                :mainHeight  = mainHeight-->
<!--                :prevWidth  = prevWidth-->
<!--                :prevHeight  = prevHeight-->
<!--                :prevShift  = prevShift-->
<!--                :mainShift  = mainShift-->
<!--                :mainCanvasHeight  = mainCanvasHeight-->
<!--                :prevCanvasHeight = prevCanvasHeight-->
<!--                :boxStop = boxStop-->
<!--                :countLine = countLine-->
<!--        ></stacked-bar-chart>-->

<!--      </li>-->

<!--      <li>-->
        <daily-bar-chart
                :isNight =  isNight
                :mainHeight  = mainHeight
                :prevWidth  = prevWidth
                :prevHeight  = prevHeight
                :prevShift  = prevShift
                :mainShift  = mainShift
                :mainCanvasHeight  = mainCanvasHeight
                :prevCanvasHeight = prevCanvasHeight
                :boxStop = boxStop
                :countLine = countLine
        ></daily-bar-chart>

<!--      </li>-->
<!--      <li>-->
<!--        <percent-chart-->
<!--                :isNight =  isNight-->
<!--                :mainHeight  = mainHeight-->
<!--                :prevWidth  = prevWidth-->
<!--                :prevHeight  = prevHeight-->
<!--                :prevShift  = prevShift-->
<!--                :mainShift  = mainShift-->
<!--                :mainCanvasHeight  = mainCanvasHeight-->
<!--                :prevCanvasHeight = prevCanvasHeight-->
<!--                :boxStop = boxStop-->
<!--                :countLine = countLine-->
<!--        ></percent-chart>-->

<!--      </li>-->
    </ul>

</div>

</template>

<script>


import BaseGraph from './components/BaseGraph.vue'
import LineChart from './components/LineChart.vue'
import Line2YChart from './components/Line2YChart.vue'
import DailyBarChart from './components/DailyBarChart.vue'
import StackedBarChart from './components/StackedBarChart.vue'
import PercentChart from './components/PercentChart.vue'


export default {
  data: function () {
    return{
      isNight: false,  // флаг для перехода в ночной режим и обратно
      hWindow:null,
      prevWidth:null,
      countLine: 5,  // соличество линий на главной
      }
  },
  computed: {
    mainHeight: function (){
      if(this.hWindow > this.prevWidth){
        return  Math.round(this.hWindow*0.4);
      }else {
        return  Math.round(this.hWindow*0.6);
      }
    },
    prevHeight: function (){
      return  Math.round(this.mainHeight*0.12);
    },
    prevShift:function(){
      return   this.prevHeight/10;
    },
    mainShift:function(){
      return   this.mainHeight/5;
    },
    mainCanvasHeight: function (){
      return this.mainHeight + this.mainShift;
    },
    prevCanvasHeight: function (){
      return this.prevHeight + this.prevShift;
    },

    boxStop:function (){
      return this.prevWidth*0.2;
    },

  },
  methods: {
      switchDayMode(){
        this.isNight = !this.isNight;

          if(this.isNight){
               document.body.style.backgroundColor = "#293647";
          }else{
              document.body.style.backgroundColor = "white";
          }
      },
    onResize() {
      this.hWindow = document.documentElement.clientHeight;
      this.prevWidth= Math.round(document.documentElement.clientWidth  * 0.9);

    }
  },
  created(){
    this.hWindow = document.documentElement.clientHeight;
    this.prevWidth= Math.round(document.documentElement.clientWidth  * 0.9);

  },

  mounted () {
    //Работает в IE 11
    let self =this;
    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    // Unregister the event listener before destroying this Vue instance
    window.removeEventListener('resize', this.onResize);
  },
  name: 'app',
  components: {
    BaseGraph,
    LineChart,
    Line2YChart,
    DailyBarChart,
    StackedBarChart,
    PercentChart
  }
}
</script>

<style scoped>


 .select-chart{
   list-style: none;
   padding: 0;
   margin: auto;
  }
 .night-mode{

   text-align: center;
   color: #36a8f1 ;
   font: bold italic 2rem sans-serif;
   cursor: pointer;
 }

 .number{
   color: #36a8f1 ;
   font: bold italic 1.5rem sans-serif;
   margin-left: 2%;

 }

</style>
