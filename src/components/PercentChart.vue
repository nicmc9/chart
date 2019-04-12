<template>

    <div>

        <base-graph
                nameChart ="Percentage stacked area chart "
                path = "/contest/5/"
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


        computed: {
            //Заглушка когда поставим дефолты параметров

            metric1YValue: function () {
                     return 1;
            }
        },

        methods: {



            /////////////////////////  Compute Box Data /////////////////////////////////////////

            previewDown(type,event){
                if(type=='mouse'){
                    let mouse = event.pageX-this.xOffset;
                    this.downData(mouse);
                }else{

                    event.preventDefault();
                    let touches = event.changedTouches;
                    let mouse = touches[0].pageX-this.xOffset;
                    this.downData(mouse);
                }
            },
            downData(mouseX){

                if(!this.activGraph.length) return;

                let self = this;
                 //  console.log('this.mouseX',this.mouseX);
                if(this.isIntoLeftSide(mouseX)){
                    this.selectedLeftSide = true;
                    //  console.log('Попал в левую рамку');

                    self.timeId =  setInterval(function() {
                        self.draw();
                    }, 50);

                }else if(this.isIntoRightSide(mouseX)){

                    this.selectedRightSide = true;
                    //   console.log('Попал в правую рамку');

                    self.timeId =  setInterval(function() {
                        self.draw();
                    }, 50);

                }else if(this.isIntoSlider(mouseX)){
                    this.selectedBox = true;

                    self.timeId =  setInterval(function() {
                        self.draw();
                    }, 50);

                }

            },
            previewUp(){
                this.selectedBox = false;
                this.selectedLeftSide = false;
                this.selectedRightSide = false;

                clearInterval(this.timeId);

            },

            previewMove(type,event){
                if(type=='mouse'){
                    let mouse = event.pageX-this.xOffset;
                    this.moveData(mouse);
                }else{

                    event.preventDefault();
                    let touches = event.changedTouches;
                    let mouse = touches[0].pageX-this.xOffset;
                    this.moveData(mouse);
                }
            },

            moveData(mouseX){

                if(!this.activGraph.length) return;

              //   let initBox = this.prevWidth*0.3;
                if(this.selectedLeftSide){
                    //Нужно изменить параметры которые влияют на рисование коробки
                    // коробка будет отрисовываться сама благодорая интервалам

                    // высталсяем мыш на начало элемента

                    // сохраним левую х координату
                    let saveboxXcoord = this.boxXcoord;
                    //елси пользователь двигает мышь влево то новое значение координат будет уменьшаться
                    // если в право то увеличиваться
                    //новое значение измениться на небольшую величину
                    this.boxXcoord = mouseX;
                    if(this.boxXcoord <=0){
                        this.boxXcoord =0;
                    }
                    // берем старую шинину
                    let newWidth = this.boxWidth;
                    // разница будет положительно если мыш пошла в лево
                    // и на эту небольшую величину изменяем ширину коробки
                    newWidth +=saveboxXcoord - this.boxXcoord;

                    // если мы шли в право и уменьшили ширину до 300
                    // тогда останавливаем продвижение и все
                    // при этом не трогаем ширину если ее поменять будет немного дергаться
                    if( newWidth <= this.boxStop){
                        this.boxXcoord = saveboxXcoord;

                    }else{
                        this.boxWidth = newWidth;

                    }

                    // console.log('this.boxXcoord',this.boxXcoord );
                    // console.log('this.boxWidth',this.boxWidth );

                }else if(this.selectedRightSide){

                    // получаем координату х на границе правой стороны
                    let xRight = this.boxXcoord + this.boxWidth;

                    // Вычисляем разницу если мышь идет в право
                    // значение положительно и нужно увеличивать коробку
                    let delta  = mouseX - xRight;

                    //Увеличиваем коробку или уменьшаем если delta в минусе
                    let newWidth = this.boxWidth + delta;

                    // проверка границ сначала на размер коробки затем
                    // на выход из холста если все нормально изменяем ширину на новую
                    if(newWidth <= this.boxStop){
                        return;
                    }
                    else if( this.boxXcoord + newWidth >= this.prevWidth){
                        return;
                    }else{
                        this.boxWidth = newWidth;

                    }
                    // console.log('this.boxXcoord',this.boxXcoord );
                    // console.log('this.boxWidth',this.boxWidth );

                }else  if(this.selectedBox){
                    this.boxXcoord = mouseX - this.boxWidth/ 2;

                    //Ограничем левый и правый край
                    if(this.boxXcoord < 0) {
                        this.boxXcoord = 0;
                    }else if(this.boxXcoord >=this.prevWidth-this.boxWidth){
                        this.boxXcoord = this.prevWidth-this.boxWidth;
                    }

                    // console.log('this.boxXcoord',this.boxXcoord );
                }

            },
/////////////////////////  infoBoard /////////////////////////////////////////
            mainEnter(){
                let self =this;
                console.log('я вошел');
                if(!this.activGraph.length) return;
                this.touchBoard =true;
                this.timeId = requestAnimationFrame(this.drawInfoBoard);
                this.draw();

            },
            mainUp(){

                console.log('я вышел');
                this.touchBoard =false;
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

                    for(let i = 0; i <self.activGraph.length; i++) {
                         D[self.activGraph[i]] =[];
                         D[self.activGraph[i]].push(self.percentForBoard[i][j]);
                         D[self.activGraph[i]].push(self.names[self.activGraph[i]]);
                         D[self.activGraph[i]].push(self.dataForBoard[i+1][j]);
                    }

                    self.currentData = D;
               console.log('D',D);


                }

            },
            getDataForBoard(){

                let tempArray =[];
                let yArray =[];
                this.dataForBoard=[];
                this.percentForBoard=[];
                yArray  = this.columns[0];

                tempArray = yArray.slice(this.start,this.end);
              //  tempArray.unshift(yArray[0]);
                this.dataForBoard.push(tempArray);

                for(let i = 1; i < this.columns.length;i++ ) {
                    yArray  = this.columns[i];
                    if(this.activGraph.indexOf(yArray[0])=== -1){
                        continue;
                    }
                    tempArray = yArray.slice(this.start,this.end);
                  //  tempArray.unshift(yArray[0]);
                    this.dataForBoard.push(tempArray);
                }
                for(let i = 0; i < this.percentData.length;i++ ) {
                    yArray  = this.percentData[i];

                    tempArray = yArray.slice(this.start,this.end);
                //    tempArray.unshift(this.activGraph[i]);
                    this.percentForBoard.push(tempArray);
                }

                console.log(' this.dataForBoard', this.dataForBoard);
                console.log(' this.percentForBoard', this.percentForBoard);


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
                 let heightBoard = textSize*(count+4);
                 // 2  это небольшой отступ от края
                 // если true то слева
                 let flag= true;
                 let xBoard = self.mouseX+2;  // устанавлием координату X доски
                 if(xBoard <=self.prevWidth/2){
                     xBoard =self.mouseX+2;
                     flag= true;
                 }else {
                     xBoard = self.mouseX - widthBoard-2;
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

                    if(!flag){
                        ctx.fillText(cDate, xBoard + 10, -self.mainHeight + textSize );
                        ctx.fillText(">", xBoard + widthBoard -20, -self.mainHeight + textSize );
                    }else {
                        let s = measureText(cDate);
                        ctx.fillText(cDate, xBoard + widthBoard -s-20, -self.mainHeight + textSize );
                        ctx.fillText("<", xBoard + 5, -self.mainHeight + textSize );
                    }


                    let y = textSize*2.5;
                    let size =0;
                    let etalon = '30%';
                    let pos = measureText(etalon);
                    for (let item in D) {

                        ctx.font="bold "+textSize+"px  sans-serif";

                        ctx.fillStyle = self.timeColor.textInfo;
                        let str1 = D[item][0]+'%';
                        size = measureText(str1);
                        ctx.fillText(str1,xBoard +5+ pos -size,-self.mainHeight+y);

                        ctx.font=textSize+"px  sans-serif";
                        ctx.fillStyle = self.timeColor.textInfo;
                        let str2 = D[item][1];
                        ctx.fillText(str2,xBoard + pos+10,-self.mainHeight+y);


                        ctx.fillStyle = self.colors[item];
                        let str3 = D[item][2];
                        size = measureText(str3);
                        ctx.fillText(str3,xBoard + widthBoard -size-5,-self.mainHeight+y);
                        y += textSize*1.2;
                  }
                }
                 function drawVerticalLine() {
                    ctx.strokeStyle =self.timeColor.gLine;
                     ctx.beginPath();
                     ctx.moveTo(self.mouseX,0);
                     ctx.lineTo(self.mouseX,-self.mainHeight);
                     ctx.stroke();
                 }
             this.timeId = requestAnimationFrame(this.drawInfoBoard);
            },

            ///////////////////////////////////////////


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

            setCurrentMainData(start,end){

                this.arrayForMainCoords  =  this.getArrayForMainCoords(this.filteredData,start,end);

                let tempArray =[];
                this.mainCoord=[];
                let yArray =[];
                for(let i = 0; i < this.allMainCoord.length;i++ ) {
                    yArray  = this.allMainCoord[i];
                    tempArray = yArray.slice(start,end);
                    this.mainCoord.push(tempArray);
                }
               console.log('this.mainCoord',this.mainCoord);
            },


            drawGraph(yCoord ,ctx,color,step){

                let x = 0;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x,0);
                for(let i=0; i < yCoord.length; i++){

                    ctx.lineTo( x,yCoord[i]);
                    x += step;
                }
                //console.log('x',x);
                ctx.lineTo( x,0);
                ctx.fill();
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

            drawGraphs(ctx,data,step){

               for(let i = data.length-1; i >=0 ;i-- ) {

                    let tempArray =  data[i];
                    let color =   this.colors[this.activGraph[i]];
                    this.drawGraph(tempArray,ctx,color,step);
                }

            },



            draw(){
                let ctxMain =this.ctxMain;
                let ctxPreview = this.ctxPreview;

                //очищаем холст

                ctxPreview.clearRect(0, -this.prevHeight-(this.prevShift/2), this.prevWidth, this.prevCanvasHeight);
                ctxMain.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);

                // Сначала заполнаем массив данных от start До end
                this.setCurrentMainData();

                //Коробка предпросмотра

                ctxPreview.lineWidth =2;  // восстановили значение


                this.drawGraphs(ctxPreview,this.previewCoord,this.xStep);
                this.drawGraphs(ctxMain,this.mainCoord,this.step);


                this.drawBox(ctxPreview);
                this.drawMetrics(ctxMain);
                // Все графики
                // Затенение оставшейся части предпросмотра

                this.drawFillBox(ctxPreview);

                this.drawMainDateRange(ctxMain);

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
