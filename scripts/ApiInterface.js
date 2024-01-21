class ApiInterface{
	static currentApi=null;
	static apiInstances={};
	static getCurrentApiInstance(){
		if(ApiInterface.currentApi!=null){
			return ApiInterface.apiInstances[ApiInterface.currentApi]
		}
	}
	static setCurrentApiInstance(name){
		if(ApiInterface.getApiInstance(name)){
			ApiInterface.currentApi=name;
		}else{
			log.e("Did not set API instance as no API \""+name+"\" in ApiInterface.apiInstances");
		}
	}
	static getApiInstance(apiName){
		if(!apiName){
			log.e("getApiInstance given falsy apiName:", apiName);
			return null;
		}
		if(!ApiInterface.apiInstances[apiName]){
			log.e("ApiInterface.getApiInstance can't find api \""+apiName+"\"");
			return null;
		}
		return ApiInterface.apiInstances[apiName];
	}
	static registerApiInstance(name,instance){
		if(ApiInterface.apiInstances[name]){
			log.e("Api with this name already exists");
			return;
		}
		ApiInterface.apiInstances[name]=instance;
	}
	
	constructor(apiEndpoint){
		this.endpoint=apiEndpoint; //api endpoint/base url
		this.levelData=null; //levels data, key is determined by loader function
        this.levelPositionToId=null;
        this.levelIDtoIndex=null;
		this.ready=false;
		this.loadedPlayersData={}; //playerdata, key is id
		this.currentFormula="Latest"; //null for latest
		this.formulas={"Latest":function(){log.e("formulas.latest method not implemented");}};
		let thisRef=this;
		this.initPromise=new Promise(function(res,rej){
			thisRef.callOnLoad=res;
			thisRef.callOnFail=rej;
		});
		this.initPromise.catch(this.onInitError);
	}
	
	onInitError(err){
		alert("api initialization failed, see console for more details");
		log.e("api initialization failed");
		log.e(err);
	}
	
	getLevelByID(levelID){
        return this.levelData[this.levelIDtoIndex[levelID]];
	}
	
	getLevelByPosition(levelPos){
		return this.getLevelByID(this.levelPositionToId[levelPos]);
	}
	
	//OVERWRITE
	init(){
		log.w("init example method");
		let thisRef=this;
		new Promise(function(res){
			
			thisRef.levelData=[
				{id:118,name:"Sonic Wave",position:1},
				{id:206,name:"Bausha Vortex",position:2}
			];
			thisRef.levelPositionToId={1:118,2:206};
			thisRef.levelIDtoIndex={118:0,206:1};
			
			thisRef.ready=true;
			res();
			thisRef.callOnLoad();
		});
	}
	
	//OVERWRITE
	searchPlayer(name){
		log.w("searchPlayer example method");
		return new Promise(function(res){
			name=name.toLowerCase();
			let examplePlayers=[
				{id:1337,name:"Zoink",rank:1},
				{id:420,name:"FiNiTe",rank:72727},
			];
			let foundPlayers=[];
			for(let i=0;i<examplePlayers.length;i++){
				let item=examplePlayers[i];
				if(item.name.toLowerCase().indexOf(name)>=0){
					foundPlayers.push(item);
				}
			}
			log.i("searchPlayer example found: ",foundPlayers);
			res(foundPlayers);
		});
	}
	
	//OVERWRITE
	getPlayerData(playerID,forceUpdate){
		log.w("getPlayerData example method");
		return new Promise(function(res,rej){
			let examples={
				1337:{id:1337,name:"Zoink",records:[{id:1,progress:100,demon:{id:118}}]},
				420:{id:420,name:"FiNiTe",records:[{id:2,progress:100,demon:{id:206}},{id:3,progress:31,demon:{id:118}}]},
			};
			if(examples[playerID]){
				res(examples[playerID]);
			}else{
				rej();
			}
		});
	}
	
	//OVERWRITE
	getPlayerRecords(playerData){
		log.w("getPlayerRecords example method");
		return this.getPlayerData(playerID,forceUpdate).then(function(data){
            let records={};
			
			//put non-verifications from api response in player records list
            let unsortedRecords=data.records;
            for(let i=0;i<unsortedRecords.length;i++){
                let item=unsortedRecords[i];
                if(!(item.demon.position>150)){
                    records[item.demon.id]={progress:item.progress};
                }
            }
			return records;
		});
	}

    /*
    * calc points for a given demon id and percentage
    * @param levelID - ID of Demon
    * @param progress - % Achieved by player
	* @return number, the score for the record
    */
	//OVERWRITE
	score(levelID,progress){
		let exampleReturn=2*(1/this.getLevelByID(levelID).position)*(progress*progress)/100;
		log.w("score example method");
		return exampleReturn;
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
		return {
			sortKeys:["points","position","levelID"],
			data:recordsInfo
		};
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

    /*
    * @param score - Get estimated rank for el score
    * @param playerID - Know what playerID to remove when checking other scores
	* @return -2 if not implemented, -1 on err, else rank estimate
    */
	//OVERWRITE
    getRankEstimate(score,playerID){
        return -2;
    }

    /*
	* @return -2 if not implemented, -1 on err, else max pts
    */
    getMaxPts(){
		if(this.levelIDtoIndex==null){
			return -1;
		}
		let recs={};
		for(let lvlID in this.levelIDtoIndex){
			recs[lvlID]={progress:100};
		}
        return this.getPtsFromArr(recs);
    }

    /*
	* @return -2 if not implemented, -1 on err, else number of ppl with >0 score
    */
	//overwrite if needed
    getNumberOfScoreHavers(){
		let rankEstimate=this.getRankEstimate(0,0)
		if(rankEstimate>=0){
			rankEstimate-=1;
		}
        return rankEstimate;
    }
}