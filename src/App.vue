<template>
  <div id="app" >

    <div class="night-mode">
    <p v-if="isNight"   @click="isNight=!isNight">Switch to Day Mode </p>
    <p v-else    @click="isNight=!isNight">Switch to Night Mode </p>
    </div>


    <ul class="select-chart">
      <li>
        <line-chart
                 path = "contest/1"
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

      <li>
        <line-chart
                 path = "contest/2"
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

    </ul>

</div>

</template>

<script>
import LineChart from './components/LineChart.vue'

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
    LineChart
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
   font: bold italic 2rem sans-serif;
   cursor: pointer;
 }

 .number{
   color: #36a8f1 ;
   font: bold italic 1.5rem sans-serif;
   margin-left: 2%;

 }

</style>
