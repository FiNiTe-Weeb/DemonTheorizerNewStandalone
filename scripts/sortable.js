/**
 *Sortalbles are meant for ul elements
 *Data item should have an "html" property
 *Each key is {key:"keyName",ascending:trueOrFalse}
*/
class Sortable{
	static sortables=[];
	static init(){
		let sortablesEls=document.getElementsByClassName("sortable");
		for(let i=0;i<sortablesEls.length;i++){
			let sortableEl=sortablesEls[i];
			if(!sortableEl.classList.contains("initialized")){
				let sortByContainer=document.querySelector("[data-target-id=\""+sortableEl.id+"\"]");
				let sortableIndex=Sortable.sortables.push(new Sortable(sortableEl,sortByContainer))-1; //push returns length
				sortableEl.setAttribute("data-index",sortableIndex);
				let sortableInfo=Sortable.sortables[sortableIndex];
				
				sortableEl.classList.add("initialized");
			}
		}
	}
	
	static findFromElement(el){
		if(el==null){
			log.e("Sortable.findFromElement was given null element");
			return null;
		}
		let index=el.closest("ul.sortable").getAttribute("data-index");
		return Sortable.sortables[index];
	}
	
	constructor(sortableEl,sortByContainer){
		this.sortableEl=sortableEl;
		this.sortByContainer=sortByContainer;
		this.data=null;
		this.sortKeys=null;
		this.currentKey=null;
	}
	
	getSortedData(newKey=null){
		if(newKey!=null){
			let foundKey=false;
			for(let i=0;i<this.sortKeys.length;i++){
				if(this.sortKeys[i].key==newKey.key){
					foundKey=true;
					break;
				}
			}
			if(!foundKey){
				log.e("Sortable tried to set invalid key",newKey,this);
				return null;
			}
			if(newKey.ascending!==true&&newKey.ascending!==false){
				log.e("Sortable tried to set invalid ascending: "+newKey.ascending+", should be boolean, sortable: ",this);
				return null;
			}
			this.currentKey=newKey;
		}
		if(!this.data||!this.sortKeys||this.currentKey==null||this.currentKey==undefined){
			//log.i("Sortable tried to sort with unset properties, sortable: ",this);
			return null;
		}
		let dataToSort=[];
		for(let key in this.data){
			dataToSort.push(this.data[key]);
		}
		let ascending=this.currentKey.ascending;
		let sortKey=this.currentKey.key;
		dataToSort.sort(function(firstEl,secondEl){
			if(ascending){
				return firstEl[sortKey]-secondEl[sortKey];
			}else{
				return secondEl[sortKey]-firstEl[sortKey];
			}
		});
		return dataToSort;
	}
	
	refreshOutput(newKey=null){
		let sortedData=this.getSortedData(newKey);
		let el=this.sortableEl;
		el.innerHTML="";
		if(sortedData==null){
			return;
		}
		for(let i=0;i<sortedData.length;i++){
			let item=sortedData[i];
			let itemEl=document.createElement("li");
			let template=this.sortableEl.dataset.template;
			if(template){
				let str=template;
				let strIndex=0;
				let maxCounter=0;
				while(strIndex=str.indexOf("${"), strIndex>=0){
					if(maxCounter>100000){
						log.e("Sortable.refreshOutput hit maxCounter", this);
						break;
					}
					maxCounter++;
					
					let endIndex=str.indexOf("}",strIndex+1);
					let replaceKey=str.substring(strIndex+2,endIndex);
					let replaceData=item[replaceKey];
					str=str.replaceAll("${"+replaceKey+"}",replaceData);
				}
				itemEl.innerHTML=str;
			}else{
				itemEl.innerHTML=item.html;
			}
			el.appendChild(itemEl);
		}
	}
	
	setState(data,sortKeys,currentKey){
		this.data=data;
		this.sortKeys=sortKeys;
		this.refreshOutput(currentKey);
	}
	
	updateData(data){
		if(data!==undefined){
			this.data=data;
			this.refreshOutput();
		}
	}
	
	updateDataAndSortKeys(data,sortKeys){
		if(data!==undefined&&sortKeys!==undefined){
			this.data=data;
			this.sortKeys=sortKeys;
			this.refreshOutput();
		}
	}
	
	updateSortKeyAndSortKeys(sortKeys,newKey){
		if(sortKeys!==undefined){
			this.sortKeys=sortKeys;
			this.refreshOutput(newKey);
		}
	}
	
	regenSortByButtons(){
		let sortByContainer=this.sortByContainer;
		let thisRef=this;
		sortByContainer.innerHTML="";
		for(let key in this.sortKeys){
			let sortKey=this.sortKeys[key];
			let buttonEl=document.createElement("button");
			let label=(sortKey.label?sortKey.label:sortKey.key);
			buttonEl.innerText=label+" - "+(sortKey.ascending?"ascending":"descending");
			buttonEl.addEventListener("click",function(evt){
				if(thisRef.currentKey.key==sortKey.key){
					sortKey.ascending=!sortKey.ascending; //this also mutates key in thisRef.sortKeys
					let label=(sortKey.label?sortKey.label:sortKey.key);
					buttonEl.innerText=label+" - "+(sortKey.ascending?"ascending":"descending");
					thisRef.refreshOutput(sortKey);
				}else{
					thisRef.refreshOutput(sortKey);
					for(let i=0;i<sortByContainer.children.length;i++){ //remove selected from all buttons
						let button=sortByContainer.children[i].querySelector("button");
						if(button!=null){
							button.classList.remove("selected");
						}
					}
					buttonEl.classList.add("selected"); //add selected to this button
				}
			});
			if(this.currentKey.key==sortKey.key){
				buttonEl.classList.add("selected");
			}
			
			//append
			let liEl=document.createElement("li");
			liEl.appendChild(buttonEl);
			sortByContainer.appendChild(liEl);
		}
	}
}