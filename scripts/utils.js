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