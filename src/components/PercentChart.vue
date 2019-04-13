<template>

    <div>
        <base-graph
                 path = "/contest/5/"
                 nameChart ="PercentChart"
                :prevWidth = prevWidth
                :mainCanvasHeight = mainCanvasHeight
                :prevCanvasHeight = prevCanvasHeight
                :isNight =  isNight
                :mainHeight  = mainHeight
                :prevHeight  = prevHeight
                :prevShift  = prevShift
                :mainShift  = mainShift
                :boxStop = boxStop
                :countLine = countLine

                :previewCoord="previewCoord"
                :mainCoord = "mainCoord"
                :arrayForMainCoords = "arrayForMainCoords"
                :step = "step"
                :percentForBoard="percentForBoard"

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
        props: ['isNight','mainHeight','prevWidth','prevHeight','prevShift',
               'mainShift','mainCanvasHeight','prevCanvasHeight','boxStop',
               'countLine'],
        data: function () {
            return {
                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                arrayForMainCoords:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                currentData:{},  // данные из columns на которых сейчас инфоДоска
                step:0,  // шаг для координаты х на главном холсте
                percentData:[],
                mainCoord:[],
                allMainCoord:[],
                dataForBoard:[],
                boardDate:null,
                percentForBoard:[],
                filteredData:[],
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
                this.step =    this.prevWidth/(tempArray.length-1);
                console.log('data',data);
                return data;

            },

            setCurrentMainData(start,end){
                this.arrayForMainCoords  =  this.getArrayForMainCoords(this.filteredData,start,end);
                let tempArray =[];
                this.mainCoord=[];
                this.percentForBoard=[];
                let yArray =[];
                for(let i = 0; i < this.allMainCoord.length;i++ ) {
                    yArray  = this.allMainCoord[i];
                    tempArray = yArray.slice(start-1,end-1);
                    this.mainCoord.push(tempArray);
                }

                for(let i = 0; i < this.percentData.length;i++ ) {
                    yArray  = this.percentData[i];
                    console.log('start,end',start,end);
                    tempArray = yArray.slice(start-1,end-1);
                    this.percentForBoard.push(tempArray);
                }
               console.log('this.percentForBoard',this.percentForBoard);
               console.log('this.mainCoord',this.mainCoord);
            },

            getSumData(){
                let sum = 0;
                let sumData =[];
                // Идем по длинне всех данных за основу время взяли
                let len = this.filteredData[0].length;

                for(let i = 1; i < len;i++ ) {

                    for(let j = 1 ; j < this.filteredData.length; j++ ) {
                        let yArray  = this.filteredData[j];
                        sum += yArray[i];
                    }
                    sumData.push(sum);
                    sum = 0;
                }
                console.log('this.sumData',sumData) ;
              return sumData;
            },

            setPercentData(){
                let sum  = this.getSumData();
                 let str = [];
                this.percentData =[];
                 let len = this.filteredData[0].length;
                // Идем по длинне всех данных за основу время взяли
               for(let i = 1 ; i < this.filteredData.length; i++ ) {

                        let yArray = this.filteredData[i];
                        for (let j = 1; j < len; j++) {
                           str.push(Math.round((yArray[j] * 100) / sum[j-1]));
                            //Пулучаем значение процента в сумме данных конкретного значения
                            // идет на строкам матрицы
                         }

                        this.percentData.push(str);
                        str =[];
                    }
                console.log('this.percentData',this.percentData)
            },

            getCoord(percentCoord, height){

               let coord =[];
               let yCoord = [];

                for(let i = 0; i < this.percentData.length-1;i++ ) {
                let yArray  = this.percentData[i];

                 for(let j = 0 ; j < yArray.length; j++ ) {
                       let cor = - yArray[j]*percentCoord;
                        if(i>=1){
                          let m =  coord[i-1][j];

                            yCoord.push(cor +m );
                        }else{
                            yCoord.push(cor);
                        }

                    }
                    coord.push(yCoord);
                    yCoord = [];
                }
                // Ускорение для поледнего элемента
                let len = this.percentData[this.percentData.length-1].length;
                for(let j = 0 ; j < len; j++ ) {
                      yCoord.push(-height);
               }
                coord.push(yCoord);
              return coord;
            },


            basePercentData(){
                console.log('Вызвали наконец');
                this.setPercentData();

                let onePercenCanvas = this.prevHeight*0.01;
                this.previewCoord = this.getCoord(onePercenCanvas,this.prevHeight);
                onePercenCanvas = this.mainHeight*0.01;
                this.allMainCoord = this.getCoord(onePercenCanvas,this.mainHeight);

                console.log('this.previewCoord',this.previewCoord);
                console.log('this.allMainCoord',this.allMainCoord);
            },


        },

        mounted(){
            console.log(' PercentChart mounted');
        },

        name: "PercentChart",
        components: {
            BaseGraph,
        }

    }
</script>

<style scoped>

</style>
