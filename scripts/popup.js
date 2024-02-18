class Popup{
	static template="<div id=\"popup\" style=\"position: fixed;top: 10%;left: 0;width: 100%;display: flex;flex-direction: row;/*! align-items: center; */justify-content: center;z-index: 250;\"><div id=\"popup-inner\" class=\"background\" style=\"border:2px solid rgb(127, 127, 127);min-width: 50%;text-align: center;border-radius: 32px;/*! min-height: 4em; */padding: 16px;\">test message hi!!!</div></div>";
	
	static message(message,duration){
		let popup=document.getElementById("popup");
		if(!popup){
			popup=document.createElement("div");
			document.body.appendChild(popup);
			popup.outerHTML=Popup.template;
			popup=document.getElementById("popup"); //have to get reference to popup replaced by outerHTML edit
			if(!popup){
				log.e("cant make popup");
				return;
			}
		}
		popup.style.display="flex";
		popup.style.opacity=1;
		let popupInner=popup.querySelector("#popup-inner");
		if(!popupInner){
			log.e("cant get popup inner");
			return;
		}
		popupInner.innerText=message;
		Popup.deathTime=performance.now()+duration;
		Popup.setOpacity();
	}
	
	static deathTime=0;
	static timeout=null;
	static setOpacity(){
		if(Popup.timeout!=null){
			clearTimeout(Popup.timeout);
			Popup.timeout=null;
		}
		
		let popup=document.getElementById("popup");
		if(!popup){
			log.e("cant get popup in setOpacity");
			return;
		}
		let timeToLive=Popup.deathTime-performance.now();
		if(timeToLive<=0){
			popup.style.display="none";
		}else if(timeToLive<=1000){
			popup.style.opacity=timeToLive/1000;
			requestAnimationFrame(Popup.setOpacity);
		}else{
			Popup.timeout=setTimeout(Popup.setOpacity,timeToLive-1000);
		}
	}
}