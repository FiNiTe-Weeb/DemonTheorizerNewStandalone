class ApiLowRefreshRateList extends ApiInterface{
	
	constructor(){
		super("https://gdlrrlist.com/api/v1/");
		this.playerData={};
		this.sortedPlayerKeys=[];
		this.levelNameToID={};
		this.formulas={
			"Latest":this.pointsFormula,
		};
		this.maxRankingForProgress=75;
	}
	
	init(){
		let thisRef=this;
		let levelPromise=fetch(this.endpoint+"demons").then(function(resp){
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
					id:item._id,
					name:item.name,
					requirement:(!isNaN(item.minimumPercent))?item.minimumPercent:100,
					position:pos
				};
				thisRef.levelPositionToId[pos]=item._id;
				thisRef.levelIDtoIndex[item._id]=counter;
				thisRef.levelNameToID[item.name]=item._id;
				counter++;
			}
			
		});
		let playerPromise=fetch(this.endpoint+"leaderboard").then(function(resp){
			if(!resp.ok){
				return Promise.reject(resp);
			}
			return resp.json();
		}).then(function(data){
			thisRef.playerData=data;
		});
		Promise.all([levelPromise,playerPromise]).then(function(){
			//prepare player data
			for(let key in thisRef.playerData){
				let item=thisRef.playerData[key];
				item.id=key; //when searching player, caller expects ids
				item.records={};
				for(let beatenLvl of item.levels){
					let lvlID=thisRef.levelNameToID[beatenLvl];
					item.records[lvlID]={
						progress:100,
						demon:{id:lvlID}
					}
				}
				for(let prog of item.progs){
					if(prog=="none"){ //why is this a thing lmao
						continue;
					}
					let lvlID=thisRef.levelNameToID[prog.name];
					item.records[lvlID]={
						progress:Number(prog.percent),
						demon:{id:lvlID}
					}
				}
				if(item.records[undefined]){
					log.e("what");
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
		}).catch(this.callOnFail);
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
		let req=level.requirement;
		if(level.position>this.maxRankingForProgress){
			req=100;
		}
        return this.formulas[this.currentFormula](level.position,progress,req);
	}
	
	/*
    * points formula copied from pointercrate
    * @param position - Ranking on the list
    * @param progress - % Achieved by player
    * @param requirement - % Required for points
    */
	pointsFormula(position=1,progress=100,requirement=50){
        if(progress>100){progress=100;}//sorry guys ur not allowed to have fun :trol
		let score;
		if(position>150){
			return 0;
		}else if(position<=50){
			score=50.0 / (Math.pow(Math.E, 0.001 * position)) * Math.log((1 / (0.008 * position))); //stolen from whatever gdhpsk gave me
		}else if(position>50&&position<=100){
			score=50.0 / (Math.pow(Math.E, 0.01 * position)) * Math.log((210 / Math.pow(position, 1.001)));
		}else{
			score=50.0 / (Math.pow(Math.E, 0.01 * position)) * Math.log((3.3 / Math.pow(position, .1)));
		}
		if(progress!=100){
			if(progress<requirement||position>this.maxRankingForProgress){
				return 0;
			}
			score=score * (Math.pow(5, ((progress - requirement)/(100-requirement)))/10);
		}
        return score;
	}

    /*
    * @param arr - Array where keys are demonIDs, and values have "progress" property, which is integer percentage progress.
    */
	//overwrite if needed (e.g. to add score weighing)
    getPtsFromArr(arr){
		let ptsArr=[];
        for(let key in arr){
            let r=arr[key];
            ptsArr.push(this.score(key,r.progress));
        }
		ptsArr.sort(function(a,b){return b-a;});
		let pts=0;
		for(let i=0;i<ptsArr.length;i++){
			pts+=ptsArr[i]*Math.pow(0.95,i); //osu reference
		}
        return pts;
    }
	
	//to32bitFloat(num){
	//	let arr=new Float32Array(1);
	//	arr[0]=num;
	//	return arr[0];
	//}
}