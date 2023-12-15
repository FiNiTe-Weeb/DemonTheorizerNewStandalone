    class Logger{
        constructor(){
            if(TEST){
                this.i=function (){console.log(...arguments);}
                this.w=function (){console.warn(...arguments);}
            }else{
                this.i=this.w=function(){};
            }
            this.e=function(){console.error(...arguments);}
        }
    }