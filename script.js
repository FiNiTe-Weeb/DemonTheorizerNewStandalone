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
	});
	ApiInterface.getCurrentApiInstance().init();

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
    window.addEventListener('load', initSelectors);
	
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
		
		
		let ogRecList=document.getElementById("og-record-list");
		ogRecList.addEventListener("click",rRecListClickCallback);
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
			currentApiStr+=", Max pts: "+msgIfErrValue(round(apiInstance.getMaxPts()));
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
		ApiInterface.getCurrentApiInstance().currentFormula=formulaName;
		document.getElementById("current-formula").innerText="Current Formula: "+formulaName;
		calcState.currentPlayer.updateRRecList();
		calcState.currentPlayer.updateRealPoints();
		calcState.currentPlayer.updateTheoreticalPoints();
		calcState.currentPlayer.oHandler.updateOverridesList();
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
	
    if(TEST){
        window.addOverridesBox=addOverridesBox;
    }