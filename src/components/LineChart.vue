<template>

    <div>
        <base-graph
                nameChart ="LineChart"
                path = "/contest/1/"
                :prevWidth = "prevWidth"
                :mainCanvasHeight = "mainCanvasHeight"
                :prevCanvasHeight = "prevCanvasHeight"
                :isNight =  "isNight"
                :mainHeight  = "mainHeight"
                :prevHeight  = "prevHeight"
                :prevShift  = "prevShift"
                :mainShift  = "mainShift"
                :boxStop = "boxStop"
                :countLine = "countLine"

                :previewCoord="previewCoord"
                :mainCoord = "mainCoord"
                :arrayForMainCoords = "arrayForMainCoords"
                :step = "step"
                :metric1YValue="metric1YValue"

                v-on:base-percent-data="basePercentData"
                v-on:set-main-data="setCurrentMainData"
                v-on:set-active-graph="setFilteredData"

        ></base-graph>

    </div>


</template>

<script>
    import BaseGraph from './BaseGraph.vue'
    export default {
        props: {
            isNight:Boolean,
            mainHeight:Number,
            prevWidth:Number,
            prevHeight:Number,
            prevShift:Number,
            mainShift:Number,
            mainCanvasHeight:Number,
            prevCanvasHeight:Number,
            boxStop:Number,
            countLine:Number,
        },
        data: function () {
            return {

                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                arrayForMainCoords:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                step:0,  // шаг для координаты х на главном холсте
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                mainCoord:[],
                filteredData:[],
                maxValue:1,

            }
        },


        computed: {
            metric1YValue: function () {
                let val = this.maxValue/this.countLine-1;  //this.countLine-1
                return Math.ceil(val);
            },
       },

        methods: {

/////////////////////////  draw() /////////////////////////////////////////
            getArrayForMainCoords(columns,start,end){
                let tempArray =[];
                let data =[];
                let yArray =[];

                for(let i = 0; i < columns.length;i++ ) {
                    yArray  = columns[i];
                    tempArray = yArray.slice(start,end);
                    data.push(tempArray);
                }
                console.log('data',data);
                this.step =    this.prevWidth/(tempArray.length-1);
                return data;

            },

            getRatio(height,data,init){
                let maxArray=[];
                //Пропускаем первый элемент массива содержащий даты
                for(let i = 1; i < data.length;i++ ) {
                    let y =data[i];

                    if (init === 1) {
                        let temp = y[0];
                        y[0] = 0;  //MAth.max работает только с цифрами
                        maxArray.push(Math.max.apply(null, y));
                        y[0] = temp;

                    } else {
                        maxArray.push(Math.max.apply(null, y));
                    }
                }
                    this.maxValue = Math.max.apply(null,maxArray);
                    let rait = this.maxValue/height;
                    rait = Math.round(rait * 100) / 100;
                   return rait;
           },

            getCoord(ratio,data,init){
                let coord =[];
                let yCoord = [];
                for(let i = 1; i < data.length;i++ ) {
                    let yArray  = data[i];
                    for(let j = init ; j < yArray.length; j++ ) {
                        yCoord.push(-yArray[j]/ratio);           //Переводим в отрицательную плоскость canvas
                    }
                    coord.push(yCoord);
                    yCoord = [];
                }
                return coord;
            },

            setCurrentMainData(start,end) {
                console.log(' setCurrentMainData') ;
                this.arrayForMainCoords  =  this.getArrayForMainCoords(this.filteredData,start,end);
                let ratioMain =   this.getRatio(this.mainHeight,this.arrayForMainCoords,0);
                //Коробка предпросмотра
                this.mainCoord = this.getCoord(ratioMain,this.arrayForMainCoords,0);
                console.log(' this.mainCoord', this.mainCoord);
            },

            basePercentData(){
                console.log('Вызвали наконец');
                let ratioPrev =   this.getRatio(this.prevHeight,this.filteredData,1);
                this.previewCoord = this.getCoord(ratioPrev,this.filteredData,1);
                console.log('this.previewCoord',this.previewCoord);
            },

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

    },

        mounted(){
         console.log('lineChart mounted');
        },

        name: "LineChart",

        components: {
            BaseGraph,
        }
    }
</script>


