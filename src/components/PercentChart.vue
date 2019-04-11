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

                v-on:base-percent-data="basePercentData"
        ></base-graph>

    </div>


</template>

<script>

    export default {
        props: ['isNight','mainHeight','prevWidth','prevHeight','prevShift',
               'mainShift','mainCanvasHeight','prevCanvasHeight','boxStop',
               'countLine','path','nameChart'],
        data: function () {
            return {

                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                // максимальное значение данных в columns для y координат
                maxValue: 1,
                selectedBox: false, // флаг выбора самой коробки
                selectedLeftSide: false, // флаг выбора левого столбца коробки
                selectedRightSide: false, // флаг выбора правого столбца коробки
                touchBoard: false,
                timeId: 0,  // таймер для сброса анимации
                mouseX:0,   // текущее положение мышки
                mainCurrentData:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                currentData:{},  // данные из columns на которых сейчас инфоДоска
                step:0,  // шаг для координаты х на главном холсте
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                percentData:[],
                mainCoord:[],
                dataForBoard:[],
                boardDate:null,
                percentForBoard:[]

            }
        },


        computed: {
            // геттер вычисляемого значения
            // чтобы уложиться на горизонтальной линии
            // Уменьшаем на 1 и получаем равные доли
            // в коломнс первое значение техническое поэтому уменьшаем еще на 1
            xStep: function () {
                return  this.prevWidth/(this.columns[0].length-2);
            },
            // Сдвигаем на 1 чтобы в результирующих массивах всегда пропускался первый индекс
            // в котором информация
            start: function () {
                return Math.ceil( this.boxXcoord/this.xStep +1);
            },

            end: function () {
                return Math.ceil( this.start + this.boxWidth/this.xStep);
            },
            shiftY: function () {
                return  this.mainHeight/(this.countLine-1);
            },
        },


        methods: {


            /// методы событий изменяющие данные

            isIntoSlider(mouseX){
                return mouseX>this.boxXcoord&&mouseX<this.boxXcoord+this.boxWidth;
            },
            isIntoLeftSide(mouseX){
                // console.log('this.mouse.x',this.mouse.x);
                return mouseX>=this.boxXcoord&&mouseX<=(this.boxXcoord+15);  // зависит от параметра в функции drawLine let widthLine = 15;
            },

            isIntoRightSide(mouseX){

                return mouseX>=(this.boxXcoord + this.boxWidth-15)&&mouseX<=(this.boxXcoord + this.boxWidth);  // зависит от параметра в функции drawLine let widthLine = 15;
            },

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


            setCurrentMainData(){

                let tempArray =[];
                this.mainCurrentData=[];
                let yArray =[];
                    //В цикле только данные по Y

                    // let yArray  = this.columns[0];
                    // tempArray = yArray.slice(this.start,this.end);
                    //
                    // this.mainCurrentData.push(tempArray);

                for(let i = 0; i < this.mainCoord.length;i++ ) {
                    yArray  = this.mainCoord[i];
                    tempArray = yArray.slice(this.start,this.end);
                    this.mainCurrentData.push(tempArray);
                }
                console.log('this.mainCurrentData',this.mainCurrentData);

                this.step =    this.prevWidth/(tempArray.length-1);
                this.getDataForBoard();

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
            drawBox(ctx){
           //     console.log('я рисую коробку');

                ctx.strokeStyle=this.timeColor.box;
                //Координата правой часта коробки
                let rightSideBox = this.boxXcoord + this.boxWidth;

                // Затем главный бокс
                let d = this.prevShift/2; // Раньше было 5

                let widthLine = 15;
                let r =widthLine/2;  //r нам нужен чтобы рамка рисовалась внутри холста без него она выходит за холст на половину
                ctx.lineWidth =widthLine;

                ctx.beginPath();
                ctx.moveTo(this.boxXcoord+r,-this.prevHeight-d);
                ctx.lineTo(this.boxXcoord+r,d);
                ctx.moveTo(rightSideBox-r,-this.prevHeight-d);
                ctx.lineTo(rightSideBox-r,d);
                ctx.stroke();

                ctx.lineWidth =4;
                ctx.beginPath();
                ctx.moveTo(this.boxXcoord,-this.prevHeight-d);
                ctx.lineTo(rightSideBox,-this.prevHeight-d);
                ctx.moveTo(rightSideBox,d);
                ctx.lineTo(this.boxXcoord,d);
                ctx.stroke();

            },
            drawFillBox(ctx){

                let d = this.prevShift/2;

                ctx.fillStyle = this.timeColor.fillPreview;
                let rightSideBox = this.boxXcoord + this.boxWidth;
                ctx.fillRect(0,-this.prevHeight-d,this.boxXcoord, this.prevCanvasHeight);
                ctx.fillRect(rightSideBox,-this.prevHeight-d,this.prevWidth-rightSideBox, this.prevCanvasHeight);
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

            drawYmeter(ctx){

              //  ctx.fillStyle = "#000";

                ctx.beginPath();
                const step = 25;
                let text =0;
                for(let i =0 ; i < this.countLine ; i++){
                    ctx.moveTo(0,-this.shiftY*i);
                    ctx.lineTo(this.prevWidth ,-this.shiftY*i);
                    ctx.fillText(text, 5, -this.shiftY*i-5);
                    text +=step;
                }
                ctx.stroke();

            },

            getSumData(){
                let sum = 0;
                let sumData =[];
                // Идем по длинне всех данных за основу время взяли
                let len = this.columns[0].length;

                for(let i = 1; i < len;i++ ) {

                    for(let j = 1 ; j < this.columns.length; j++ ) {
                        let yArray  = this.columns[j];
                        if(this.activGraph.indexOf(yArray[0])=== -1){
                            continue;
                        }
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
                 let len = this.columns[0].length;
                // Идем по длинне всех данных за основу время взяли
               for(let i = 1 ; i < this.columns.length; i++ ) {
                        let yArray = this.columns[i];
                   if(this.activGraph.indexOf(yArray[0])=== -1){
                       continue;
                   }
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
                this.drawGraphs(ctxMain,this.mainCurrentData,this.step);


                this.drawBox(ctxPreview);
                this.drawMetrics(ctxMain);
                // Все графики
                // Затенение оставшейся части предпросмотра

                this.drawFillBox(ctxPreview);

                this.drawMainDateRange(ctxMain);

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
            basePercentData(){
                console.log('Вызвали наконец');

                this.setPercentData();

                let percent = this.prevHeight*0.01;

                this.previewCoord = this.getCoord(percent,this.prevHeight);

                percent = this.mainHeight*0.01;

                this.mainCoord = this.getCoord(percent,this.mainHeight);

                console.log('this.previewCoord',this.previewCoord);
                console.log('this.mainCoord',this.mainCoord);

                this.$emit('draw');

            },

        },

        mounted(){
            console.log(' PercentChart mounted');
        },

        name: "PercentChart",


    }
</script>

<style scoped>

</style>
