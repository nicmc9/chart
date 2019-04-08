<template>
  <div id="app" >

    <div class="night-mode">
    <p v-if="isNight"   @click="isNight=!isNight">Switch to Day Mode </p>
    <p v-else    @click="isNight=!isNight">Switch to Night Mode </p>
    </div>


    <ul class="select-chart">
      <li>
        <line-chart
                :isNight =  isNight
                :mainHeight  = mainHeight
                :prevWidth  = prevWidth
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
      }
  },
  computed: {
    mainHeight: function (){
      if(this.hWindow > this.prevWidth){
        return  Math.round(this.hWindow*0.4);
      }else {
        return  Math.round(this.hWindow*0.8);
      }
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
