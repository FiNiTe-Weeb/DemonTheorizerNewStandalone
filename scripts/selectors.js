class SelectorsHelper{
	static selectors=[];
	static init(){
		
	}
	static findDataFromElement(el){
		let index=el.closest(".selector").getAttribute("data-index");
		return SelectorsHelper.selectors[index];
	}
}

//basic search (search only loaded stuff)
function basicSearchListener(evt){
	if(evt.inputType==""){ //empty string input type occurs on click
		return;
	}
	let selectorInfo=SelectorsHelper.findDataFromElement(evt.target);
	let search=selectorInfo.selectorSearch.value.toLowerCase();
	selectorInfo.data.lastInput=search;
	for(let j=0;j<selectorInfo.selectorList.children.length;j++){
		let item=selectorInfo.selectorList.children[j];
		if(item.innerText.toLowerCase().indexOf(search)>=0){
			item.style.display="list-item";
		}else{
			item.style.display="none";
		}
	}
}

function runApiSearch(evt){
	//find selector data
	let selectorInfo=SelectorsHelper.findDataFromElement(evt.target);
	let search=selectorInfo.selectorSearch.value;
	
	//dont repeat searches
	if(selectorInfo.data.lastSearch&&selectorInfo.data.lastSearch==search){
		return;
	}
	log.i("searching for "+evt.target.value);
	selectorInfo.data.lastSearch=search;
	ApiInterface.getCurrentApiInstance().searchPlayer(search).then(function(dat){
		selectorInfo.selectorList.innerHTML="";
		for(let j=0;j<dat.length;j++){
			let item=dat[j];
			let listEl=document.createElement("li");
			
			//this was made for players thing only so far, to make it usable for other stuff will need some extra attribute usages prob, e.g. a way to say what properties to use for data-id and innerText, as well as innerText format
			listEl.setAttribute("data-id",item.id);
			listEl.innerText="#"+item.rank+" "+item.name;
			selectorInfo.selectorList.appendChild(listEl);
		}
	});
}

function selectorSearchListener(evt){
	if(evt.inputType==""){ //empty string input type occurs on click
		return;
	}
	//find selector data
	let selectorData=SelectorsHelper.findDataFromElement(evt.target).data;
	//Selectors[selectorIndex].data.activeTimeoutID
	
	//if a timeout is active, clear it and replace with new one
	if(selectorData.activeTimeoutID){
		clearTimeout(selectorData.activeTimeoutID);
	}
	selectorData.activeTimeoutID=setTimeout(function(){
		delete selectorData.activeTimeoutID;
		runApiSearch(evt);
	},500);
}

function initSelectors(){
	let selectors=document.getElementsByClassName("selector");
	for(let i=0;i<selectors.length;i++){
		let selector=selectors[i];
		if(!selector.classList.contains("initialized")){
			let selectorSearch=selector.getElementsByTagName("input")[0];
			let selectorList=selector.getElementsByTagName("ul")[0];
			
			let selectorIndex=SelectorsHelper.selectors.push({
				selector:selector,
				selectorSearch:selectorSearch,
				selectorList:selectorList,
				data:{}
			})-1; //push returns length
			selector.setAttribute("data-index",selectorIndex);
			let selectorInfo=SelectorsHelper.selectors[selectorIndex];
			
			//todo: handle firefox autofill
			//todo: when backing out i should store search and current item, so when they back out it shows last selected again, but when they reopen it has their search
			
			//add listener to open list when searchbox is clicked
			selectorSearch.addEventListener("click",function(){
				if(!selectorList.classList.contains("show")){ //if clicked when opening search, show last input
					selectorSearch.value=(selectorInfo.data.lastInput==undefined)?"":selectorInfo.data.lastInput;
				}
				selectorSearch.dispatchEvent(new InputEvent("input"));//so search is empty when u click it again
				selectorList.classList.add("show");
			});
			
			//close when clicking elsewhere and revert to showing selected player (note: fix this for when ur searching)
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
			
			selectorSearch.addEventListener("input",basicSearchListener);
			
			//react to selection happening in the list
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
			
			//http request search
			let apiSearch=selector.getAttribute("data-api-search");
			switch(apiSearch){
				case "player":
					selectorSearch.addEventListener("input",selectorSearchListener);
					selectorSearch.dispatchEvent(new Event("input")); //so it loads default
				break;
			}
			
			selector.classList.add("initialized");
		}
	}
}
setTimeout(initSelectors,1);