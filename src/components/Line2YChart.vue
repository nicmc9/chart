<template>

    <div>
        <base-graph
                nameChart ="Line2YChart"
                path = "/contest/2/"
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
                :metricYValue="metricYValue"

                v-on:base-percent-data="basePercentData"
                v-on:set-main-data="setCurrentMainData"
                v-on:set-active-graph="setFilteredData"
                v-on:set-init="setInit"
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
                metricYValue:[],
            }
        },

        methods: {

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

            getRatio(height,data,init) {
                let ratio = [];
                this.metricYValue =[];
                let max = 0;
      //Пропускаем первый элемент массива содержащий даты
                for (let i = 1; i < data.length; i++) {
                    let y = data[i];

                    if (init === 1) {
                        let temp = y[0];
                        y[0] = 0;  //MAth.max работает только с цифрами
                        max = Math.max.apply(null, y);
                        y[0] = temp;

                    } else {
                        max = Math.max.apply(null, y);
                    }
                    //т.е. для большого канваса
                    if(init === 0) {
                        this.metricYValue.push( Math.round(max / this.countLine));
                    }
                    let rait = max / height;
                    ratio.push(Math.round(rait * 100) / 100);
                }
                console.log("ratio",this.ratio);
                return ratio;
            },



            getCoord(ratio,data,init) {
              let coord =[];
                let yCoord = [];
                for (let i = 1; i < data.length; i++) {
                    let yArray = data[i];
                    for (let j = init; j < yArray.length; j++) {
                        yCoord.push(-yArray[j] / ratio[i - 1]);           //Переводим в отрицательную плоскость canvas
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



        },

        mounted(){
            console.log('line2YChart mounted');
        },

        name: "Line2YChart",

        components: {
            BaseGraph,
        }

    }
</script>


