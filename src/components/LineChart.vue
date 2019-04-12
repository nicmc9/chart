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
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                mainCoord:[],
                filteredData:[],
                maxValue:1,

            }
        },


        computed: {

            metric1YValue: function () {
                let val = this.maxValue[0]/this.countLine-1;  //this.countLine-1
                return Math.ceil(val);
            },
            metric2YValue: function () {
                let val = this.maxValue[1]/this.countLine-1;  //this.countLine-1
                return Math.ceil(val);
            },
       },

        methods: {
/////////////////////////  infoBoard /////////////////////////////////////////

           boardData(mouse){
                let self = this;
               console.log('mouse',mouse);

                for ( let i =0,j =0; i< self.prevWidth; i+=self.step,j++){
                    let prev = i-self.step;
                    let center = i-self.step/2;
                    if( mouse < i && mouse >= center ){
                        setCurrentData(j,i);
                        break;
                    }else if(mouse< center&&mouse >= prev ){
                        setCurrentData(j-1,prev);  //откатывае данные на один шаг назад
                        break;
                    }
                }

                function  setCurrentData(j,i) {
                    self.mouseX = i;
                    let  options = {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                    };
                    console.log('j',j);
                    console.log('self.mainCurrentData.length',self.mainCurrentData[0].length);

                    let date = new Date(self.mainCurrentData[0][j]).toLocaleString("en-US",options);
                    if(date === "Invalid Date"){
                        return;
                    }

                    self.currentData =[];
                    self.currentData.push(date);
                    for(let m = 1; m <self.mainCurrentData.length; m++){
                        self.currentData.push( self.mainCurrentData[m][j]);
                    }
                    console.log('self.currentData',self.currentData);
                }

            },
             drawInfoBoard(){

              console.log('я рисую доску');
                let ctx = this.ctxBoard;
                let self = this;

                 ctx.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);
                //Для доски и кружочков
                ctx.fillStyle =this.timeColor.board;
                // Используеться для вычислений и для установки размеров текущих данных///

                 //Размеры шрифта




                ctx.save();
                ctx.strokeStyle=this.timeColor.box;                     ///
                drawVerticalLine();

                ctx.shadowBlur = 2;                             ///
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";         ///

                let widthBoard = this.prevWidth/7;          // Начальная ширина доски 135
                let hei = this.mainHeight/6;                 //Высота доски  100


                 let  textSizeData = Math.round(hei*0.25);
                 let  textSizeDate  =Math.round(hei*0.2);
                 let  textSizeNames  = Math.round(hei*0.2);
                const space = 20;

                // значение отступа сверху подобрал эксперементально где-то 25 -30 нормально
                // и перевел в динамику
                const yS = hei/3.5;

                //расстояние между словами
                let name='';
                let textWidthArr=[];
                // первое значение дату пропускаем
                //Сначала измеряем текст
                 ctx.font="bold "+textSizeData+"px  sans-serif";
                measureText();
                // потом обновляем ширину
                updateWidthBoard();
                let xBoard = self.mouseX - widthBoard/2;  // устанавлием координату X доски
                if(xBoard <=0){
                    xBoard =2;
                }else  if(xBoard+widthBoard >self.prevWidth){
                    xBoard = self.prevWidth -widthBoard-2;
                }

                drawArcs();
                drawBoard(xBoard, -self.mainHeight, widthBoard, hei,10);
                //   drawBoard();
                ctx.restore();

                ctx.lineWidth =2;

                 ctx.font="bold "+textSizeData+"px  sans-serif";
                drawCurrentData();

                ctx.fillStyle =self.timeColor.textInfo;
                 ctx.font=textSizeDate+"px  sans-serif";
                drawDates();

                 ctx.font=textSizeNames+"px  sans-serif";
                drawNames();

                function drawBoard(x, y, width, height, radius) {
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                    ctx.lineTo(x + width, y + height - radius);
                    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    ctx.lineTo(x + radius, y + height);
                    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();
                    ctx.fill();
                }


                function drawArcs() {

                    for(let i = 1; i < self.currentData.length; i++){

                        ctx.strokeStyle = self.colors[self.activGraph[i-1]];

                        let y = -self.currentData[i]/self.ratioMain[i-1];

                        ctx.beginPath();
                        ctx.arc(self.mouseX,y,5,0,Math.PI*2,true);
                        ctx.fill();

                        ctx.beginPath();
                        ctx.arc(self.mouseX,y,5,0,Math.PI*2,true);
                        ctx.stroke();
                    }
                }

                function measureText() {
                    for(let i = 1; i < self.currentData.length; i++){
                        let temp = ctx.measureText(self.currentData[i]);
                        textWidthArr.push(temp.width);
                    }
                }

                function updateWidthBoard() {
                    let len = space;
                    for(let i = 0; i < textWidthArr.length; i++){
                        len += textWidthArr[i] + space;
                    }
                    if(len > widthBoard){
                        widthBoard = len;
                    }
                }

                function drawDates() {
                    ctx.fillText(self.currentData[0], xBoard + space, -self.mainHeight + yS );
                }

                function drawCurrentData() {
                    let w=0;
                    for(let i = 1,j = space; i < self.currentData.length; i++,j += space){
                        ctx.fillStyle = self.colors[self.activGraph[i-1]];                           ////

                        if(i === 1) {
                            ctx.fillText(self.currentData[i], xBoard + j, -self.mainHeight + (yS*2));
                        }else{
                            w += textWidthArr[i-2];
                            ctx.fillText(self.currentData[i], xBoard + j + w, -self.mainHeight + (yS*2));
                        }
                    }
                }

                function drawNames() {

                    let w=0;
                    for(let i = 1,j = space; i < self.currentData.length; i++,j += space){
                        ctx.fillStyle = self.colors[self.activGraph[i-1]];
                        name = self.names[self.activGraph[i-1]];
                        if(i === 1) {
                            ctx.fillText(name, xBoard + j, -self.mainHeight + (yS*3));
                        }else{
                            w += textWidthArr[i-2];
                            ctx.fillText(name, xBoard + j + w, -self.mainHeight + (yS*3));
                        }
                    }
                }

                function drawVerticalLine() {
                    ctx.beginPath();
                    ctx.moveTo(self.mouseX,0);
                    ctx.lineTo(self.mouseX,-self.mainHeight);
                    ctx.stroke();
                }

               this.timeId = requestAnimationFrame(this.drawInfoBoard);
            },

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


            setCurrentMainData(start,end) {
                console.log(' setCurrentMainData') ;
                this.arrayForMainCoords  =  this.getArrayForMainCoords(this.filteredData,start,end);
                this.ratioMain =   this.getRatio(this.mainHeight,this.arrayForMainCoords,0);
                //Коробка предпросмотра
                this.mainCoord = this.getCoord(this.ratioMain,this.arrayForMainCoords,0);
                console.log(' this.mainCoord', this.mainCoord);
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
                    let max = Math.max.apply(null,maxArray);
                    let rait = max/height;
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

            drawGraph(yCoord ,ctx,color,step){
              //  console.log('я рисую график');
                let x = 0;
                ctx.strokeStyle = color;
                ctx.beginPath();
                ctx.moveTo(x,yCoord[0]);
                for(let i=1; i < yCoord.length; i++){
                    x += step;
                    ctx.lineTo( x,yCoord[i]);

                }
                ctx.stroke();
            },

            drawMetrics(ctx){

                //Шрифт и цвет для обоих метрик

                ctx.fillStyle = this.timeColor.metrics;
                ctx.strokeStyle = this.timeColor.gLine;
                let fontSize = Math.round(this.mainHeight*0.03);
                if(fontSize>20 ) fontSize =20;
                if(fontSize<10 ) fontSize =10;
                ctx.font = fontSize+"px sans-serif";

                this.drawDate(ctx);
                this.drawYmeter(ctx);
            },
            drawYmeter(ctx){

                if(this.chart.y_scaled) {

                    ctx.fillStyle =this.colors['y1'];

                    for(let i =0 ; i < this.countLine+1 ; i++){

                        let size = this.metric2YValue*i;
                        let text = ctx.measureText(size);
                        let x = this.prevWidth -text.width;
                        ctx.fillText(this.metric2YValue*i, x, -this.shiftY*i-5);
                    }
                    ctx.fillStyle = this.colors['y0'];
                }

                ctx.beginPath();
                for(let i =0 ; i < this.countLine+1 ; i++){
                    ctx.moveTo(0,-this.shiftY*i);
                    ctx.lineTo(this.prevWidth ,-this.shiftY*i);
                    ctx.fillText(this.metric1YValue*i, 5, -this.shiftY*i-5);
                }
                ctx.stroke();

            },



            drawPreviewGraphs(ctxPreview){

             //   console.log('я рисую превью графики');
                for(let i = 0; i < this.previewCoord.length;i++ ) {
                    let tempArray =  this.previewCoord[i];
                    let color =   this.colors[this.activGraph[i]];

                    this.drawGraph(tempArray,ctxPreview,color,this.xStep);
                }
            },

            drawMainGraphs(ctxMain){
           //     console.log('я рисую главный график');

                if(!this.chart.y_scaled){
                 //ЭТо хак надо исправить
                   let  max = Math.max.apply(null, this.ratioMain);
                    for(let j = 0 ; j < this.ratioMain.length;j++ ) {
                        this.ratioMain[j] = max;           //Переводим в отрицательную плоскость canvas
                    }
                }
                let yCoord = [];
                for(let i = 1; i < this.mainCurrentData.length; i++ ) {
                    let yArray  = this.mainCurrentData[i];

                    for(let j = 0 ; j < yArray.length;j++ ) {
                        yCoord.push(-yArray[j]/this.ratioMain[i-1]);           //Переводим в отрицательную плоскость canvas
                    }
                    let color =   this.colors[this.activGraph[i-1]];
                    this.drawGraph(yCoord,ctxMain,color,this.step);
                    yCoord = [];
                }
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


