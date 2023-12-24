class ApiExample{
	
	constructor(apiEndpoint){
		super();
		this.exampleVar="hi";
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
	getPlayerRecords(playerID,forceUpdate){
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
}