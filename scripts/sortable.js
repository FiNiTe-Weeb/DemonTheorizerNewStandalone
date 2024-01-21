/**
 *Sortalbles are meant for ul elements
 *Data item should have an "html" property
*/
class Sortable{
	static sortables=[];
	static init(){
		let sortablesEls=document.getElementsByClassName("sortable");
		for(let i=0;i<sortablesEls.length;i++){
			let sortableEl=sortablesEls[i];
			if(!sortableEl.classList.contains("initialized")){
				let sortableIndex=Sortable.sortables.push(new Sortable(sortableEl))-1; //push returns length
				sortableEl.setAttribute("data-index",sortableIndex);
				let sortableInfo=Sortable.sortables[sortableIndex];
				sortableEl.classList.add("initialized");
			}
		}
	}
	
	static findFromElement(el){
		let index=el.closest("ul.sortable").getAttribute("data-index");
		return Sortable.sortables[index];
	}
	
	constructor(sortableEl){
		this.sortableEl=sortableEl;
		this.data=null;
		this.sortKeys=null;
		this.currentKey=null;
		this.ascending=null;
	}
	
	getSortedData(newKey=null,newAscending=null){
		if(newKey!=null){
			if(this.sortKeys.indexOf(newKey)<0){
				log.e("Sortable tried to set invalid key: "+newKey+", sortable: ",this);
				return null;
			}
			this.currentKey=newKey;
		}
		if(newAscending!=null){
			if(newAscending!==true&&newAscending!==false){
				log.e("Sortable tried to set invalid newAscending: "+newAscending+", should be boolean, sortable: ",this);
				return null;
			}
			this.ascending=newAscending;
		}
		if(!this.data||!this.sortKeys||this.currentKey==null||this.currentKey==undefined||this.ascending==null||this.ascending==undefined){
			log.i("Sortable tried to sort with unset properties, sortable: ",this);
			return null;
		}
		let dataToSort=[];
		for(let key in this.data){
			dataToSort.push(this.data[key]);
		}
		let ascending=this.ascending;
		let sortKey=this.currentKey;
		dataToSort.sort(function(firstEl,secondEl){
			if(ascending){
				return firstEl[sortKey]-secondEl[sortKey];
			}else{
				return secondEl[sortKey]-firstEl[sortKey];
			}
		});
		return dataToSort;
	}
	
	refreshOutput(newKey=null,newAscending=null){
		let sortedData=this.getSortedData(newKey,newAscending);
		let el=this.sortableEl;
		el.innerHTML="";
		if(sortedData==null){
			return;
		}
		for(let i=0;i<sortedData.length;i++){
			let item=sortedData[i];
			let itemEl=document.createElement("li");
			itemEl.innerHTML=item.html;
			el.appendChild(itemEl);
		}
	}
	
	setState(data,sortKeys,currentKey,ascending){
		this.data=data;
		this.sortKeys=sortKeys;
		this.ascending=ascending;
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
	
	updateAscending(ascending){
		if(ascending!==undefined){
			this.ascending=ascending;
			this.refreshOutput();
		}
	}
}