class PlayerState{
        constructor(id=null){
            this.id=id; //id is integer
            this.rRecs=null; //rRecs is real records, tRecs is theoretical records
            this.tRecs=null; //both rRecs and tRecs are null at first, when initialized, they are object where key is demonID, and value is record info todo: update desc
            this.ptsLocal=0;//real pts calculated by this script
            this.ptsTheoretical=0;//theoretical pts calculated by this script
            this.ptsRemote=null;//unused until api outputs it, todo: ask sta to add it so i can check if my script is working properly in realtime
            this.oHandler=new OverridesHandler();
            this.ready=false;
			if(id===0){
				this.initEmptyPlayer();
			}
            else if(id!=null){
                this.loadPlayerInfo();
            }
        }

        loadPlayerInfo(){
            let thisRef=this;
			let apiInstance=ApiInterface.getCurrentApiInstance();
			apiInstance.getPlayerRecords(this.id).then(function(records){
				thisRef.rRecs=records;
				
				//put real records
				let rRecsList=document.getElementById("og-record-list");
				rRecsList.innerHTML=""; //clear old
				for(let key in thisRef.rRecs){
				let demID=Number(key);
					let r=thisRef.rRecs[key];
					let demon=apiInstance.getLevelByID(demID);
					if(demon){
						let item=document.createElement("span");
						item.innerText=r.progress+"% on "+demon.name+", for "+apiInstance.score(demID,r.prog)+" pts";
						rRecsList.appendChild(item);
						rRecsList.appendChild(document.createElement("br"));
					}
					
				}

                //calc real pts
                let pts=getPtsFromArr(thisRef.rRecs);
                thisRef.ptsLocal=pts;
                thisRef.initTRecs();
                thisRef.updateTheoreticalPoints();
                thisRef.oHandler.updateOverridesList();
                thisRef.ready=true;
            });
        }
		
		initEmptyPlayer(){
            let thisRef=this;
            thisRef.rRecs={};
			let rRecsList=document.getElementById("og-record-list");
			rRecsList.innerHTML=""; //clear old
            thisRef.ptsLocal=0;
            thisRef.initTRecs();
            thisRef.updateTheoreticalPoints();
            let diff=0;
            let resultEl=document.getElementById("overrides-result");
            resultEl.style.backgroundColor="rgba(191,191,191,0.20)";
            resultEl.style.borderColor="rgba(191,191,191,1)";
            resultEl.innerText="Theoretical pts: "+0+", real pts: "+0+", resulting in a difference of "+(diff>0?"+":"")+round(diff)+" pts.";
            thisRef.ready=true;
		}

        initTRecs(){
            this.tRecs={...this.rRecs};
        }

        addTheoreticalRecord(demID,prog){
            if(this.tRecs==null){
                this.initTRecs();
            }
            this.tRecs[demID]={progress:prog};
            this.updateTheoreticalPoints();
        }

        undoTRec(demID){
            let rRec=this.rRecs[demID];
            if(rRec){
                this.tRecs[demID]={prog:rRec.prog};
            }else{
                delete this.tRecs[demID];
            }
            this.updateTheoreticalPoints();
        }

        updateTheoreticalPoints(){
            let theoreticalPts=getPtsFromArr(this.tRecs);
            this.ptsTheoretical=theoreticalPts;
        }

        getPtsDelta(){
            return this.ptsTheoretical-this.ptsLocal;
        }
    }