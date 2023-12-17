class ApiPointercrate extends ApiInterface{
	constructor(apiEndpoint="https://pointercrate.com/api/",pageSize=75,totalSize=150,maxRankingForProgress=75){
		super(apiEndpoint);
		this.pageSize=pageSize;
		this.totalSize=totalSize;
		this.maxRankingForProgress=maxRankingForProgress;
		this.formulas={latest:this.pointsFormula,test:this.test};
	}
	
	init(){
		let thisRef=this;
		let levelsPromise=new Promise(function(res,rej){
			thisRef.pageLoader().then(function(levelData){
		//populate internal data
				thisRef.levelData=levelData;
				thisRef.levelPositionToId={};
				thisRef.levelIDtoIndex={};
				for(let key in thisRef.levelData){
					let item=thisRef.levelData[key];
					thisRef.levelPositionToId[item.position]=item.id;
					thisRef.levelIDtoIndex[item.id]=key;
				}
				thisRef.ready=true;
				res(levelData);
			});
		});
		return levelsPromise.then(function(){return Promise.resolve()}); //return empty promise upon completion (incase ill support another list where id e.g. need to load all players, then init function returning only levels wouldnt make sense)
	}
	
	
	//FOR init
	/*
    * load pointercrate levels by pages via promise
    * @param page - Page to start loading from, used for recursion
    * @param pageLength - Self explanatory, also please make sure its a number
    * @param limit - Max number of items left to load, decreases each iteration, used incase totalSize isn't a multiple of pageSize (e.g. 100 and 150 respectively)
    * @returns - Promise that resolves in array of demons.
    */
    pageLoader(afterPage=0,pageLength=this.pageSize,limit=this.totalSize){
        log.i("loading page "+(afterPage+1));
		let thisRef=this;
        let fetchPromise=new Promise(function(res,rej){//todo: handle error idk
            fetch(thisRef.endpoint+"v2/demons/listed?limit="+Math.min(pageLength,limit)+"&after="+(afterPage*pageLength)).then(function(resp){
                return resp.json();
            }).then(function(data){
                if(data.length>=pageLength&&limit>pageLength){//probably not last page
                    let prom=appendPromiseArr(data,thisRef.pageLoader(afterPage+1,pageLength,limit-pageLength));
                    res(prom);
                }else{//last page
                    res(data);
                }
            });
        });
        return fetchPromise;
    }
	
	searchPlayer(name){
		return fetch(this.endpoint+"v1/players/ranking/?name_contains="+name).then(function(resp){return resp.json();});
	}
	
	getPlayerData(playerID,forceUpdate=false){
		let thisRef=this;
		if(thisRef.loadedPlayersData[playerID]&&(!forceUpdate)){
			return Promise.resolve(thisRef.loadedPlayersData[playerID]); //return a resolved promise with the data
		}		
		let promise=fetch(this.endpoint+"v1/players/"+playerID+"/").then(function(resp){
			return resp.json();
		}).then(function(decodedResp){
			return decodedResp.data;
		});
		
		//populate internal data
		promise.then(function(data){
			thisRef.loadedPlayersData[data.id]=data;
		});
		return promise;
	}
	
	getPlayerRecords(playerID,forceUpdate=false){
		let thisRef=this;
		return this.getPlayerData(playerID,forceUpdate).then(function(data){
            let records={};
			
			//put non-verifications from api response in player records list
            let unsortedRecords=data.records;
            for(let i=0;i<unsortedRecords.length;i++){
                let item=unsortedRecords[i];
                if(!(item.demon.position>thisRef.totalSize)){
                    records[item.demon.id]={progress:item.progress};
                }
            }
			
			//put verifications from api response in player records list
            let verifiedRecords=data.verified;
            for(let i=0;i<verifiedRecords.length;i++){
                let item=verifiedRecords[i];
                if(!(item.position>thisRef.totalSize)){
                    records[item.id]={progress:100};
                }
            }
			return records;
		});
	}
	
	score(levelID,progress){
		if(!this.ready){
            log.w("Attempted to call getPointsForRecord before level data loaded");
            return 0;
		}
		
        let level=this.getLevelByID(levelID);
		if(!level){
            log.e("Attempted to call getPointsForRecord on non-existant level!! id: "+levelID);
            return 0;
		}
		
        if(level.position>this.maxRankingForProgress&&(progress<100)){
            return 0;
        }
        return this.formulas[this.currentFormula](level.position,progress,level.requirement);
	}
	
	test(pos){
		return pos;
	}
	
	/*
    * points formula
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
            if(125<position && position<=150){
                score=150*Math.exp((1 - position) * Math.log(1 / 30) / (-149));
            } else if(50 < position && position <= 125){
                let a = 2.333;
                let b = 1.884;
                score=60 * (
                    Math.pow(a, (
                        (51 - position) * (
                            Math.log(30) / 99)
                        )
                    )
                ) + b;
            }else if(20 < position && position <= 50){
                let c = 1.01327;
                let d = 26.489;
                score= -100 * (
                    Math.pow(c,position - d)
                ) + 200;
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
}