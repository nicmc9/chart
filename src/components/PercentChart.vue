<template>

    <div>
<!--        <p>touchBoard -&#45;&#45; {{touchBoard}}  this.timeId -&#45;&#45;{{this.timeId}} </p>-->
        <p>mainHeight-&#45;&#45; {{mainHeight}}  </p>
        <div class="stage"  :style="{width:prevWidth+'px',height:mainCanvasHeight+'px'}">

            <canvas ref="board" :width = "prevWidth" :height="mainCanvasHeight"

                   @touchstart="mainEnter"
                   @touchmove="mainMove('touch',$event)"
                   @touchend="mainUp"
                   @touchcancel="mainUp"


                   @mouseenter="mainEnter"
                   @mousedown="mainEnter"
                   @mousemove="mainMove('mouse',$event)"
                   @mouseleave="mainUp"
                   @mouseup="mainUp"

            ></canvas>

            <canvas  ref="main" :width = "prevWidth" :height="mainCanvasHeight"

            ></canvas>

        </div>

    <div class="stage2" :style="{width:prevWidth+'px',height:prevCanvasHeight+'px'}">
        <canvas    ref="preview" :width = "prevWidth" :height="prevCanvasHeight"
                @mousedown="previewDown('mouse',$event)"
                @mousemove="previewMove('mouse',$event)"
                @mouseleave="previewUp"
                @mouseup="previewUp"

                @touchstart="previewDown('touch',$event)"
                @touchmove="previewMove('touch',$event)"
                @touchend="previewUp"
        ></canvas>
    </div>
        <br>
<!--        <p>touchBoard -&#45;&#45; {{touchBoard}}  this.timeId -&#45;&#45;{{this.timeId}} </p>-->

        <ul class="checkbox">


            <li class="checkbox__li" v-for ="(val,key) in names">
                <label >
                    <input class="checkbox__input" type="checkbox"  :value="key" @change="updateGraph(key)">
                    <span class="checkbox__button" :style="{'border-color': colors[key] }"></span>
                    <i class="checkbox__i" >&#10004;</i>
                    <span class="checkbox__text"
                          :style="isNight?{color: 'white','border-color':'#40566b'}:''">{{val}}</span></label>

            </li>
            <li  class="checkbox__li">
                <button  :href="file" class="save"  download="chart" @click="save">Save chart</button>
            </li>

        </ul>
        <br>

    </div>


</template>

<script>

    export default {
        props: ['isNight','mainHeight','prevWidth','prevHeight','prevShift',
               'mainShift','mainCanvasHeight','prevCanvasHeight','boxStop',
               'countLine','path','nameChart'],
        data: function () {
            return {
                chart:null,
                ctxPreview: 0, // Контекст предпросмотра
                ctxMain: 0,    //  Главный график
                ctxBoard: 0,     //Информатор
                //Данные json
                colors:{},   //Хранит цвета в виде {y0:#fff}
                names: {},   //Хранит имена в виде {y0:#0}
                types:{},    //Хранит типы в виде {y0:'line'}
                columns: {}, //Хранит хначения в виде  { "columns": [   ['x','1099090'],['y0','32'],['y1','342'] ] }
              // Хранение координат предпросмотра для переиспользования
                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                // максимальное значение данных в columns для y координат
                maxValue: 1,
                boxXcoord: 0,  // начальная координата х коробки
                boxWidth: 100,    //начальная ширина коробки
                //превратить в актив
                activGraph: [],   // массив содержащий неактивные графики в виде ['y0','y1']
                xOffset: 0,   // смешение от края экрана можно удалить и использовать layerX вместо pageX в будущем
                selectedBox: false, // флаг выбора самой коробки
                selectedLeftSide: false, // флаг выбора левого столбца коробки
                selectedRightSide: false, // флаг выбора правого столбца коробки
                touchBoard: false,
                timeId: 0,  // таймер для сброса анимации
                mouseX:0,   // текущее положение мышки
                mainCurrentData:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                currentData:[],  // данные из columns на которых сейчас инфоДоска
                step:0,  // шаг для координаты х на главном холсте
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                timeColor: this.$options.dayColor,
                datesArr:[],
                file:'',
                percentData:[],
                mainCoord:[]

            }
        },

        dayColor:{
            fillPreview:"rgba(245,249,251,0.5)",
            box:"rgba(221,234,243,0.5)",
            metrics:"rgba(139,147,153)",
            gLine:"rgba(221,234,243,0.5)",
            textInfo: "#000",
            board: "#fff",
        },

        nightColor:{
            fillPreview:"rgba(31,42,56,0.5)",
            box:"rgba(95,128,158,0.5)",
            metrics:"rgba(95,128,158)",
            gLine:"rgba(64,86,107,0.2)",
            textInfo: "#fff",
            board: "#2b384a",
        },

        watch: {
             isNight:function () {
                if(this.isNight){
                    this.timeColor = this.$options.nightColor;
                    document.body.style.backgroundColor = "#293647";
                }else{
                    document.body.style.backgroundColor = "white";
                    this.timeColor = this.$options.dayColor;
                }

                if(this.activGraph.length)  {
                    this.draw();
                }else{
                    this.defaultDraw();
                }

            },
            prevWidth:function () {
                let self =this;
                this.$nextTick(function () {
                    self.init();
                });

                console.log('watch',this.prevWidth);
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
            // Высляються цифры в левой шкале
            metric1YValue: function () {
                let val = this.maxValue/this.countLine-1;  //this.countLine-1
                return Math.ceil(val);
            },
           shiftY: function () {
                return  this.mainHeight/this.countLine;
            },
        },


        methods: {

            ///////////////  Active Graphics/////////////////
            save(){
                let canvasMain = this.$refs.main;
                this.file = canvasMain.toDataURL('image/png');
            },

            updateGraph(key){
                console.log('key',key);
                let index =  this.activGraph.indexOf(key);
                if(index === -1){
                    this.activGraph.push(key);
                    this.activGraph.sort();

                }else{
                    this.activGraph.splice(index,1);
                }
                if(this.activGraph.length){
                    this.basePercentData();
                  console.log('this.activGraph',this.activGraph);

                }else{
                    this.defaultDraw();
                }


                // console.log(' this.activGraph', this.activGraph);
            },


            ///////////////////////Night - Day///////////////////////////////


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
                this.infoboard =true;
                this.timeId = requestAnimationFrame(this.drawInfoBoard);
                // self.timeId =  setInterval(function() {
                //     self.drawInfoBoard();
                // }, 50);
             this.draw();

            },
            mainUp(){

                console.log('я вышел');
                this.touchBoard =false;
                this.infoboard =false;
                cancelAnimationFrame(this.timeId);
                this.ctxBoard.clearRect(0, -this.mainHeight-(this.mainShift/2), this.prevWidth, this.mainCanvasHeight);
                this.draw();
                //clearInterval(this.timeId);


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
              //      console.log('j',j);
              //      console.log('self.mainCurrentData.length',self.mainCurrentData[0].length);

                    let date = new Date(self.mainCurrentData[0][j]).toLocaleString("en-US",options);
                    if(date === "Invalid Date"){
                        return;
                    }

                    self.currentData =[];
                    self.currentData.push(date);
                    for(let m = 1; m <self.mainCurrentData.length; m++){

                        self.currentData.push( self.mainCurrentData[m][j]);
                    }
                   // console.log('self.currentData',self.currentData);
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
                                 ///
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
                 ctx.fillStyle =this.timeColor.board;
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
                        let d = formatDigits(self.currentData[i]);
                        if(i === 1) {
                            ctx.fillText(d, xBoard + j, -self.mainHeight + (yS*2));
                        }else{
                            w += textWidthArr[i-2];
                            ctx.fillText(d, xBoard + j + w, -self.mainHeight + (yS*2));
                        }
                    }
                }
                function formatDigits(digit){
                        let d = +digit;
                        d =  d.toLocaleString('ru');
                        return d;


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
                    //Не оптимизировано
                    let y = self.currentData[1]/self.ratioMain;
                    ctx.fillStyle="#64ADED";
                    ctx.beginPath();
                    ctx.moveTo(self.mouseX,0);
                    ctx.lineTo(self.mouseX,-y);
                    ctx.lineTo(self.mouseX+self.step,-y);
                    ctx.lineTo(self.mouseX+self.step,0);
                    ctx.fill();
                }

               this.timeId = requestAnimationFrame(this.drawInfoBoard);
            },


            ///////////////////////////////////////////


            getCoords(elem) {
                let box = elem.getBoundingClientRect();
                return {
                    top: box.top + pageYOffset,
                    left: box.left + pageXOffset
                };
            },

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

            },

            // drawGraph(yCoord ,ctx,color,step){
            //   //  console.log('я рисую график');
            //     let x = 0;
            //     ctx.fillStyle = color;
            //     ctx.lineWidth = 0;
            //     ctx.beginPath();
            //     for(let i=0; i < yCoord.length; i++){
            //         ctx.moveTo(x,0);
            //         ctx.lineTo( x,yCoord[i]);
            //         ctx.lineTo( x+step,yCoord[i]);
            //         ctx.lineTo( x+step,0);
            //         x += step;
            //
            //     }
            //     ctx.fill();
            // },
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

            setDateArray(){

                let  options = {
                    month: 'short',
                    day: 'numeric',
                };
                let time = this.columns[0];
                this.datesArr=[];


                for (let i = 0; i < time.length; i++) {
                    if(i%6===0) {
                        this.datesArr.push(new Date(time[i]).toLocaleString("en-US", options));
                    }else{
                        this.datesArr.push("");
                    }
                }
                this.datesArr[1] = new Date(time[1]).toLocaleString("en-US", options);
                this.datesArr[this.datesArr.length-1] =  (new Date(time[time.length-1]).toLocaleString("en-US", options));
                //    console.log('this.datesArr0',this.datesArr);
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
                ctx.fillText("0", 5, -5);
                for(let i =1 ; i < this.countLine+1 ; i++){

                    let z = Math.round((this.metric1YValue*i)/1000000);
                    z = z+"M";
                    ctx.moveTo(0,-this.shiftY*i);
                    ctx.lineTo(this.prevWidth ,-this.shiftY*i);
                    ctx.fillText(z, 5, -this.shiftY*i-5);
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

            setCoord(percentCoord,height){

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
                this.drawBox(ctxPreview);
                ctxPreview.lineWidth =2;  // восстановили значение


                this.drawGraphs(ctxPreview,this.previewCoord,this.xStep);
                this.drawGraphs(ctxMain,this.mainCurrentData,this.step);

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
                this.setPercentData();

                let percent = this.prevHeight*0.01;
                this.previewCoord = this.setCoord(percent,this.prevHeight);
                percent = this.mainHeight*0.01;
                this.mainCoord = this.setCoord(percent,this.mainHeight);

                console.log('this.previewCoord',this.previewCoord);
                console.log('this.mainCoord',this.mainCoord);

                this.draw();
            },
            init(){
                let canvasPreview = this.$refs.preview;
                this.ctxPreview = canvasPreview.getContext('2d');
                let canvasMain = this.$refs.main;
                this.ctxMain = canvasMain.getContext('2d');
                let canvasBoard = this.$refs.board;
                this.ctxBoard = canvasBoard.getContext('2d');

                this.columns =  this.chart.columns;
                this.colors = this.chart.colors;
                this.names = this.chart.names;
                this.types = this.chart.types;

                //Воостанавливаем чистые настройки контекстов
                this.ctxPreview.restore();
                this.ctxMain.restore();
                this.ctxBoard.restore();
                // а затем сохраняем чистые
                this.ctxPreview.save();
                this.ctxMain.save();
                this.ctxBoard.save();

                let chiftM = this.mainHeight+(this.mainShift/2);
                let chiftP = this.prevHeight+(this.prevShift/2);

                console.log('this.mainHeight',this.mainHeight);
                console.log('this.prevHeight',this.prevHeight);
                console.log('this.mainCanvasHeight',this.mainCanvasHeight);
                console.log('this.prevCanvasHeight',this.prevCanvasHeight);
                console.log('chiftM',chiftM);
                console.log('chiftP',chiftP);

                //переводим сисмему координат на низ холста
                this.ctxPreview.translate(0,chiftP); //сдвиг по высоте
                this.ctxMain.translate(0,chiftM);   // На графике ниже нулевой линии положительная плоскость Y холста
                this.ctxBoard.translate(0,chiftM);

             //   console.log(' this.activGraph', this.activGraph);
                // инициализируем смещение от левого края холста
                let coords    = this.getCoords(canvasPreview);
                this.xOffset = coords.left;
                // console.log('this.xOffset',this.xOffset);

                // Ставим линии пошире и рисуем
                this.ctxMain.lineWidth = 2;
                this.ctxPreview.lineWidth = 2;

                this.boxXcoord=0;
                this.boxWidth=this.prevWidth*0.3;


                this.setDateArray();
                // Заполняем массив превью коорд
                // что бы потом его не персчитывать при перерисовке
                // а только при смене графиков

                 this.basePercentData();
            }

        },

        mounted(){

            let self =this;
            console.log('self.path',self.path);
            let path = self.path+'/overview.json';
            function loadJSON(callback) {
                var xobj = new XMLHttpRequest();
                xobj.overrideMimeType("application/json");
                xobj.open('GET', path, true);
                xobj.onreadystatechange = function () {
                    if (xobj.readyState == 4 && xobj.status == "200") {
                        callback(xobj.responseText);
                    }
                };
                xobj.send(null);
            }

            // fetch('contest/1/overview.json')
            //         .then(response => response.json() )
            //         .then(data=>  self.chart = data )
            //         .catch( alert );



            loadJSON(function(response) {
                // Parse JSON string into object
                self.chart = JSON.parse(response);
                self.activGraph = Object.keys(self.chart.colors);
                self.init();

                console.log('self.chart',self.chart);
            });


            console.log('mounted');
        },

        name: "PercentChart",


    }
</script>

<style scoped>
    .checkbox{
        list-style: none;
        margin: auto;
    }
    .checkbox__li{
        display: inline-block;
        position: relative;
        margin-left: 1rem;
    }

    .checkbox__input {
        display: none;
    }
    .checkbox__text {
        display: inline-block;
        position: relative;
        padding: 0.8rem 0.8rem 0.8rem 3rem;
        border-radius: 2rem;
        border: 1px solid lightgray;
    }

    .checkbox__button {
        position: absolute;
        top: 0.6rem;
        left: 0.6rem;
        width: 0.1rem;
        height: 0.1rem;
        border: 0.8rem solid black;
        border-radius: 1rem;
        box-shadow: 0 2px 5px rgba(0,0,0,.3);
        transition: .3s;
    }
    .checkbox__i {
        position: absolute;
        font-size: 1.1rem;
        color: white;
        top: 0.7rem;
        left: 0.8rem;

    }
    .checkbox__input:checked  ~ .checkbox__button{
        top: 0.6rem;
        left: 0.6rem;
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid #000000;
    }
    /*Для ночного режима*/
    .checkbox__input:checked  ~ .checkbox__i{
        font-size: 0;
    }

    .save{
        text-align: center;
        color: #36a8f1 ;
        font: bold italic 1.2rem sans-serif;
        cursor: pointer;
        margin-left: 2%;
        background-color: white;
        border: 1px  solid lightgray;
        border-radius: 19px;
        padding: 0.6rem;
    }

    .stage, .stage2{
        margin: auto;
        position: relative;
    }

    .stage canvas { position: absolute; }
    .stage :first-child  { z-index: 2; }
    /*canvas{*/
    /*    border: 1px solid black;*/

    /*}*/
</style>
