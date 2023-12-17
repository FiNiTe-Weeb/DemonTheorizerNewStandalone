class OverridesHandler{
        constructor(player){
            this.overrides={}; //e.g. {1:{prog:Number(progress1)}, {2:{prog:Number(progress2)}}} (key is level id)
			this.player=player;
			this.lastFormula=ApiInterface.getCurrentApiInstance().currentFormula;
        }

		//todo: temp, wont be needed after lmao
        regenTRecs(){
            this.player.tRecs={...this.player.rRecs};
            for(let key in this.overrides){
                let o=this.overrides[key];
                this.player.tRecs[key]={progress:o.prog};
            }
        }

        clearOverrides(){
            this.overrides={};
        }

        //plan: give a set of tRecs and this func should figure out the differences
        figureOutOverrides(tRecs){
            //todo
        }

		//update override list and the difference showing box thing below
        updateOverridesList(){
            let listEl=document.getElementById("override-list");
			let formula=ApiInterface.getCurrentApiInstance().currentFormula;
			let formulaChanged=formula!=this.lastFormula;
			this.lastFormula=formula;
			if(listEl){
				
				//find override elements that should be removed
				for(let i=listEl.children.length-1;i>=0;i--){
					let id=listEl.children[i].dataset.demid;
					if(formulaChanged||(!this.overrides[id])){
						this.removeOverrideHTML(id);
					}
				}
				
				//add elements for new overrides
				for(let key in this.overrides){
					if(!this.findOverrideEl(key)){
						this.addOverrideHTML(key,this.overrides[key].prog);
					}
				}
				this.updateOutput();
			}
        }

        findOverrideEl(demID){
            let listEl=document.getElementById("override-list");
            for(let i=0;i<listEl.children.length;i++){
                let item=listEl.children[i];
                if(item.getAttribute("data-demID")==demID){
                    return item;
                }
            }
            return null;
        }

		//update the difference showing box thing below
        updateOutput(){
            let diff=this.player.getPtsDelta();
            let resultEl=document.getElementById("overrides-result");
            switch(Math.sign(diff)){
                case 1:
                    resultEl.style.backgroundColor="rgba(0,255,0,0.20)";
                    resultEl.style.borderColor="rgba(0,255,0,1)";
                break;
                case 0:
                    resultEl.style.backgroundColor="rgba(191,191,191,0.20)";
                    resultEl.style.borderColor="rgba(191,191,191,1)";
                break;
                case -1:
                    resultEl.style.backgroundColor="rgba(255,0,0,0.20)";
                    resultEl.style.borderColor="rgba(255,0,0,1)";
                break;
            }
            resultEl.innerText="Theoretical pts: "+round(this.player.ptsTheoretical)+", real pts: "+round(this.player.ptsLocal)+", resulting in a difference of "+(diff>0?"+":"")+round(diff)+" pts.";
        }
		
		addOverrideHTML(demID,prog){
            let listEl=document.getElementById("override-list");

            let overrideEl=this.findOverrideEl(demID);

            //if override didnt exist OR if it existed but couldnt find the element for it
            if(!overrideEl){
                overrideEl=document.createElement("li");
                overrideEl.setAttribute("data-demID",demID);
                overrideEl.setAttribute("style","font-size:16px;");
                listEl.appendChild(overrideEl);
            }

			let apiInstance=ApiInterface.getCurrentApiInstance();
            overrideEl.innerText=prog+"% on "+apiInstance.getLevelByID(demID).name+", for "+round(apiInstance.score(demID,prog))+"pts";
            let btnRemove=document.createElement("button");
            btnRemove.innerHTML="&#10060;";
			let thisRef=this;
            btnRemove.addEventListener("click",function(){thisRef.player.oHandler.removeOverride(demID,thisRef.player);});
            btnRemove.classList.add("remove-override");
            overrideEl.appendChild(btnRemove);

            this.updateOutput();
		}
		removeOverrideHTML(demID){
            let listEl=document.getElementById("override-list");
            let trgEl=this.findOverrideEl(demID);
            if(trgEl){
                listEl.removeChild(trgEl);
            }
            this.updateOutput();
		}

        /*
        * @param demID - lvl id
        * @param override - e.g. {prog:100}
        */
        addOverride(demID,prog,player){
            let overrideExisted=!!this.overrides[demID];
            this.overrides[demID]={prog:prog};
            player.addTheoreticalRecord(demID,prog);
			this.addOverrideHTML(demID,prog);
        }

        removeOverride(demID,player){
            delete this.overrides[demID];
            player.undoTRec(demID);
        }
    }