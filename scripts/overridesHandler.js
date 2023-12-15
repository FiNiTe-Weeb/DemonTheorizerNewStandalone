class OverridesHandler{
        constructor(){
            this.overrides={}; //e.g. {1:{prog:Number(progress1)}, {2:{prog:Number(progress2)}}}
        }

        regenTRecs(player){
            log.w("regenTRecs shouldn't be necessary if everything is working right");
            player.tRecs={...player.rRecs};
            for(let key in this.overrides){
                let o=this.overrides[key];
                player.tRecs[key]=o.prog;
            }
        }

        clearOverrides(){
            this.overrides={};
        }

        //plan: give a set of tRecs and this func should figure out the differences
        figureOutOverrides(tRecs){
            //todo
        }

        //todo: actually show overrides if they exist when this command runs, (atm its just used for clearing so not an issue lol)
        reloadHTMLList(){
            let listEl=document.getElementById("override-list");
			if(listEl){
				listEl.innerHTML="";//idk if theres a more elegant way to delete children
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

        updateOutput(){
            let diff=calcState.currentPlayer.getPtsDelta();
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
            resultEl.innerText="Theoretical pts: "+round(calcState.currentPlayer.ptsTheoretical)+", real pts: "+round(calcState.currentPlayer.ptsLocal)+", resulting in a difference of "+(diff>0?"+":"")+round(diff)+" pts.";
        }

        /*
        * @param demID - lvl id
        * @param override - e.g. {prog:100}
        */
        addOverride(demID,prog,player){
            let overrideExisted=!!this.overrides[demID];
            this.overrides[demID]={prog:prog};
            player.addTheoreticalRecord(demID,prog);
            let listEl=document.getElementById("override-list");

            let overrideEl;
            if(overrideExisted){
                overrideEl=this.findOverrideEl(demID);
            }

            //if override didnt exist OR if it existed but couldnt find the element for it
            if(!overrideEl){
                overrideEl=document.createElement("li");
                overrideEl.setAttribute("data-demID",demID);
                overrideEl.setAttribute("style","font-size:16px;");
                listEl.appendChild(overrideEl);
            }

            overrideEl.innerText=prog+"% on "+calcState.getDemonByID(demID).name+", for "+round(getPointsForRecord(demID,prog))+"pts";
            let btnRemove=document.createElement("button");
            btnRemove.innerHTML="&#10060;";
            btnRemove.addEventListener("click",function(){calcState.currentPlayer.oHandler.removeOverride(demID,calcState.currentPlayer);});
            btnRemove.classList.add("remove-override");
            overrideEl.appendChild(btnRemove);

            this.updateOutput();
        }

        removeOverride(demID,player){
            delete this.overrides[demID];
            player.undoTRec(demID);
            let listEl=document.getElementById("override-list");
            let trgEl=this.findOverrideEl(demID);
            if(trgEl){
                listEl.removeChild(trgEl);
            }
            this.updateOutput();
        }
    }