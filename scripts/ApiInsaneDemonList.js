class ApiInsaneDemonList extends ApiInterface{
	
	constructor(){
		super("https://insanedemonlist.com/api/");
		this.playerData={};
		this.sortedPlayerKeys=[];
		this.levelNameToID={};
		this.formulas={
			"Latest":this.pointsFormula,
		};
	}
	
	init(){
		let thisRef=this;
		let levelPromise=fetch(this.endpoint+"?start=1").then(function(resp){return resp.json();}).then(function(data){
			thisRef.levelData={};
			thisRef.levelPositionToId={};
			thisRef.levelIDtoIndex={};
			let counter=0;
			for(let key in data){
				let item=data[key];
				let pos=counter+1;
				thisRef.levelData[counter]={
					id:item._id,
					name:item.name,
					position:pos
				};
				thisRef.levelPositionToId[pos]=item._id;
				thisRef.levelIDtoIndex[item._id]=counter;
				thisRef.levelNameToID[item.name]=item._id;
				counter++;
			}
			
		});
		let playerPromise=fetch(this.endpoint+"leaderboard").then(function(resp){return resp.json();}).then(function(data){
			thisRef.playerData=data;
		});
		Promise.all([levelPromise,playerPromise]).then(function(){
			//prepare player data
			for(let key in thisRef.playerData){
				let item=thisRef.playerData[key];
				item.id=key; //when searching player, caller expects ids
				item.records={};
				for(let beatenLvl of item.levels){
					let lvlID=thisRef.levelNameToID[beatenLvl.name];
					item.records[lvlID]={
						progress:100,
						demon:{id:lvlID}
					}
				}				
				item.score=thisRef.getPtsFromArr(item.records);
				thisRef.sortedPlayerKeys.push(key);
			}
			//sort descending score order
			thisRef.sortedPlayerKeys.sort(function(a,b){
				let pA=thisRef.playerData[a];
				let pB=thisRef.playerData[b];
				return pB.score-pA.score;
			});
			//assign ranks
			for(let i=0;i<thisRef.sortedPlayerKeys.length;i++){
				thisRef.playerData[thisRef.sortedPlayerKeys[i]].rank=i+1;
			}
			thisRef.ready=true;
			thisRef.callOnLoad();
		});
	}
	
	searchPlayer(name){
		let thisRef=this;
		return new Promise(function(res){
			name=name.toLowerCase();
			let foundPlayers=[];
			for(let i=0;i<thisRef.sortedPlayerKeys.length;i++){
				let item=thisRef.playerData[thisRef.sortedPlayerKeys[i]];
				if(item.name.toLowerCase().indexOf(name)>=0){
					foundPlayers.push(item);
				}
			}
			res(foundPlayers);
		});
	}
	
	getPlayerData(playerID,forceUpdate){
		let thisRef=this;
		return new Promise(function(res,rej){
			let playerData=thisRef.playerData[playerID];
			if(playerData){
				res(playerData);
			}else{
				rej();
			}
		});
	}
	
	getPlayerRecords(playerID,forceUpdate){
		return this.getPlayerData(playerID,forceUpdate).then(function(data){
			return data.records;
		});
	}

    /*
    * calc points for a given demon id and percentage
    * @param levelID - ID of Demon
    * @param progress - % Achieved by player
	* @return number, the score for the record
    */
	score(levelID,progress){
        let level=this.getLevelByID(levelID);
		if(!level){
            log.e("Attempted to call getPointsForRecord on non-existant level!! id: "+levelID);
            return 0;
		}
		
        if(progress<100){
            return 0;
        }
        return this.formulas[this.currentFormula](level.position,progress,100);
	}
	
	/*
    * points formula copied from pointercrate
    * @param position - Ranking on the list
    * @param progress - % Achieved by player
    * @param requirement - % Required for points
    */
	pointsFormula(position=1,progress=100,requirement=50){
        if(progress>100){progress=100;}//sorry guys ur not allowed to have fun :trol
        if(progress<requirement){
            return 0;
        }else{//god this was a pain to write out
            let score;
            if(55<position && position<=150){
				let b=6.273;
                score=56.191*Math.pow(2,(54.147-(position+3.2))*((Math.log(50))/99))+b;
            } else if(35 < position && position <= 55){
                let g = 1.036;
                let h = 25.071;
                score=212.61 * Math.pow(g,1-position) + h;
            }else if(20 < position && position <= 35){
                let c = 1.0099685;
                let d = 31.152;
                score=(250-83.389)*Math.pow(c,2-position)-d; 
            }else if(0 < position && position <= 20){
                let e = 1.168;
                let f = 100.39;
                score=(250 - f) * (
                    Math.pow(e,1-position)
                ) + f
            }else{
                score=0;
            }
            if(progress!==100){
                score=
                (
                    score * Math.pow(5,
                    (
                        (progress - requirement)
                        /
                        (100 - requirement))
                    )
                )/10;
            }
            return score;
        }
	}

    /*
    * @param arr - Array where keys are demonIDs, and values have "progress" property, which is integer percentage progress.
    */
	//overwrite if needed (e.g. to add score weighing)
    getPtsFromArr(arr){
        let pts=0;
        for(let key in arr){
            let r=arr[key];
            pts+=this.score(key,r.progress);
        }
        return pts;
    }
	
	//to32bitFloat(num){
	//	let arr=new Float32Array(1);
	//	arr[0]=num;
	//	return arr[0];
	//}
}