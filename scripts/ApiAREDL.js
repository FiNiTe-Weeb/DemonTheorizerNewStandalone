class ApiAREDL extends ApiInterface{
	constructor(apiEndpoint){
		super("https://api.aredl.net/api/");
		this.scoreCacheEndpoint="https://cf-worker.finite-weeb.xyz/rankcache/aredl/leaderboard";
		this.scoreCache=null;
		this.formulas={
			"Sum API data":"meow"
		};
		this.packs=null;
		this.packIDToIndex=null;
		this.currentFormula="Sum API data";
	}
	
	//OVERWRITE
	init(){
		let thisRef=this;
		let listPromise=fetchJSON(this.endpoint+"aredl/list").then(function(data){
			thisRef.levelData=data;
			thisRef.levelPositionToId={};
			thisRef.levelIDtoIndex={};
			for(let key in thisRef.levelData){
				let item=thisRef.levelData[key];
				
				thisRef.levelPositionToId[item.position]=item.id;
				thisRef.levelIDtoIndex[item.id]=key;
			}
			return Promise.resolve(); //not really necessary but maybe makes it more clear it resolves idk
		});
		let packsPromise=fetchJSON(this.endpoint+"aredl/packs").then(function(data){
			thisRef.packs=data;
			thisRef.packIDToIndex={};
			for(let i=0;i<thisRef.packs.length;i++){
				let pack=thisRef.packs[i];
				thisRef.packIDToIndex[pack.id]=i;
			}
			return Promise.resolve(); //not really necessary but maybe makes it more clear it resolves idk
		});
		
		//scoreCacheAttemptedPromise WILL RESOLVE ON ERROR
		let scoreCacheAttemptedPromise=new Promise(function(res,rej){
			fetchJSON(thisRef.scoreCacheEndpoint).then(function(data){
				if(data.status&&data.status>=400){
					return Promise.reject(data);
				}
				thisRef.scoreCache=data;
				res(data);
			}).catch(function(err){
				alert("Failed to load scoreCache, rank estimate will not work, check console for more details, err msg: "+err.message);
				log.e(err);
				res(null);
			});
		});
		
		Promise.all([listPromise,packsPromise,scoreCacheAttemptedPromise]).then(function(){
			thisRef.ready=true;
			thisRef.callOnLoad();
		}).catch(this.callOnFail);
	}
	
	//OVERWRITE
	searchPlayer(name){
		return fetchJSON(this.endpoint+"aredl/leaderboard?name_filter="+name).then(function(data){
			let foundPlayers=[];
			for(let key in data.list){
				let item=data.list[key];
				foundPlayers.push({
					id:item.user.id,
					name:item.user.global_name,
					rank:item.rank,
				});
			}
			log.i("searchPlayer example found: ",foundPlayers);
			return foundPlayers;
		});
	}
	
	getPlayerData(playerID,forceUpdate){
		let thisRef=this;
		let playerFetchPromise;
		if(thisRef.loadedPlayersData[playerID]&&(!forceUpdate)){
			playerFetchPromise=Promise.resolve(thisRef.loadedPlayersData[playerID]);
		}else{
			playerFetchPromise=fetchJSON(this.endpoint+"aredl/user?id="+playerID);
		}
		
		return playerFetchPromise.then(function(data){
			thisRef.loadedPlayersData[data.id]=data;
			let processedRecords={};
			for(let key in data.records){
				let item=data.records[key];
				processedRecords[item.level.id]={progress:100};
			}
			return {
				id:data.id,
				name:data.global_name,
				records:processedRecords
			}
		});
	}
	
	//OVERWRITE
	getPlayerRecords(playerData){
		return playerData.records;
	}

    /*
    * calc points for a given demon id and percentage
    * @param levelID - ID of Demon
    * @param progress - % Achieved by player
	* @return number, the score for the record
    */
	//OVERWRITE
	score(levelID,progress){
		if(progress<100){
			return 0;
		}
		let levelInfo=this.getLevelByID(levelID);
		if(levelInfo.points!==undefined&&(!levelInfo.legacy)){
			return levelInfo.points;
		}else{
			return 0;
		}
	}

    /*
    * @param recs - records array, key is levelID, each item has property "progress"
	* returns smth like:
	{
		sortKeys:["sortableKey1"],
		data:{
			whateverKeyUWant:{sortableKey1:sortableValue1}} //first sort key is default one
		}
	}
    */
	//overwrite if needed
	getSortingDataForRecords(recs){
		let recordsInfo=[];
		for(let key in recs){
			let item=recs[key];
			let levelInfo=this.getLevelByID(key);
			let points=this.score(key,item.progress);
			recordsInfo.push({
				levelID:key,
				position:levelInfo.position,
				points:points,
				html:item.progress+"% on #"+levelInfo.position+": "+levelInfo.name+", for "+round(points)+"pts"
			});
		}
		recordsInfo.sort(function(a,b){
			return b.points-a.points;
		});
		for(let i=0;i<recordsInfo.length;i++){
			recordsInfo[i].html="#"+(i+1)+": "+recordsInfo[i].html; //add pb rank
		}
		return recordsInfo;
	}
	
	/*
	 * RETURNS NEW OBJ EACH TIME WHICH CAN BE MUTATED
	*/
	//overwrite if needed
	getRecordSortKeys(){
		return [
			{key:"points",ascending:false},
			{key:"position",ascending:true},
			//{key:"levelID",ascending:true}
		];
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
		pts+=this.getPackBonusFromArr(arr);
        return pts;
    }

    /*
    * @param arr - Array where keys are demonIDs, and values have "progress" property, which is integer percentage progress.
    */
	getPackBonusFromArr(arr){
		let pts=0;
		let packs=this.getPacksFromRecords(arr);
		for(let i=0;i<packs.length;i++){
			let pack=packs[i];
			pts+=pack.points;
		}
		return pts;
	}

    /*
    * @param score - Get estimated rank for el score
    * @param playerID - Know what playerID to remove when checking other scores
	* @return -2 if not implemented, -1 on err, else rank estimate
    */
    getRankEstimate(score,playerID){
		let actualRank=Infinity;
		if(this.scoreCache!=null){
			if(playerID!=0){
				for(let i=0;i<this.scoreCache.length;i++){
					if(playerID==this.scoreCache[i].user.id){
						actualRank=this.scoreCache[i].rank;
						break;
					}
				}
			}
			
			for(let i=0;i<this.scoreCache.length;i++){
				if(round(score,1)>=round(this.scoreCache[i].points,1)){//round to avoid float weirdness
					let rank=i+1;
					if(actualRank<rank){rank--;} //if their real rank is above (smaller) their theoretical rank, we remove 1 from the rank to account for the fact there should be 1 less spot taken
					return rank;
				}
			}
			if(round(this.scoreCache[this.scoreCache.length-1].points,1)>round(score,1)){ //if less score than anyone on lb
				return this.scoreCache.length+1;
			}
		}
		return -1;
    }
	
	getPackByID(packID){
		return this.packs[this.packIDToIndex[packID]];
	}
	
	getPacksFromRecords(recs){
		let packs=this.packs;
		let foundPacks=[];
		for(let i=0;i<packs.length;i++){
			let pack=packs[i];
			let jLoopUnbroken=true;
			for(let j=0;j<pack.levels.length;j++){
				let level=pack.levels[j];
				if((!recs[level.id])||(recs[level.id].progress<100)){
					jLoopUnbroken=false;
					break;
				}
			}
			if(jLoopUnbroken){ //if loop never broke then we never hit a case where pack level wasn't contained in records list
				foundPacks.push(pack);
			}
		}
		return foundPacks;
	}
}