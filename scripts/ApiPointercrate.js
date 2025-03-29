class ApiPointercrate extends ApiInterface{
	constructor(apiEndpoint="https://pointercrate.com/api/",pageSize=75,totalSize=150,maxRankingForProgress=75){
		super(apiEndpoint);
		this.pageSize=pageSize;
		this.totalSize=totalSize;
		this.maxRankingForProgress=maxRankingForProgress;
		this.scoreCacheEndpoint="https://cf-worker.finite-weeb.xyz/rankcache/pointercrate/leaderboard";
		this.scoreCache=null;
		this.formulas={
			"Latest":this.pointsFormula2024_04_25onwards,
			"June 2022 to April 2024":this.pointsFormula2022_06_13to2024_04_25,
			"Pre 2022/06/13 update":this.pointsFormulaPre2022_06_13
		};
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
				res(levelData);
			}).catch(rej);
		});
		//i want scoreCacheAttemptPromise to resolve even on err so it doesnt prevent promise.all from going
		let scoreCacheAttemptPromise=new Promise(function(res,rej){
			fetch(thisRef.scoreCacheEndpoint).then(function(resp){return resp.json();}).then(function(data){
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
		Promise.all([levelsPromise,scoreCacheAttemptPromise]).then(function(){
			thisRef.ready=true;
			thisRef.callOnLoad();
		});
		levelsPromise.catch(this.callOnFail);
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
				if(!resp.ok){
					return Promise.reject(resp);
				}
                return resp.json();
            }).then(function(data){
                if(data.length>=pageLength&&limit>pageLength){//probably not last page
                    let prom=appendPromiseArr(data,thisRef.pageLoader(afterPage+1,pageLength,limit-pageLength));
                    res(prom);
                }else{//last page
                    res(data);
                }
            }).catch(rej);
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
	
	getPlayerRecords(playerData){
        let records={};
		
		//put non-verifications from api response in player records list
        let unsortedRecords=playerData.records;
        for(let i=0;i<unsortedRecords.length;i++){
            let item=unsortedRecords[i];
            if(!(item.demon.position>this.totalSize)){
                records[item.demon.id]={progress:item.progress};
            }
        }
		
		//put verifications from api response in player records list
        let verifiedRecords=playerData.verified;
        for(let i=0;i<verifiedRecords.length;i++){
            let item=verifiedRecords[i];
            if(!(item.position>this.totalSize)){
                records[item.id]={progress:100};
            }
        }
		return records;
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

    /*
    * @param score - Get estimated rank for el score
	* @return -2 if not implemented, -1 on err, else rank estimate
    */
    getRankEstimate(score,playerID=0){
		let actualRank=Infinity;
		if(this.scoreCache!=null){
			if(playerID!=0){
				for(let i=0;i<this.scoreCache.length;i++){
					if(playerID==this.scoreCache[i].id){
						actualRank=this.scoreCache[i].rank;
						break;
					}
				}
			}
			
			for(let i=0;i<this.scoreCache.length;i++){
				if(round(score,6)>=round(this.scoreCache[i].score,6)){//round to avoid some inconsistency, cuz my js and pointercrate values differentiate by a tiny bit (like part per trillion or smth) (e.g. i dont want 1234.1231234 to be treated as bigger than 1234.1231233 cuz thats likely to just be differences in calculation, lrr and idl code doesnt need this logic cuz im calculating those scores in js anyway)
					let rank=i+1;
					if(actualRank<rank){rank--;} //if their real rank is above (smaller) their theoretical rank, we remove 1 from the rank to account for the fact there should be 1 less spot taken
					return rank;
				}
			}
			if(round(this.scoreCache[this.scoreCache.length-1].score,6)>round(score,6)){ //if less score than anyone on lb (if 0 scores disappear)
				return this.scoreCache.length+1;
			}
		}
		return -1;
		
    }
	
	pointsFormulaPre2022_06_13(position=1,progress=100,requirement=50){
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
                score=ApiPointercrate.commonProgress(score,progress,requirement);
            }
            return score;
        }
	}
	
	/*
    * points formula
	* name goes by git history (gmt)
    * @param position - Ranking on the list
    * @param progress - % Achieved by player
    * @param requirement - % Required for points
    */
	pointsFormula2022_06_13to2024_04_25(position=1,progress=100,requirement=50){
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
                score=ApiPointercrate.commonProgress(score,progress,requirement);
            }
            return score;
        }
	}
	
	pointsFormula2024_04_25onwards(position=1,progress=100,requirement=50){
        if(progress>100){progress=100;}
        if(progress<requirement){
            return 0;
        }
        let score;
        if(56<=position && position<=150){
			score=1.039035131 * ((185.7 * Math.exp(-0.02715 * position)) + 14.84)
		}else if(36<=position && position<=55){
			score=1.0371139743 * ((212.61 * Math.pow(1.036,(1 - position))) + 25.071)
		}else if(21<=position && position<=35){
			score=((250 - 83.389) * Math.pow(1.0099685,(2 - position)) - 31.152) * 1.0371139743
		}else if(4<=position && position<=20){
			score=((326.1 * Math.exp(-0.0871 * position)) + 51.09) * 1.037117142
		}else if(1<=position && position<=3){
			score=(-18.2899079915 * position) + 368.2899079915
        }else{
            score=0;
        }
        if(progress!==100){
            score=ApiPointercrate.commonProgress(score,progress,requirement);
        }
        return score;
        
	}
	
	static commonProgress(score,progress,requirement){
		return score * Math.pow(5,  ((progress - requirement)/(100 - requirement))  )   /10;
	}
}