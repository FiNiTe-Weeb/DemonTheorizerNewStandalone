/*
* requirements:
* deal with being told its opened/closed so it can redraw
* know when point update happens so it can redraw
* when open needs to track mouse position
* needs to know when resizing happens
*/

class PointsGraph{
	static graphs={};
	constructor(canvas){
		this.canvas=canvas;
		this.open=false;
		PointsGraph.graphs[canvas.id]=this;
		this.fontSize=16;
		this.marginsX=this.fontSize*4;
		this.marginsY=this.fontSize*2;
	}
	
	onVisibilityToggled(isNowOpen){
		this.open=isNowOpen;
		if(isNowOpen){
			this.onSizeUpdate();
		}else{
			
		}
	}
	
	//call on open or window resize, doesnt work when closed so must call on open
	onSizeUpdate(){
		//log.i("resizeTest");
		this.canvas.width=this.canvas.clientWidth;
		this.canvas.height=this.canvas.clientHeight;
		this.draw();
	}
	
	mouseMoveCallback(evt){
		let apiInstance=ApiInterface.getCurrentApiInstance();
		if((!this.open)||(!apiInstance.ready)){
			return;
		}
		let bounds=this.canvas.getBoundingClientRect();
		
		//let maxScore=0;
		let maxPos=0;
		for(let lvlID in apiInstance.levelIDtoIndex){ //dumb way to do it but im lazy and copy pasted from draw thing
			let level=apiInstance.getLevelByID(lvlID);
			let score=apiInstance.score(lvlID,100);
			if(score>0){
				//maxScore=Math.max(maxScore,score);
				maxPos=Math.max(maxPos,level.position);
			}
		}
		let pos=PointsGraph.linearMap(evt.clientX,bounds.left+this.marginsX,bounds.right-this.marginsX,1,maxPos);
		pos=round(pos,0);
		let score;
		if(evt.clientX>=bounds.left&&evt.clientX<=bounds.right&&
			evt.clientY>=bounds.top&&evt.clientY<=bounds.bottom){ //check that mouse is on the canvas
			//bound pos so it cant be invalid
			pos=Math.max(1,pos);
			pos=Math.min(maxPos,pos);
			score=round(apiInstance.score(apiInstance.getLevelByPosition(pos).id,100));
		}else{
			pos="N/A";
			score="N/A";
		}
		document.getElementById("points-graph-pos-readout").innerText=pos;
		document.getElementById("points-graph-score-readout").innerText=score;
	}
	
	draw(){
		if(!this.open){
			return;
		}
		let dark=PointsGraph.isDark();
		let w=this.canvas.width;
		let h=this.canvas.height;
		let fontSize=this.fontSize;
		let marginsX=this.marginsX;
		let marginsY=this.marginsY;
		let wInner=w-2*marginsX;
		let hInner=h-2*marginsY;
		let bgCol="#FFFFFF";
		let fontCol="rgb(63,63,63)";
		let marginCol="#BFBFBF";
		let graphCol="#FF0000";
		if(dark){
			bgCol="rgb(20,20,20)";
			fontCol="#FFFFFF";
			marginCol="#3F3F3F";
		}
		let ctx=this.canvas.getContext("2d");
		
		ctx.fillStyle=bgCol;
		ctx.fillRect(0,0,w,h);
		
		ctx.beginPath();
		ctx.strokeStyle=marginCol;
		ctx.moveTo(marginsX,marginsY);
		ctx.lineTo(marginsX,h-marginsY);
		ctx.moveTo(w-marginsX,marginsY);
		ctx.lineTo(w-marginsX,h-marginsY);
		
		ctx.moveTo(marginsX,marginsY);
		ctx.lineTo(w-marginsX,marginsY);
		ctx.moveTo(marginsX,h-marginsY);
		ctx.lineTo(w-marginsX,h-marginsY);
		ctx.stroke();
		
		ctx.fillStyle=fontCol;
		ctx.font=fontSize+"px sans-serif";
		ctx.strokeStyle=graphCol;
		let apiInstance=ApiInterface.getCurrentApiInstance();
		if(apiInstance.ready&&apiInstance.levelIDtoIndex!=null){
			let maxScore=0;
			let maxPos=0;
			let minSpacePerPosLabel=fontSize*8;
			let minSpacePerPtsLabel=fontSize*4;
			let dataPoints={};
			for(let lvlID in apiInstance.levelIDtoIndex){
				let level=apiInstance.getLevelByID(lvlID);
				let score=apiInstance.score(lvlID,100);
				if(score==0){continue;}
				dataPoints[level.position]=score;
				maxScore=Math.max(maxScore,score);
				maxPos=Math.max(maxPos,level.position);
			}
			let posLabelsCount=Math.floor(wInner/minSpacePerPosLabel);
			let ptsLabelsCount=Math.floor(hInner/minSpacePerPtsLabel);
			posLabelsCount=Math.max(2,posLabelsCount);
			ptsLabelsCount=Math.max(2,ptsLabelsCount);
			ctx.textAlign="left";
			for(let i=0;i<posLabelsCount;i++){
				let pos=1+round((maxPos-1)*i/(posLabelsCount-1),0);
				let x=PointsGraph.linearMap(pos,1,maxPos,marginsX,w-marginsX);
				ctx.fillText(pos,x,h-marginsY+fontSize);
			}
			ctx.textAlign="right";
			for(let i=0;i<ptsLabelsCount;i++){
				let points=round(maxScore*i/(ptsLabelsCount-1));
				let y=PointsGraph.linearMap(points,0,maxScore,h-marginsY,marginsY);
				ctx.fillText(points,marginsX,y);
			}
			//log.i(maxScore,maxPos);
			ctx.beginPath();
			for(let i=1;i<=maxPos;i++){
				let score=dataPoints[i];
				if(!score){continue;}
				let x=PointsGraph.linearMap(i,1,maxPos,marginsX,w-marginsX);
				let y=PointsGraph.linearMap(score,0,maxScore,h-marginsY,marginsY);
				if(i==1){
					ctx.moveTo(x,y);
				}else{
					ctx.lineTo(x,y);
				}
			}
			ctx.stroke();
		}else{
			//todo: if not ready then onload.then draw
			//todo: say not ready yet
		}
	}
	
	static isDark(){
		return document.body.classList.contains("dark");
	}
	
	static linearMap(input,domainStart,domainEnd,rangeStart,rangeEnd){
		let inputProgress=(input-domainStart)/(domainEnd-domainStart);
		return inputProgress*(rangeEnd-rangeStart)+rangeStart;
	}
}