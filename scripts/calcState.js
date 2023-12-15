	class CalcState{
        constructor(){
            this.currentPlayer=new PlayerState(0);
            this.demonsData=null;
            this.demonPositionToId=null;
            this.demonIDtoIndex=null;
            this.ready=false;
        }


        getDemonByID(id){
            if(!this.ready){
                log.e("Demons data not loaded yet.");
                return null;
            }
            return this.demonsData[this.demonIDtoIndex[id]];
        }

        getDemonByPosition(pos){
            return this.getDemonByID(this.demonPositionToId[pos]);
        }

        processNewDemons(demons){
            this.demonsData=demons;
            this.demonPositionToId={};
            this.demonIDtoIndex={};
            for(let i=0;i<demons.length;i++){
                this.demonPositionToId[demons[i].position]=demons[i].id;
                this.demonIDtoIndex[demons[i].id]=i;
            }
            this.ready=true;
        }
    }