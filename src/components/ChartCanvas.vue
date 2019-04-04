<template>

    <div  :class="{ night: isNight }">

        <div class="stage"  :width = "prevWidth" :height="mainHeight+100">
            <canvas ref="board" :width = "prevWidth" :height="mainHeight+100"

                    @mouseenter="mainEnter"
                    @mousemove="mainMove"
                    @mouseleave="mainUp"

            ></canvas>

            <canvas ref="main" :width = "prevWidth" :height="mainHeight+100"

            ></canvas>



        </div>


        <br>
        <canvas ref="preview" :width = "prevWidth" :height="this.prevHeight+10"
                @mousedown="previewDown"
                @mousemove="previewMove"
                @mouseup="previewUp"
                @mouseleave="previewUp"
        ></canvas>
        <br>


        <ul class="checkbox">
            <li class="checkbox__li" v-for ="(val,key) in names">

                <label >
                    <input class="checkbox__input" type="checkbox"  :value="key" @change="updateGraph(key)">
                    <span class="checkbox__button" :style="{'border-color': colors[key] }"></span>
                    <i class="checkbox__i" >&#10004;</i>
                    <span class="checkbox__text"
                          :style="isNight?{color: 'white','border-color':'#40566b'}:''">{{val}}</span></label>

                <br>
            </li>
        </ul>
        <br>

        <a  :href="file" class="save"  download="chart" @click="save">Save chart</a>

        <p v-if="isNight"class="night-mode"  @click="switchDay">Switch to Day Mode </p>
        <p v-else class="night-mode"   @click="switchDay">Switch to Night Mode </p>

    </div>


</template>

<script>
    export default {
        props: ['chart'],
        data: function () {
            return {
                ctxPreview: 0, // Контекст предпросмотра
                ctxMain: 0,    //  Главный график
                ctxBoard: 0,     //Информатор
                //Данные json
                colors:{},   //Хранит цвета в виде {y0:#fff}
                names: {},   //Хранит имена в виде {y0:#0}
                types:{},    //Хранит типы в виде {y0:'line'}
                columns: {}, //Хранит хначения в виде  { "columns": [   ['x','1099090'],['y0','32'],['y1','342'] ] }
                //Данные объекта
                prevWidth: 1080,        // Ширина всех холстов
                prevHeight: 80,         // Высота предпросмотра
                mainHeight: 600,        // Высота главного холста
                // Хранение координат предпросмотра для переиспользования
                previewCoord: [],    //   [ [122, 'y0'] ,[123,'y1']]
                // максимальное значение данных в columns для y координат
                maxValue: 1,
                countLine: 5,  // соличество линий на главной
                boxXcoord: this.$options.init.boxXcoord,  // начальная координата х коробки
                boxWidth: this.$options.init.boxWidth,    //начальная ширина коробки
                //превратить в актив
                activGraph: [],   // массив содержащий неактивные графики в виде ['y0','y1']
                xOffset: 0,   // смешение от края экрана можно удалить и использовать layerX вместо pageX в будущем
                selectedBox: false, // флаг выбора самой коробки
                selectedLeftSide: false, // флаг выбора левого столбца коробки
                selectedRightSide: false, // флаг выбора правого столбца коробки
                timeId: 0,  // таймер для сброса анимации
                mouseX:0,   // текущее положение мышки
                mainData:[],  // массив значений из columns находящейся между start and end т.е. данные непосредственно сейчас отображаемые
                currentData:[],  // данные из columns на которых сейчас инфоДоска
                step:0,  // шаг для координаты х на главном холсте
                isNight: false,  // флаг для перехода в ночной режим и обратно
                ratioMain: 1,   // отношение к системе координат холста и значений данных из colimns
                // набор цветов по умолчанию дневного режима можно переопределить на все графики
                timeColor: this.$options.dayColor,
                datesArr:[],
                file:''
            }
        },
        init:{
            boxXcoord:800,
            boxWidth:280,
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
            gLine:"rgba(64,86,107,0.5)",
            textInfo: "#fff",
            board: "#2b384a",
        },

        watch: {
            chart:function (){
                this.init();
                console.log('Я готов');
            },

        },
        computed: {
            // геттер вычисляемого значения
            xStep: function () {
                return  this.prevWidth/(this.columns[0].length - 1);
            },
            // Сдвигаем на 1 чтобы в результирующих массивах всегда пропускался первый индекс
            // в котором информация
            start: function () {
                return  this.boxXcoord/this.xStep +1;

            },

            end: function () {
                return this.start + this.boxWidth/this.xStep;
            },

            // Высляються цифры в левой шкале
            metricValue: function () {
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
                    this.setPreviewCoord();
                    this.draw();

                }else{
                    this.defaultDraw();
                }


                // console.log(' this.activGraph', this.activGraph);
            },


            ///////////////////////Night - Day///////////////////////////////

            switchDay(){
                this.isNight=!this.isNight;

                if(this.isNight){
                    this.timeColor = this.$options.nightColor;
                }else{
                    this.timeColor = this.$options.dayColor;
                }

                if(this.activGraph.length)  {
                    this.draw();
                }else{
                    this.defaultDraw();
                }

            },
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
            previewDown(e){

                if(!this.activGraph.length) return;

                let self = this;
                let mouseX = e.pageX-this.xOffset;

                //  console.log('this.mouseX',this.mouseX);
                if(this.isIntoLeftSide(mouseX)){
                    this.selectedLeftSide = true;
                    //  console.log('Попал в левую рамку');

                    self.timeId =  setInterval(function() {
                        self.draw();
                    }, 50);

                }else if(this.isIntoRightSide(mouseX)){

                    this.selectedRightSide = true;
                    //   console.log('Попал в правую рамку');s

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
                if(!this.activGraph.length) return;

                this.selectedBox = false;
                this.selectedLeftSide = false;
                this.selectedRightSide = false;

                clearInterval(this.timeId);

            },

            previewMove(e){

                if(!this.activGraph.length) return;
                if(this.selectedLeftSide){
                    //Нужно изменить параметры которые влияют на рисование коробки
                    // коробка будет отрисовываться сама благодорая интервалам
                    let mouseX = e.pageX-this.xOffset;
                    // высталсяем мыш на начало элемента

                    // сохраним левую х координату
                    let saveboxXcoord = this.boxXcoord;
                    //елси пользователь двигает мышь влево то новое значение координат будет уменьшаться
                    // если в право то увеличиваться
                    //новое значение измениться на небольшую величину
                    this.boxXcoord = mouseX;
                    // берем старую шинину
                    let newWidth = this.boxWidth;
                    // разница будет положительно если мыш пошла в лево
                    // и на эту небольшую величину изменяем ширину коробки
                    newWidth +=saveboxXcoord - this.boxXcoord;

                    // если мы шли в право и уменьшили ширину до 300
                    // тогда останавливаем продвижение и все
                    // при этом не трогаем ширину если ее поменять будет немного дергаться
                    if( newWidth <= this.$options.init.boxWidth){
                        this.boxXcoord = saveboxXcoord;

                    }else{
                        this.boxWidth = newWidth;

                    }

                    // console.log('this.boxXcoord',this.boxXcoord );
                    // console.log('this.boxWidth',this.boxWidth );



                }else if(this.selectedRightSide){
                    let mouseX = e.pageX-this.xOffset;
                    // получаем координату х на границе правой стороны
                    let xRight = this.boxXcoord + this.boxWidth;

                    // Вычисляем разницу если мышь идет в право
                    // значение положительно и нужно увеличивать коробку
                    let delta  = mouseX - xRight;

                    //Увеличиваем коробку или уменьшаем если delta в минусе
                    let newWidth = this.boxWidth + delta;

                    // проверка границ сначала на размер коробки затем
                    // на выход из холста если все нормально изменяем ширину на новую
                    if(newWidth <= this.$options.init.boxWidth){
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
                    let mouseX = e.pageX-this.xOffset;

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
                console.log('я вошел');
                if(!this.activGraph.length) return;
                this.timeId = requestAnimationFrame(this.drawInfoBoard);
            },
            mainUp(e){
                console.log('я вышел');
                if(!this.activGraph.length) return;
                cancelAnimationFrame(this.timeId);
                // Стираем информатор
                this.ctxBoard.clearRect(0, -this.mainHeight-50, this.prevWidth, this.mainHeight+100);
            },

            mainMove(e){


                if(!this.activGraph.length) return;

                let self = this;

                let mouse = e.pageX-self.xOffset;

                for ( let i =0,j =0; i< self.prevWidth; i+=self.step,j++){
                    let prev = i-self.step;
                    let center = i-this.step/2;
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

                    let date = new Date(self.mainData[0][j]).toLocaleString("en-US",options);
                    self.currentData =[];
                    self.currentData.push(date);
                    for(let m = 1; m <self.mainData.length; m++){
                        self.currentData.push( self.mainData[m][j]);
                    }
                }

            },




            drawInfoBoard(){

                console.log('я рисую доску');
                let ctx = this.ctxBoard;
                let self = this;
                ctx.clearRect(0, -this.mainHeight-50, this.prevWidth, this.mainHeight+100);

                //Для доски и кружочков
                ctx.fillStyle =this.timeColor.board;
                // Используеться для вычислений и для установки размеров текущихданных///
                ctx.font="bold 25px sans-serif";
                ctx.save();
                ctx.strokeStyle=this.timeColor.box;                     ///
                drawVerticalLine();

                ctx.shadowBlur = 2;                             ///
                ctx.shadowColor = "rgba(0, 0, 0, 0.3)";         ///

                let widthBoard = this.prevWidth/7;          // Начальная ширина доски 135
                let hei = this.mainHeight/6;                 //Высота доски  100
                const space = 20;

                // значение отступа сверху подобрал эксперементально где-то 25 -30 нормально
                // и перевел в динамику
                const yS = hei/3.5;

                //расстояние между словами
                let name='';
                let textWidthArr=[];
                // первое значение дату пропускаем
                //Сначала измеряем текст
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


                drawCurrentData();

                ctx.fillStyle =self.timeColor.textInfo;
                ctx.font="20px sans-serif";
                drawDates();

                ctx.font=" 16px sans-serif";
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

                        let y = -self.currentData[i]/self.ratioMain;

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
                this.mainData=[];

                let yArray  = this.columns[0];
                tempArray = yArray.slice(this.start,this.end);
                this.mainData.push(tempArray);

                //В цикле только данные по Y
                for(let i = 1; i < this.columns.length;i++ ) {
                    yArray  = this.columns[i];
                    if(this.activGraph.indexOf(yArray[0]) === -1){
                        continue;
                    }
                    tempArray = yArray.slice(this.start,this.end);
                    this.mainData.push(tempArray);
                }
                this.step =    this.prevWidth/tempArray.length;

            },

            getPreviewRatio(){
                let maxArray = [];
                //Пропускаем первый элемент массива содержащий даты
                for(let i = 1; i < this.columns.length;i++ ){
                    let y  = this.columns[i];
                    if(this.activGraph.indexOf(y[0])=== -1){
                        continue;
                    }
                    let temp = y[0];
                    y[0]=0;  //MAth.max работает только с цифрами
                    maxArray.push(Math.max.apply(null,y));
                    y[0]=temp;
                }
                let maxValue = Math.max.apply(null,maxArray);

                let ratioPreview = maxValue/this.prevHeight;
                ratioPreview =   Math.round(ratioPreview * 100) / 100;  //округляем до 0,00

                return ratioPreview;
                // console.log("maxValue",maxValue);
                // console.log("ratioPreview",this.ratioPreview);

            },
            setMainRatio(){
                let maxArray = [];

                for(let i = 1; i < this.mainData.length;i++ ){
                    let y  = this.mainData[i];
                    maxArray.push(Math.max.apply(null,y));
                }

                this.maxValue = Math.max.apply(null,maxArray);

                this.ratioMain =  this.maxValue/this.mainHeight;
                this.ratioMain =   Math.round(this.ratioMain * 100) / 100;

                //    console.log("ratioMain",this.ratioMain);
            },

            drawGraph(yCoord ,ctx,color,step){
                console.log('я рисую график');
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

            drawBox(ctx){
                console.log('я рисую коробку');

                ctx.strokeStyle=this.timeColor.box;
                //Координата правой часта коробки
                let rightSideBox = this.boxXcoord + this.boxWidth;

                // Затем главный бокс

                let widthLine = 15;
                let r =widthLine/2;  //r нам нужен чтобы рамка рисовалась внутри холста без него она выходит за холст на половину
                ctx.lineWidth =widthLine;

                ctx.beginPath();
                ctx.moveTo(this.boxXcoord+r,-this.prevHeight-5);
                ctx.lineTo(this.boxXcoord+r,5);
                ctx.moveTo(rightSideBox-r,-this.prevHeight-5);
                ctx.lineTo(rightSideBox-r,5);
                ctx.stroke();

                ctx.lineWidth =4;
                ctx.beginPath();
                ctx.moveTo(this.boxXcoord,-this.prevHeight-5);
                ctx.lineTo(rightSideBox,-this.prevHeight-5);
                ctx.moveTo(rightSideBox,5);
                ctx.lineTo(this.boxXcoord,5);
                ctx.stroke();

            },
            drawFillBox(ctx){

                ctx.fillStyle = this.timeColor.fillPreview;
                let rightSideBox = this.boxXcoord + this.boxWidth;
                ctx.fillRect(0,-this.prevHeight-5,this.boxXcoord, this.prevHeight+10);
                ctx.fillRect(rightSideBox,-this.prevHeight-5,this.prevWidth-rightSideBox, this.prevHeight+10);
            },

            drawMetrics(ctx){

                //Шрифт и цвет для обоих метрик

                ctx.fillStyle = this.timeColor.metrics;
                ctx.strokeStyle = this.timeColor.gLine;
                ctx.font = "16px sans-serif";

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
                                ctx.fillText(date[i], x-20, 20);
                            }
                        }
                        x+=step;
                    }
                    ctx.stroke();
                }
            },

            drawYmeter(ctx){
                console.log('я рисую Y метрики');
                ctx.fillText('0', 5, -5);
                ctx.beginPath();
                for(let i =0 ; i < this.countLine+1 ; i++){
                    ctx.moveTo(0,-this.shiftY*i);
                    ctx.lineTo(this.prevWidth ,-this.shiftY*i);
                    ctx.fillText(this.metricValue*i, 5, -this.shiftY*i-5);
                }
                ctx.stroke();

            },
            setPreviewCoord(){

                let ratioPreview  = this.getPreviewRatio(); //Достаточно обновлять только при инициалиции и переключении графиков
                this.previewCoord=[];
                let yCoord = [];
                for(let i = 1; i < this.columns.length;i++ ) {
                    let yArray  = this.columns[i];

                    if(this.activGraph.indexOf(yArray[0])=== -1){
                        continue;
                    }
                    for(let j = 1 ; j < yArray.length; j++ ) {
                        yCoord.push(-yArray[j]/ratioPreview);           //Переводим в отрицательную плоскость canvas
                    }

                    this.previewCoord.push(yCoord);
                    yCoord = [];
                }
            },
            drawPreviewGraphs(ctxPreview){

                console.log('я рисую превью графики');
                for(let i = 0; i < this.previewCoord.length;i++ ) {
                    let tempArray =  this.previewCoord[i];
                    let color =   this.colors[this.activGraph[i]];

                    this.drawGraph(tempArray,ctxPreview,color,this.xStep);
                }
            },

            drawMainGraphs(ctxMain){
                console.log('я рисую главный график');

                let yCoord = [];
                for(let i = 1; i < this.mainData.length;i++ ) {
                    let yArray  = this.mainData[i];
                    for(let i = 0 ; i < yArray.length;i++ ) {
                        yCoord.push(-yArray[i]/this.ratioMain);           //Переводим в отрицательную плоскость canvas
                    }
                    let color =   this.colors[this.activGraph[i-1]];
                    this.drawGraph(yCoord,ctxMain,color,this.step);
                    yCoord = [];
                }
            },

            draw(){
                let ctxMain =this.ctxMain;
                let ctxPreview = this.ctxPreview;

                //очищаем холст

                ctxPreview.clearRect(0, -this.prevHeight-5, this.prevWidth, this.prevHeight+10);
                ctxMain.clearRect(0, -this.mainHeight-50, this.prevWidth, this.mainHeight+100);

                // Сначала заполнаем массив данных от start До end
                this.setCurrentMainData();

                // Вычисляем шаги и отношения
                this.setMainRatio();
                // Метрики главного графика

                this.drawMetrics(ctxMain);
                // Все графики

                //Коробка предпросмотра
                this.drawBox(ctxPreview);
                ctxPreview.lineWidth =2;  // восстановили значение

                this.drawPreviewGraphs(ctxPreview);
                this.drawMainGraphs(ctxMain);

                // Затенение оставшейся части предпросмотра
                this.drawFillBox(ctxPreview);


            },
            defaultDraw(){
                let ctxMain =this.ctxMain;
                let ctxPreview = this.ctxPreview;

                //очищаем холст
                ctxPreview.clearRect(0, -this.prevHeight-5, this.prevWidth, this.prevHeight+10);
                ctxMain.clearRect(0, -this.mainHeight-50, this.prevWidth, this.mainHeight+100);

                ctxPreview.fillStyle = this.timeColor.gLine;
                ctxMain.fillStyle = this.timeColor.gLine;

                ctxPreview.fillRect(0, -this.prevHeight-5, this.prevWidth, this.prevHeight+10);
                ctxMain.fillRect(0, -this.mainHeight-50, this.prevWidth, this.mainHeight+100);


                ctxMain.strokeStyle ='#000';
                ctxMain.fillText('0', 5, -5);


                ctxMain.beginPath();
                for(let i =0 ; i < this.countLine+1 ; i++){
                    ctxMain.moveTo(0,-this.shiftY*i);
                    ctxMain.lineTo(this.prevWidth ,-this.shiftY*i);

                }
                ctxMain.stroke();

            },
            init(data){

                let canvasPreview = this.$refs.preview;
                this.ctxPreview = canvasPreview.getContext('2d');
                let canvasMain = this.$refs.main;
                this.ctxMain = canvasMain.getContext('2d');

                let canvasBoard = this.$refs.board;
                this.ctxBoard = canvasBoard.getContext('2d');

                this.colors = this.chart.colors;
                this.names = this.chart.names;
                this.types = this.chart.types;
                this.columns =  this.chart.columns;

                //Воостанавливаем чистые настройки контекстов
                this.ctxPreview.restore();
                this.ctxMain.restore();
                this.ctxBoard.restore();
                // а затем сохраняем чистые
                this.ctxPreview.save();
                this.ctxMain.save();
                this.ctxBoard.save();
                //переводим сисмему координат на низ холста
                this.ctxPreview.translate(0,this.prevHeight+5); //сдвиг по высоте
                this.ctxMain.translate(0,this.mainHeight+50);   // На графике ниже нулевой линии положительная плоскость Y холста
                this.ctxBoard.translate(0,this.mainHeight+50);
                //Ставлю коробку на место возможно временно
                this.boxXcoord =  800;
                this.boxWidth = 280;


                this.activGraph = Object.keys(this.colors);
                console.log(' this.activGraph', this.activGraph);
                // инициализируем смещение от левого края холста
                let coords    = this.getCoords(canvasPreview);
                this.xOffset = coords.left;
                // console.log('this.xOffset',this.xOffset);




                // Ставим линии пошире и рисуем
                this.ctxMain.lineWidth=2;
                this.ctxPreview.lineWidth=2;
                // Заполняем массив превью коорд
                // что бы потом его не персчитывать при перерисовке
                // а только при смене графиков

                this.setDateArray();
                this.setPreviewCoord();


                this.draw();

            }
        },
        created(){
            console.log('mounted');
        },
        mounted(){
            this.init();
            console.log('mounted');
        },

        name: "ChartCanvas"
    }
</script>

<style scoped>
    .checkbox{
        list-style: none;
        padding: 5px;
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
        border: 2px solid black;
    }
    /*Для ночного режима*/
    .checkbox__input:checked  ~ .checkbox__i{
        font-size: 0;
    }


    .night-mode{
        text-align: center;
        color: #36a8f1 ;
        font: bold italic 2.5rem sans-serif;
        cursor: pointer;
    }
    .save{
        text-align: center;
        color: #36a8f1 ;
        font: bold italic 1.5rem sans-serif;
        cursor: pointer;
        margin-left: 2%;
        text-decoration: none;
    }
    .night{
        background-color: #293647;
    }


    .stage {
        width: 1080px;
        height: 700px;
        position: relative;

    }

    .stage canvas { position: absolute; }
    .stage :first-child  { z-index: 2; }
</style>
