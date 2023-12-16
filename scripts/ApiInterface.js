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
		ApiInterface.apiInstances[name]=instance;
	}
	
	constructor(apiEndpoint){
		this.endpoint=apiEndpoint; //api endpoint/base url
		this.levelData=null; //levels data, key is determined by loader function
        this.levelPositionToId=null;
        this.levelIDtoIndex=null;
		this.ready=false;
		this.loadedPlayersData={}; //playerdata, key is id
	}
	
	getLevelByID(levelID){
        if(!this.ready){
            log.e("Levels data not loaded yet.");
            return null;
        }
        return this.levelData[this.levelIDtoIndex[levelID]];
	}
	
	getLevelByPosition(levelPos){
        if(!this.ready){
            log.e("Levels data not loaded yet.");
            return null;
        }
		return this.getLevelByID(this.levelPositionToId[levelPos]);
	}
	
	loadLevels(){
		log.e("loadLevels method not implemented");
	}
	
	searchPlayer(name){
		log.e("searchPlayer method not implemented");
	}
	
	getPlayerData(playerID,forceUpdate){
		log.e("getPlayerData method not implemented");
	}
	
	getPlayerRecords(playerID,forceUpdate){
		log.e("getPlayerRecords method not implemented");
	}
	
	score(levelPos=1,progress=100,requirement=50){
		log.e("score method not implemented");
	}
}