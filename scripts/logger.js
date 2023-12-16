    class Logger{
        constructor(){
            if(TEST){
                this.i=console.log;
                this.w=console.warn;
            }else{
                this.i=this.w=function(){};
            }
            this.e=console.error;
        }
    }