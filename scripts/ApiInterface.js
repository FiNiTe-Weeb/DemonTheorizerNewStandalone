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
	
	//RETURNS PROMISE
	init(){
		log.e("init method not implemented");
	}
	
	//RETURNS PROMISE
	searchPlayer(name){
		log.e("searchPlayer method not implemented");
	}
	
	//RETURNS PROMISE
	getPlayerData(playerID,forceUpdate){
		log.e("getPlayerData method not implemented");
	}
	
	//RETURNS PROMISE
	getPlayerRecords(playerID,forceUpdate){
		log.e("getPlayerRecords method not implemented");
	}

    /*
    * calc points for a given demon id and percentage
    * @param levelID - ID of Demon
    * @param progress - % Achieved by player
	* @return number, the score for the record
    */
	score(levelID,progress){
		log.e("score method not implemented");
	}
}