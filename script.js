	//get my info
    //fetch("https://pointercrate.com/api/v1/players/3936/").then(function(dat){return dat.text();}).then(function(resp){console.log(JSON.parse(resp));});

    //todo: handle errors
    //todo: check if my thing disagrees with list, if yes then tell user to tell me to update it
    

    //DEFINE VARS/CONSTS

    let calcState=new CalcState();

    const TEST=true;
    const LIMIT_DEMONS_NUMBER=150;

    let log=new Logger();
    if(TEST){
        window.calcState=calcState;
    }
	
	ApiInterface.registerApiInstance("pointercrate",new ApiPointercrate());
	ApiInterface.setCurrentApiInstance("pointercrate");
	//todo: i need to move initPromise and everything that wants to run then to a func so it can be called again
	let initApiPromise=ApiInterface.getCurrentApiInstance().init();

    //DEFINE FUNCTIONS

    /*
    * @param arr - Array where keys are demonIDs, and values have "progress" property, which is integer percentage progress.
    */
    function getPtsFromArr(arr){
        let pts=0;
        for(let key in arr){
            let r=arr[key];
            pts+=ApiInterface.getCurrentApiInstance().score(key,r.progress);
        }
        return pts;
    }
	
	function loadRecordsOfPlayer(evt){
		evt.preventDefault();
        //todo: add promise e.g. demonsLoaded.then(callback)
        log.i(evt);
		let selector=document.getElementById("player-selector");
        let playerID=selector.getAttribute("data-id");

        log.i("loading records for playerID",playerID);
        if(playerID==calcState.currentPlayer.id){return;} //return if player already selected
        if(isNaN(playerID)||(playerID==null)||(playerID==0)){return;} //return if playerID invalid (non-type-specific compare to 0 is intentional)

        calcState.currentPlayer=new PlayerState(playerID);
        //todo: set loading screen in the meantime maybe
	}

    //searchable dropdown
    function initSearchableDropdown(containerEl){
        let listOuterEl=containerEl.querySelector("#theory-calc-demon-menu-outer");
        let list=containerEl.querySelector("#theory-calc-demon-menu-inner");
        let search=containerEl.querySelector("#theory-calc-demon-search");
        search.addEventListener("click",function(){
            if(listOuterEl.style.display=="none"){
                listOuterEl.style.display="block";
            }else{
                listOuterEl.style.display="none";
            }
        });
    }
	
	


    //Start it all
    log.i("uwu");
    window.addEventListener('load', loadCalc);
    function loadCalc(){
        addOverridesBox();
        
        let loadRecordsBtn=document.getElementById("load-player-records");
		loadRecordsBtn.addEventListener("click",loadRecordsOfPlayer);
		
		initSelectors();
		function initSelectors(){
			let selectors=document.getElementsByClassName("selector");
			for(let i=0;i<selectors.length;i++){
				let selector=selectors[i];
				if(!selector.classList.contains("initialized")){
					let selectorSearch=selector.getElementsByTagName("input")[0];
					let selectorList=selector.getElementsByTagName("ul")[0];
					
					selectorSearch.addEventListener("click",function(){
						selectorSearch.value="";
						selectorSearch.dispatchEvent(new InputEvent("input"));//so search is empty when u click it again
						selectorList.classList.toggle("show");
					});
					
					//close when clicking elsewhere
					document.addEventListener("click",function(evt){
						if(!selector.contains(evt.target)){
							selectorList.classList.remove("show");
							let selectedID=selector.getAttribute("data-id");
							if(selectedID){
								let listItem=selectorList.querySelector("[data-id=\""+selectedID+"\"]");
								if(listItem){
									selectorSearch.value=listItem.innerHTML;
								}
							}
						}
					});
					
					selectorSearch.addEventListener("input",function(){
						let search=selectorSearch.value.toLowerCase();
						for(let j=0;j<selectorList.children.length;j++){
							let item=selectorList.children[j];
							if(item.innerText.toLowerCase().indexOf(search)>=0){
								item.style.display="list-item";
							}else{
								item.style.display="none";
							}
						}
					});
					
					selectorList.addEventListener("click",function(evt){
						let item=evt.target;
						let id=item.getAttribute("data-id");
						let text=item.innerText;
						if(item&&(id||id===0)){
							selectorList.classList.toggle("show");
							selector.setAttribute("data-id",id);
							selectorSearch.value=text;
						}
					});
					
					let dataEndpoint=selector.getAttribute("data-endpoint");
					//searchable stuff
					if(dataEndpoint){
						
						function runSearch(evt){
							let search=evt.target.value;
							fetch(dataEndpoint+search).then(function(resp){return resp.json();}).then(function(dat){
								selectorList.innerHTML="";
								for(let j=0;j<dat.length;j++){
									let item=dat[j];
									let listEl=document.createElement("li");
									
									//this was made for players thing only so far, to make it usable for other stuff will need some extra attribute usages prob, e.g. a way to say what properties to use for data-id and innerText, as well as innerText format
									listEl.setAttribute("data-id",item.id);
									listEl.innerText="#"+item.rank+" "+item.name;
									selectorList.appendChild(listEl);
								}
							});
						}
						
						let debouceWait=false;
						let timeoutID=null;
						selectorSearch.addEventListener("input",function(evt){
							if(debouceWait){
								clearTimeout(timeoutID);
								timeoutID=setTimeout(function(){
									debouceWait=false;
									timeoutID=null;
									runSearch(evt);
								},500);
							}else{
								let debouceWait=true;
								setTimeout(function(){
									debouceWait=false;
									timeoutID=null;
									runSearch(evt);
								},500);
							}
						});
						selectorSearch.dispatchEvent(new Event("input")); //so it loads default
					}
					
					selector.classList.add("initialized");
				}
			}
		}
    }

    //pro tip: dont EVER user js to build a dom tree (unless u hate urself)
    function addOverridesBox(){
		let levelSelector=document.getElementById("level-selector");
		let levelSelectorList=levelSelector.getElementsByTagName("ul")[0];
		let apiInstance=ApiInterface.getCurrentApiInstance();
        initApiPromise.then(function(){
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
			let addOverride=document.getElementById("add-override-button");
			let progInput=document.getElementById("progress-input");
            addOverride.addEventListener("click",function(){
                let demID=levelSelector.getAttribute("data-id");
                let prog=Number(progInput.value);
                if(!(demID&&(prog==0||prog))){return;}

                calcState.currentPlayer.oHandler.addOverride(demID,prog,calcState.currentPlayer);

            });

            document.getElementById("overrides-container").append(container);
        });
    }
    if(TEST){
        window.addOverridesBox=addOverridesBox;
    }