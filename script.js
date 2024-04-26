	//get my info
    //fetch("https://pointercrate.com/api/v1/players/3936/").then(function(dat){return dat.text();}).then(function(resp){console.log(JSON.parse(resp));});

    //todo: handle errors
    //todo: check if my thing disagrees with list, if yes then tell user to tell me to update it
    

    //DEFINE VARS/CONSTS
	
	let getPararms=new URLSearchParams(location.search);

    const TEST=true;

    let log=new Logger();
    let calcState=new CalcState();
	
	ApiInterface.registerApiInstance("pointercrate",new ApiPointercrate());
	ApiInterface.registerApiInstance("aredl",new ApiAREDL());
	ApiInterface.registerApiInstance("insaneDemonList",new ApiInsaneDemonList());
	ApiInterface.registerApiInstance("lowRefreshRateList",new ApiLowRefreshRateList());
	ApiInterface.registerApiInstance("test",new ApiInterface());
	let startApi="pointercrate";
	let defaultApiFromURL=getPararms.get("defaultApi");
	if(defaultApiFromURL!=null&& typeof defaultApiFromURL==="string"&&calcState.apis[defaultApiFromURL]!==undefined){
		startApi=defaultApiFromURL;
	}
	document.getElementById("api-selector").setAttribute("data-default",startApi);
	ApiInterface.setCurrentApiInstance(startApi);
    window.addEventListener('load', function(){
		loadApi(startApi);
		initSelectors();
	});
	ApiInterface.getCurrentApiInstance().init();
	
	new PointsGraph(document.getElementById("points-graph-canvas"));
	window.addEventListener("resize",function(){
		let pointsGraph=PointsGraph.graphs["points-graph-canvas"];
		if(pointsGraph.open){
			pointsGraph.onSizeUpdate();
		}
	});
	window.addEventListener("mousemove",function(evt){
		PointsGraph.graphs["points-graph-canvas"].mouseMoveCallback(evt);
	});

    if(TEST){
        window.calcState=calcState;
    }

    //DEFINE FUNCTIONS
	
	function loadRecordsOfPlayer(evt){
		evt.preventDefault();
        //todo: add promise e.g. demonsLoaded.then(callback)
        log.i(evt);
		let selector=document.getElementById("player-selector");
        let playerID=selector.getAttribute("data-id");

        log.i("loading records for playerID",playerID);
		document.getElementById("current-player").innerText+=", Loading playerID: "+playerID; //text updated after load in playerstate playerPostLoad
        if(playerID==calcState.currentPlayer.id){return;} //return if player already selected
        if((playerID==null)||(playerID==0)){return;} //return if playerID invalid (non-type-specific compare to 0 is intentional)

        calcState.currentPlayer=new PlayerState(playerID);
        //todo: set loading screen in the meantime maybe
	}


    //Start it all
    log.i("uwu");
	Sortable.init();
	
	function initSelectors(){
		SelectorsHelper.init();
        let loadRecordsBtn=document.getElementById("load-player-records");
		loadRecordsBtn.addEventListener("click",loadRecordsOfPlayer);
		let loadEmptyPlayerBtn=document.getElementById("load-empty-player");
		loadEmptyPlayerBtn.addEventListener("click",function(){
			calcState.currentPlayer=new PlayerState(0);
		});
        let loadFormulaBtn=document.getElementById("load-formula");
		loadFormulaBtn.addEventListener("click",loadFormulaButtonCallback);
        let loadApiBtn=document.getElementById("load-api");
		loadApiBtn.addEventListener("click",loadApiButtonCallback);
		
        let togglePointsGraphBtn=document.getElementById("toggle-points-graph");
		togglePointsGraphBtn.addEventListener("click",togglePointsGraphButtonCallback);
		
		
		let ogRecList=document.getElementById("og-record-list");
		ogRecList.addEventListener("click",rRecListClickCallback);
		
		let copyOverridesJsonBtn=document.getElementById("copy-overrides-json");
		let copyTRecsJsonBtn=document.getElementById("copy-trec-json");
		copyOverridesJsonBtn.addEventListener("click",copyOverridesJson);
		copyTRecsJsonBtn.addEventListener("click",copyTRecsJson);
		
		let pasteAllOverridesBtn=document.getElementById("paste-all-overrides");
		let pasteDifferentOverridesBtn=document.getElementById("paste-different-overrides");
		let pasteBetterOverridesBtn=document.getElementById("paste-better-overrides");
		let pasteWorseOverridesBtn=document.getElementById("paste-worse-overrides");
		pasteAllOverridesBtn.addEventListener("click",pasteAllOverrides);
		pasteDifferentOverridesBtn.addEventListener("click",pasteDifferentOverrides);
		pasteBetterOverridesBtn.addEventListener("click",pasteBetterOverrides);
		pasteWorseOverridesBtn.addEventListener("click",pasteWorseOverrides);
		
		let clearOverridesBtn=document.getElementById("clear-overrides");
		clearOverridesBtn.addEventListener("click",clearOverrides);
	}
	
	function loadApiSpecific(){
		calcState.currentPlayer=new PlayerState(0);
		//clear anything that might be set already
		let elementsToClear=document.querySelectorAll(".selector ul");
		for(let i=0;i<elementsToClear.length;i++){
			elementsToClear[i].innerHTML="";
		}
		document.getElementById("level-selector").removeAttribute("data-id");
		document.getElementById("player-selector").removeAttribute("data-id");
		document.getElementById("formula-selector").removeAttribute("data-id");
		document.querySelector("#level-selector input").value="";
		document.querySelector("#player-selector input").value="";
		document.querySelector("#formula-selector input").value="";
        ApiInterface.getCurrentApiInstance().initPromise.then(function(){
			addOverridesBox();
		}).finally(function(){
			addFormulaSelector();
			addApiSelector();
			let apiInstance=ApiInterface.getCurrentApiInstance();
			let currentApiStr="Currently loaded API: "+calcState.apis[ApiInterface.currentApi].name;
			currentApiStr+=", People with points>0: "+msgIfErrValue(apiInstance.getNumberOfScoreHavers());
			document.getElementById("current-api").innerText=currentApiStr;
			setFormula(apiInstance.currentFormula); //this is mostly here to set the current formula text lul
			
			//records sorting stuff
			let rRecSortable=Sortable.findFromElement(document.getElementById("og-record-list"));
			if(rRecSortable!=null){
				let sortKeys=apiInstance.getRecordSortKeys();
				rRecSortable.updateSortKeyAndSortKeys(sortKeys,sortKeys[0]);
				rRecSortable.regenSortByButtons();
			}
		});
		document.querySelector("main").setAttribute("data-api",ApiInterface.currentApi); //for css stuff
	}

    //pro tip: dont EVER user js to build a dom tree (unless u hate urself)
    function addOverridesBox(){
		let apiInstance=ApiInterface.getCurrentApiInstance();
		
		let levelSelector=document.getElementById("level-selector");
		let levelSelectorList=levelSelector.getElementsByTagName("ul")[0];
        let container=document.createElement("div");
        container.setAttribute("id","fnt-calc-overrides-container");

        let pos=1;
        let demon=null;
        while(demon=apiInstance.getLevelByPosition(pos)){//yes u can put assignments in there, condition is true if value assigned is truthy
            try{
                let option=document.createElement("li");
                option.setAttribute("data-id",demon.id);
                option.innerText="#"+pos+" "+demon.name;
                levelSelectorList.appendChild(option);
				
                pos++;
            }catch(deezNutz){log.e(deezNutz,pos); break;}
        }
		onOptionsListUpdate(SelectorsHelper.findDataFromElement(levelSelector)); //todo: maybe move this func into SelectorsHelper
		let addOverride=document.getElementById("add-override-button");
		let progInput=document.getElementById("progress-input");
        addOverride.addEventListener("click",function(){
            let demID=levelSelector.getAttribute("data-id");
            let prog=Number(progInput.value);
            if(!(demID&&(prog==0||prog))){return;}

            calcState.currentPlayer.oHandler.addOverride(demID,prog,calcState.currentPlayer);

        });

        document.getElementById("overrides-container").append(container);
    }
	
	function addFormulaSelector(){
		let formulaSelector=document.getElementById("formula-selector");
		let formulaSelectorList=formulaSelector.getElementsByTagName("ul")[0];
		
		let apiInstance=ApiInterface.getCurrentApiInstance();
		for(let formulaName in apiInstance.formulas){
                let option=document.createElement("li");
                option.setAttribute("data-id",formulaName);
                option.innerText=formulaName;
                formulaSelectorList.appendChild(option);
		}
		onOptionsListUpdate(SelectorsHelper.findDataFromElement(formulaSelector));
	}
	
	function addApiSelector(){
		let apiSelector=document.getElementById("api-selector");
		let apiSelectorList=apiSelector.getElementsByTagName("ul")[0];
		
		let apiInstance=ApiInterface.getCurrentApiInstance();
		for(apiName in calcState.apis){
                let option=document.createElement("li");
                option.setAttribute("data-id",apiName);
                option.innerText=calcState.apis[apiName].name;
                apiSelectorList.appendChild(option);
		}
		onOptionsListUpdate(SelectorsHelper.findDataFromElement(apiSelector));
	}
	
	function loadFormulaButtonCallback(evt){
        log.i(evt);
		let selector=document.getElementById("formula-selector")
        let formulaName=selector.getAttribute("data-id");
		setFormula(formulaName);
	}
	
	function setFormula(formulaName){
		if(formulaName==null||(!ApiInterface.getCurrentApiInstance().formulas[formulaName])){
			log.e("no formula "+formulaName);
			return;
		}

        log.i("setting formula",formulaName);
		let apiInstance=ApiInterface.getCurrentApiInstance();
		apiInstance.currentFormula=formulaName;
		let currentFormulaStr="Current Formula: "+formulaName;
		currentFormulaStr+=", Max pts: "+msgIfErrValue(round(apiInstance.getMaxPts()));
		document.getElementById("current-formula").innerText=currentFormulaStr;
		calcState.currentPlayer.updateRRecList();
		calcState.currentPlayer.updateRealPoints();
		calcState.currentPlayer.updateTheoreticalPoints();
		calcState.currentPlayer.oHandler.updateOverridesList();
		PointsGraph.graphs["points-graph-canvas"].draw();
	}
	
	//todo: graph resizing stuff
	function togglePointsGraphButtonCallback(){
		let pointsGraphContainer=document.getElementById("points-graph-container");
		pointsGraphContainer.hidden=!pointsGraphContainer.hidden;
		PointsGraph.graphs["points-graph-canvas"].onVisibilityToggled(!pointsGraphContainer.hidden);
	}
	
	function loadApiButtonCallback(evt){
        log.i(evt);
		let selector=document.getElementById("api-selector");
        let apiID=selector.getAttribute("data-id");
		loadApi(apiID);
	}
	
	function loadApi(apiID){
		if(apiID==null||(!ApiInterface.apiInstances[apiID])){
			log.e("no API "+apiID);
			return;
		}

        log.i("loading API",apiID);
		
		ApiInterface.setCurrentApiInstance(apiID);
		document.getElementById("current-api").innerText+=", Loading "+calcState.apis[ApiInterface.currentApi].name;
		let apiInstance=ApiInterface.getCurrentApiInstance();
		if(!apiInstance.ready){
			apiInstance.init();
		}
		apiInstance.initPromise.finally(loadApiSpecific);
		apiInstance.initPromise.then(function(){
			runApiSearch("",SelectorsHelper.findDataFromElement(document.getElementById("player-selector")));
		});
	}
	
	function rRecListClickCallback(evt){
		let trg=evt.target;
		if(trg&&trg.classList.contains("remove-rrec")){
			let lvlID=trg.dataset.levelid;
			calcState.currentPlayer.oHandler.addOverride(lvlID,0,calcState.currentPlayer);
			
			let apiInstance=ApiInterface.getCurrentApiInstance();
			let lvl=apiInstance.getLevelByID(lvlID);
			Popup.message("Added 0% override for "+lvl.name,1500);
		}
	}
	
	function clearOverrides(){
		calcState.currentPlayer.oHandler.clearOverrides(calcState.currentPlayer);
	}
	
	function copyOverridesJson(){
		let str=JSON.stringify(calcState.currentPlayer.oHandler.overrides);
		navigator.clipboard.writeText(str);
		Popup.message("Copied override JSON to clipboard",2000);
	}
	
	function copyTRecsJson(){
		let str=JSON.stringify(calcState.currentPlayer.tRecs);
		navigator.clipboard.writeText(str);
		Popup.message("Copied theretical records JSON to clipboard",2000);
	}
	
	function pasteAllOverrides(){
		getOverridesFromClipboard().then(function(overrides){
			result=setOverrides(overrides);
			if(result){
				Popup.message("Pasted all overrides from clipboard",2000);
			}
		});
	}
	
	function pasteDifferentOverrides(){
		getOverridesFromClipboard().then(function(overrides){
			let overridesToAdd=getRecDiff(overrides,calcState.currentPlayer.rRecs);
			result=setOverrides(overridesToAdd);
			if(result){
				Popup.message("Pasted different overrides from clipboard",2000);
			}
		});
	}
	
	function pasteBetterOverrides(){
		getOverridesFromClipboard().then(function(overrides){
			let rRecs=calcState.currentPlayer.rRecs;
			let overridesDiff=getRecDiff(overrides,rRecs);
			let overridesToAdd={};
			for(let key in overridesDiff){
				let override=overridesDiff[key];
				if(rRecs[key]===undefined||rRecs[key].progress===undefined||rRecs[key].progress<override.progress){
					overridesToAdd[key]=override;
				}
			}
			result=setOverrides(overridesToAdd);
			if(result){
				Popup.message("Pasted better overrides from clipboard",2000);
			}
		});
	}
	
	function pasteWorseOverrides(){
		getOverridesFromClipboard().then(function(overrides){
			let rRecs=calcState.currentPlayer.rRecs;
			let overridesDiff=getRecDiff(overrides,rRecs);
			let overridesToAdd={};
			for(let key in overridesDiff){
				let override=overridesDiff[key];
				if(rRecs[key]!==undefined&&rRecs[key].progress!==undefined&&rRecs[key].progress>override.progress){
					overridesToAdd[key]=override;
				}
			}
			result=setOverrides(overridesToAdd);
			if(result){
				Popup.message("Pasted worse overrides from clipboard",2000);
			}
		});
	}
	
	function setOverrides(overrides){
		let apiInstance=ApiInterface.getCurrentApiInstance();
		for(let key in overrides){
			let override=overrides[key];
			if(!apiInstance.getLevelByID(key)){
				Popup.message("No level with ID \""+key+"\"",4000);
				return false;
			}
			if(override.progress===undefined){
				Popup.message("Override item \""+key+"\" does not have property \"progress\"",4000);
				return false;
			}
		}
		
		let oHandler=calcState.currentPlayer.oHandler;
		
		for(let key in overrides){
			let override=overrides[key];
			oHandler.addOverride(key,override.progress,calcState.currentPlayer);
		}
		return true
	}
	
	function getOverridesFromClipboard(){
		if(!navigator.clipboard.readText){	
			let msg="This browser does not support navigator.clipboard.readText";
			Popup.message(msg,2000);
			return Promise.reject(msg);
		}
		
		let promise=new Promise(function(res,rej){
			navigator.clipboard.readText().then(function(str){
				try{
					let overrides=JSON.parse(str);
					res(overrides);
				}catch(e){
					let msg="Exception occured: "+e.message;
					Popup.message(msg,4000);
					rej(msg);
				}
			});
		});
		return promise;
	}
	
    if(TEST){
        window.addOverridesBox=addOverridesBox;
    }