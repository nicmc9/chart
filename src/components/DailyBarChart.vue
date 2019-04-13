<template>

    <div>
        <base-graph
                nameChart ="DailyBarChart"
                path = "/contest/4/"
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
                // Хранение координат предпросмотра для переиспользования
                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                // максимальное значение данных в columns для y координат
                //превратить в актив
                arrayForMainCoords:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                step:0,  // шаг для координаты х на главном холсте
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                mainCoord:[],
                filteredData:[],
                maxValue: 1,
            }
        },

        computed: {
            metric1YValue: function () {
                let val = this.maxValue/this.countLine-1;  //this.countLine-1
                return Math.ceil(val);
            }
          },


        methods: {

/////////////////////////  draw() /////////////////////////////////////////


            getSumData(data) {
                let sum = 0;
                let sumData = [];
                // Идем по длинне всех данных за длинну  взяли массив времени
                let len = data[0].length;
                let i = 1;
                let type = data[1][0];
                typeof type == "string" ? i = 1 : i = 0;
                console.log('i', i);
                for (i; i < len; i++) {
                    for (let j = 1; j < data.length; j++) {
                        let yArray = data[j];
                        sum += yArray[i];
                    }
                    sumData.push(sum);
                    sum = 0;
                }
                console.log('this.sumData', sumData);
                return sumData;
            },


            getRatio(height, sum) {

                let max = Math.max.apply(null, sum);
                this.maxValue = max;
                let rait = max / height;
                rait = Math.round(rait * 100) / 100;
                console.log('rait ', rait);
                return rait;
            },

            getCoord(ratio, data, init) {

                console.log('data coord', data);
                let coord = [];
                let yCoord = [];

                for (let i = 1; i < data.length; i++) {
                    let yArray = data[i];
                    // console.log('yArray ',yArray );
                    for (let j = init; j < yArray.length; j++) {
                        let cor = -yArray[j] / ratio;

                        if (i >= 2) {
                            //в массиве coord нужно начинать с [0][0]
                            let early = coord[i - 2][j - init];
                            yCoord.push(cor + early);
                        } else {
                            yCoord.push(cor);           //Переводим в отрицательную плоскость canvas
                        }
                    }
                    coord.push(yCoord);
                    //console.log('coord',coord);
                    yCoord = [];
                }
                return coord;
            },


            getArrayForMainCoords(columns, start, end) {
                let tempArray = [];
                let data = [];
                let yArray = [];

                for (let i = 0; i < columns.length; i++) {
                    yArray = columns[i];
                    tempArray = yArray.slice(start, end);
                    data.push(tempArray);
                }
                console.log('data', data);
                // Здесь другой степ
                this.step = this.prevWidth /tempArray.length;
                return data;

            },

            setCurrentMainData(start, end) {
                console.log(' setCurrentMainData');
                this.arrayForMainCoords = this.getArrayForMainCoords(this.filteredData, start, end);

                let sum = this.getSumData(this.arrayForMainCoords);


                this.ratioMain = this.getRatio(this.mainHeight, sum);
                //Коробка предпросмотра
                this.mainCoord = this.getCoord(this.ratioMain, this.arrayForMainCoords, 0);
                console.log(' this.mainCoord', this.mainCoord);
                // Сначала заполнаем массив данных от start До end
                //Коробка предпросмотра

            },
            basePercentData() {

                console.log('Вызвали наконец');
                let sum = this.getSumData(this.filteredData);

                let ratioPrev = this.getRatio(this.prevHeight, sum);
                this.previewCoord = this.getCoord(ratioPrev, this.filteredData, 1);
                console.log('this.previewCoord', this.previewCoord);

            },


        },
        mounted(){
            console.log('DailyBarChart mounted');
        },

        name: "DailyBarChart",

        components: {
            BaseGraph,
        }
    }
</script>

