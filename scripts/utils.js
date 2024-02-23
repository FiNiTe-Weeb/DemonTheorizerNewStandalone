/*
* Function I use to stack data from different pages
* @param existingArr - array to append to.
* @param promiseArr - promise which is expected to resolve to an array, the elements of which will be appended to existingArr
* @returns - The concatanated array
*/
function appendPromiseArr(existingArr,promiseArr){
    let appendArrPromise=new Promise(function(res,rej){//todo: error handling
        promiseArr.then(function(newArr){
            res(existingArr.concat(newArr));
        });
    });
    return appendArrPromise;
}

function round(value=1,decimalPlaces=2){
    let scale=Math.pow(10,decimalPlaces);
    return Math.round(value*scale)/scale;
}

/**
 *@param val - If -2, returns not implemented, if -1, returns error, else returns the value
*/
function msgIfErrValue(val){
	if(val>=0){
		return val;
	}else if(val==-1){
		return "Error";
	}else if(val==-2){
		return "Not Implemented";
	}else{
		log.e("msgIfErrValue got passed value: ",val);
		return "Unknown error";
	}
	
}

//wrapper because fuck you thats why
function fetchJSON(){
	return fetch(...arguments).then(function(resp){return resp.json();});
}

//anything in recs that doesnt agree with recsToCheckAgainst will be returned
function getRecDiff(recs,recsToCheckAgainst){
	let rVal={};
	for(let key in recs){
		let rec=recs[key];
		
		//todo: 0 handling maybe
		if(recsToCheckAgainst[key]===undefined||rec.progress!==recsToCheckAgainst[key].progress){
			rVal[key]=rec;
		}
	}
	return rVal;
}