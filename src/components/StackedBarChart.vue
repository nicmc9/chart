<template>

    <div>
          <base-graph
                  nameChart ="Bar Chart"
                  path = "/contest/3/"
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
                  v-on:base-percent-data="basePercentData"

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

              // Хранение координат предпросмотра для переиспользования
                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                // максимальное значение данных в columns для y координат
                //превратить в актив

                mainCurrentData:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                currentData:[],  // данные из columns на которых сейчас инфоДоска
                step:0,  // шаг для координаты х на главном холсте
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                infoboard:false,
                mainCoord:[],
                dataForBoard:[],
                currentCoord:[]  // Для полоски инфоборда
            }
        },


        methods: {


            mainEnter(){
                let self =this;
                console.log('я вошел');
                if(!this.activGraph.length) return;
                this.touchBoard =true;
                this.infoboard =true;
                this.timeId = requestAnimationFrame(this.drawInfoBoard);

                this.draw();

            },
            mainUp(){

                console.log('я вышел');
                this.touchBoard =false;
                this.infoboard =false;
                cancelAnimationFrame(this.timeId);
                this.ctxBoard.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);
                this.draw();



            },

            mainMove(type,event){

             //   if(!this.touchBoard) return;

                if(type=='mouse'){
                    let mouse = event.pageX-this.xOffset;
                    this.boardData(mouse);
                }else{

                   // event.preventDefault();
                    let touches = event.changedTouches;
                    let mouse = touches[0].pageX-this.xOffset;
                     this.boardData(mouse);
                }
            },
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

                    self.boardDate = new Date(self.dataForBoard[0][j]).toLocaleString("en-US",options);

                    if(self.boardDate === "Invalid Date"){
                        return;
                    }
                    //  let D = {'y0': ['30%', 'Apples','37'],'y1':['25%', 'Mango','25'] };
                    let D = {};
                     let sum =0;
                    self.currentCoord=[];
                    for(let i = 0; i <self.activGraph.length; i++) {
                        D[self.activGraph[i]] =[];
                        D[self.activGraph[i]].push(self.names[self.activGraph[i]]);
                        D[self.activGraph[i]].push(self.dataForBoard[i+1][j]);

                        sum += self.dataForBoard[i+1][j];
                        self.currentCoord.push([self.activGraph[i],self.mainCoord[i][j]]);
                    }
                    D['All'] =['All',sum];
                    self.currentData = D;
                 //   console.log('D',D);
               //     console.log('self.currentCoord',self.currentCoord);
                }

            },
            getDataForBoard(){

                let tempArray =[];
                let yArray =[];
                this.dataForBoard=[];
                yArray  = this.columns[0];

                tempArray = yArray.slice(this.start,this.end);
                this.dataForBoard.push(tempArray);

                for (let i =0; i<this.mainCurrentData.length;i++){
                    tempArray = this.mainCurrentData[i];
                    this.dataForBoard.push(tempArray);
                }

                console.log(' this.dataForBoard', this.dataForBoard);
             //   console.log(' this.main', this.mainCurrentData);

            },
            drawInfoBoard(){

                console.log('я рисую доску');
                let self = this;
                let ctx = this.ctxBoard;

                let cDate = this.boardDate;
                let D = this.currentData;

                ctx.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);

                ctx.fillStyle =this.timeColor.board;

                // Сначала задали размер текста в зависимости от
                //размера  экрана
                let  textSize  =Math.round(this.mainHeight*0.03);
                ctx.font=textSize+"px  sans-serif";

                console.log("textSize",textSize);
                let widthTextString = 0;
                //Для вычисления высоты борда количество элементо * на высоту строки
                let count =0;
                for (let item in D) {
                    count++;
                    let str = D[item].join(' ');
                    let w = measureText(str);
                    if(w > widthTextString){
                        widthTextString = w;
                    }
                }

                ctx.save();

                ctx.shadowBlur = 2;                             ///
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";         ///
                console.log("widthTextString",widthTextString);

                // Ширина доски  возьмем ширину текстовой строки и добавим 20%
                let widthBoard = widthTextString+widthTextString*0.4;
                let heightBoard = textSize*(count+5);
                // 2  это небольшой отступ от края
                // если true то слева
                let flag= true;
                let xBoard = self.mouseX+2;  // устанавлием координату X доски
                if(xBoard <=self.prevWidth/2){
                    xBoard =self.mouseX+2+self.step+self.step;
                    flag= true;
                }else {
                    xBoard = self.mouseX - widthBoard-2-self.step;
                    flag= false;
                }
                console.log("self.prevWidth/2",self.prevWidth/2);
                console.log("xBoard",xBoard);

                drawBoard(xBoard, -self.mainHeight, widthBoard,heightBoard ,10);
                ctx.restore();

                ctx.lineWidth =2;
                drawVerticalLine();
                drawCurrentData();


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

                function measureText(str) {
                    let temp = ctx.measureText(str);
                    return temp.width;
                }

                function drawCurrentData() {
                    //  let D = {'y0': ['30%', 'Apples','37'],'y1':['25%', 'Mango','25'] };
                    ctx.fillStyle = self.timeColor.textInfo;
                    ctx.font="bold "+textSize+"px  sans-serif";
                    if(!flag){
                        ctx.fillText(cDate, xBoard + 10, -self.mainHeight + textSize );
                        ctx.fillText(">", xBoard + widthBoard -20, -self.mainHeight + textSize );
                    }else {
                        let s = measureText(cDate);
                        ctx.fillText(cDate, xBoard + widthBoard -s-20, -self.mainHeight + textSize );
                        ctx.fillText("<", xBoard + 5, -self.mainHeight + textSize );
                    }
                    ctx.font=textSize+"px  sans-serif";
                    let y = textSize*2.5;
                    let size =0;

                    for (let item in D) {

                        ctx.fillStyle = self.timeColor.textInfo;
                        let str1 = D[item][0];
                        size = measureText(str1);
                        ctx.fillText(str1,xBoard +5,-self.mainHeight+y);

                        ctx.fillStyle = self.colors[item];
                        let str3 = D[item][1];
                        size = measureText(str3);
                        ctx.fillText(str3,xBoard + widthBoard -size-5,-self.mainHeight+y);
                        y += textSize*1.4;
                    }
                }

                function drawVerticalLine() {
                    //Не оптимизировано
                    let it = self.currentCoord.length-1;

                     for(let i = it; i>=0;i--){
                         let y = self.currentCoord[i][1];
                         ctx.fillStyle=self.colors[self.currentCoord[i][0]];
                         ctx.beginPath();
                         ctx.moveTo(self.mouseX,0);
                         ctx.lineTo(self.mouseX,y);
                         ctx.lineTo(self.mouseX+self.step,y);
                         ctx.lineTo(self.mouseX+self.step,0);
                         ctx.fill();

                    }
                }

                this.timeId = requestAnimationFrame(this.drawInfoBoard);
            },

/////////////////////////  draw() /////////////////////////////////////////

            getSumData(data,init){

                let sum = 0;
                let sumData =[];
                // Идем по длинне всех данных за длинну  взяли массив времени
                let len = data[0].length;

                for(let i = init; i < len;i++ ) {

                    for(let j = init ; j < data.length; j++ ) {
                        let yArray  = data[j];
                        sum += yArray[i];
                    }
                    sumData.push(sum);
                    sum = 0;
                }

                console.log('this.sumData',sumData) ;
                return sumData;
            },

            getRatio(height,sum){

                let max = Math.max.apply(null,sum);
                this.maxValue =max;
                let rait = max/height;
                rait = Math.round(rait * 100) / 100;
                console.log('rait ',rait);
                return rait;
            },



    getCoord(ratio,data, init){

                console.log('data coord',data, init);
                let coord =[];
                let yCoord = [];

                for(let i = init; i < data.length;i++ ) {
                    let yArray  = data[i];
                    // console.log('yArray ',yArray );
                    // if(this.activGraph.indexOf(yArray[0])=== -1){
                    //     continue;
                    // }
                    for(let j = init ; j < yArray.length; j++ ) {
                        let cor = -yArray[j]/ratio;

                        if(i>=(init+1)){
                            let early =  coord[i-(init+1)][j-init];
                            yCoord.push(cor + early);
                        }else{
                            yCoord.push(cor);           //Переводим в отрицательную плоскость canvas
                        }

                    }

                    coord.push(yCoord);
                    yCoord = [];
                }
                return coord;
            },

            getCurrentMainData(){

                let tempArray =[];
                let data =[];
                let yArray =[];

                for(let i = 1; i < this.columns.length;i++ ) {
                    yArray  = this.columns[i];
                    if(this.activGraph.indexOf(yArray[0]) === -1){
                        continue;
                    }
                    tempArray = yArray.slice(this.start,this.end);
                    data.push(tempArray);
                }
                console.log('data',data);

                this.step =    this.prevWidth/(tempArray.length-1);

                return data;

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




            drawDate(ctx){
                let self =this;
                let date = this.datesArr.slice(this.start,this.end);
                let step = this.step;

                let  actualDate=[];
                console.log('e',this.e);
                console.log('date',date);

                for(let i = 0;i < date.length; i++)
                {
                    if(date[i]) {   actualDate.push(date[i]);
                    }
                }

                if(actualDate.length > 6){
                    check();

                    drawText();
                }else{
                    drawText();
                }


                function check() {

                    for (let j = actualDate.length; j >= 0; j -= 2) {
                        actualDate.splice(j, 1);
                    }
                    if (actualDate.length > 6) {
                        check();

                    }
                }

                function drawText() {

                    ctx.beginPath();
                    let  x =0;

                    for(let i = 0;i < date.length; i++)
                    {
                        if(date[i]){
                            if(actualDate.indexOf(date[i])!==-1) {

                                let xl = x-20;
                                if(xl<0) xl=0;
                                if(xl>self.prevWidth-50) xl = self.prevWidth-50;
                                ctx.fillText(date[i],xl, 20);
                            }
                        }
                        x+=step;
                    }
                    ctx.stroke();
                }
            },




            drawMainGraphs(ctxMain){

                let yCoord = [];
                for(let i = 1; i < this.mainCurrentData.length; i++ ) {
                    let yArray  = this.mainCurrentData[i];

                    for(let j = 0 ; j < yArray.length;j++ ) {
                        yCoord.push(-yArray[j]/this.ratioMain);           //Переводим в отрицательную плоскость canvas
                    }
                    let color =   this.colors[this.activGraph[i-1]];
                    this.drawGraph(yCoord,ctxMain,color,this.step);
                    yCoord = [];
                }

                if(this.infoboard){
                    ctxMain.fillStyle = this.timeColor.fillPreview;
                    ctxMain.fillRect(0,-this.mainHeight,this.prevWidth, this.mainHeight);
                }



            },
            drawMainDateRange(ctx){
                let dateFirst = this.columns[0][this.start];
                let dateEnd = this.columns[0][this.end-1];

                console.log('dateEnd',this.end);
                let  options = {
                    day: 'numeric',
                    month: 'long',
                    year:'numeric',
                };
                dateFirst = new Date(dateFirst).toLocaleString("en-GB", options);
                dateEnd = new Date(dateEnd).toLocaleString("en-GB", options);
                let range = dateFirst+' - '+ dateEnd;
                let text = ctx.measureText(range); // TextMetrics object
                let x = this.prevWidth -text.width-20;

                ctx.fillStyle ="#36a8f1";

                ctx.fillText(range, x, -this.mainHeight-this.mainShift/3);
                ctx.fillText(this.nameChart, 10, -this.mainHeight-this.mainShift/3);
                console.log('tthis.timeColor.textInfo',this.timeColor.textInfo);

            },


            defaultDraw(){
                let ctxMain =this.ctxMain;
                let ctxPreview = this.ctxPreview;

                //очищаем холст
                ctxPreview.clearRect(0, -this.prevHeight-(this.prevShift/2), this.prevWidth, this.prevCanvasHeight);
                ctxMain.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);

                ctxPreview.fillStyle = this.timeColor.gLine;
                ctxMain.fillStyle = this.timeColor.gLine;

                ctxPreview.fillRect(0, -this.prevHeight-(this.prevShift/2), this.prevWidth, this.prevCanvasHeight);
                ctxMain.fillRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);


                ctxMain.strokeStyle ='#000';
                ctxMain.fillText('0', 5, -5);


                ctxMain.beginPath();
                for(let i =0 ; i < this.countLine+1 ; i++){
                    ctxMain.moveTo(0,-this.shiftY*i);
                    ctxMain.lineTo(this.prevWidth ,-this.shiftY*i);

                }
                ctxMain.stroke();

            },

            basePercentData(columns){
                console.log('Вызвали наконец');

                let sum  = this.getSumData(columns,1);


                let ratioPrev =   this.getRatio(this.prevHeight,sum);

                this.previewCoord = this.getCoord(ratioPrev,columns,1);

                console.log('this.previewCoord',this.previewCoord);

              // this.$emit('draw');
             },

        },

        mounted(){

      console.log('StackedBarChart mounted');
        },

        name: "StackedBarChart",
        components: {
            BaseGraph,
        }

    }
</script>

<style scoped>

</style>
