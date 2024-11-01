class ApiInsaneDemonList extends ApiInterface{
	
	constructor(){
		super("https://insanedemonlist.com/api/");
		this.playerData=[];
		this.levelNameToID={};
		this.formulas={
			"Latest":this.pointsFormula,
			"Pre 2024/06/18":this.pointsFormulaPre2024_06_18,
		};
	}
	
	init(){
		let thisRef=this;
		let levelPromise=fetch(this.endpoint+"levels").then(function(resp){
			if(!resp.ok){
				return Promise.reject(resp);
			}
			return resp.json();
		}).then(function(data){
			thisRef.levelData={};
			thisRef.levelPositionToId={};
			thisRef.levelIDtoIndex={};
			let counter=0;
			for(let key in data){
				let item=data[key];
				let pos=counter+1;
				thisRef.levelData[counter]={
					id:item.id,
					name:item.name,
					position:pos
				};
				thisRef.levelPositionToId[pos]=item.id;
				thisRef.levelIDtoIndex[item.id]=counter;
				thisRef.levelNameToID[item.name]=item.id; //todo: prob wont need this
				counter++;
			}
			
		});
		let playerPromise=fetch(this.endpoint+"leaderboards?all=true").then(function(resp){
			if(!resp.ok){
				return Promise.reject(resp);
			}
			return resp.json();
		}).then(function(data){
			for(let i=0;i<data.length;i++){
				let item=data[i];
				thisRef.playerData.push({
					id:item.id,
					name:item.name,
					rank:item.position,
					score:item.records
				});
			}
		});
		Promise.all([levelPromise,playerPromise]).then(function(){
			thisRef.ready=true;
			thisRef.callOnLoad();
		}).catch(this.callOnFail);
	}
	
	searchPlayer(name){
		let thisRef=this;
		return new Promise(function(res){
			name=name.toLowerCase();
			let foundPlayers=[];
			for(let key in thisRef.playerData){ //we want results to appear sorted so we loop this array
				let item=thisRef.playerData[key];
				if(item.name.toLowerCase().indexOf(name)>=0){
					foundPlayers.push(item);
				}
			}
			res(foundPlayers);
		});
	}
	
	getPlayerData(playerID,forceUpdate){
		//this.loadedPlayersData={};
		if(this.loadedPlayersData&&this.loadedPlayersData[playerID]&&(!forceUpdate)){
			return Promise.resolve(this.loadedPlayersData[playerID]);
		}
		let thisRef=this;
		return fetchJSON(this.endpoint+"leaderboard/"+playerID).then(function(data){
			thisRef.loadedPlayersData[playerID]=data;
			return data;
		});
	}
	
	getPlayerRecords(playerData){
		let recs={};
		for(let key in playerData.records){
			let item=playerData.records[key];
			recs[item.level.id]={progress:100};
		}
		return recs;
	}

    /*
    * @param score - Get estimated rank for el score
	* @return -2 if not implemented, -1 on err, else rank estimate
    */
    getRankEstimate(score,playerID=0){
		let actualRank=Infinity;
		if(playerID!=0){
			for(let playerKey in this.playerData){
				if(playerID==this.playerData[playerKey].id){
					actualRank=this.playerData[playerKey].rank;
					break;
				}
			}
		}
		if(this.playerData!=null){
			for(let i=0;i<this.playerData.length;i++){ //we need to go thru sorted arr so as soon as score reaches low enough we hit target rank
				if(round(score)>=round(this.playerData[i].score)){
					let rank=i+1;
					if(actualRank<rank){rank--;} //if their real rank is above (smaller) their theoretical rank, we remove 1 from the rank to account for the fact there should be 1 less spot taken
					return rank;
				}
			}
			return this.playerData.length+1;
		}
		return -1;
		
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
    * @param position - Ranking on the list
    * @param progress - % Achieved by player
    * @param requirement - % Required for points
    */
	pointsFormula(position=1,progress=100,requirement=100){
        if(progress>100){progress=100;}//sorry guys ur not allowed to have fun :trol
        if(progress<requirement){
            return 0;
        }else{
			let scorePerLevel=1.2583892617449663;//(250-62.5)/149
			let scoreForTop1=250;
            let score;
            if(0<position && position<=150){
				score=scoreForTop1-((position-1)*1.2583892617449663);
            }else{
                score=0;
            }
            if(progress!==100){
                score=0;
            }
            return score;
        }
	}
	
	/*
    * points formula copied from pointercrate
    * @param position - Ranking on the list
    * @param progress - % Achieved by player
    * @param requirement - % Required for points
    */
	pointsFormulaPre2024_06_18(position=1,progress=100,requirement=50){
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
	
	/*
	 * RETURNS NEW OBJ EACH TIME WHICH CAN BE MUTATED
	*/
	getRecordSortKeys(){
		return [
			{key:"points",ascending:false},
			{key:"position",ascending:true}
		];
	}
}