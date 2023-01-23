var T=Object.defineProperty;var D=(a,i,t)=>i in a?T(a,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[i]=t;var L=(a,i)=>{for(var t in i)T(a,t,{get:i[t],enumerable:!0})};var c=(a,i,t)=>(D(a,typeof i!="symbol"?i+"":i,t),t);var f=class{constructor({app:i,menu:t}){this.app=i,this.controlsContainer=new PIXI.Container;let s=this.app.screen.width/2,n=this.app.screen.height/3,h=new PIXI.Sprite(PIXI.Texture.WHITE);h.tint=16777215,h.anchor.set(.5),h.position.set(s,n),h.width=380,h.height=400;let r=new PIXI.Sprite(PIXI.Texture.WHITE);r.tint=16777215,r.anchor.set(.5),r.position.set(s,this.app.screen.height/10),r.width=160,r.height=40,r.interactive=!0,r.cursor="pointer",r.on("click",()=>{this.app.stage.removeChild(this.controlsContainer),t.show()}),this.controlsContainer.addChild(h),this.controlsContainer.addChild(r),this.addText("Voltar",s,this.app.screen.height/10),this.addText("W - Move para cima",s,n-150),this.addText("S - Move para baixo",s,n-100),this.addText("D - Move para direita",s,n-50),this.addText("A - Move para esquerda",s,n),this.addText("Espaço - Pause",s,n+50),this.addText("M - Mutar/Desmutar",s,n+100),this.app.stage.addChild(this.controlsContainer)}addText(i,t,s){let n=new PIXI.Text(i,{fill:0,fontSize:30});n.position.set(t,s),n.anchor.set(.5),this.controlsContainer.addChild(n)}},M=f;function V(a,i){var t=Math.random()*(i-a)+a;return Math.floor(t)}var x=V;var m=class{constructor({app:i}){this.app=i,this.width=50,this.height=50,this.buffDuration=5e3,this.createBuff({app:i})}createBuff({app:i}){let t=x(this.width,this.app.screen.width-this.width),s=x(this.height,this.app.screen.height-this.height);this.buff=new PIXI.Sprite(PIXI.Texture.WHITE),this.buff.position.set(t,s),this.buff.tint=16755200,this.buff.width=this.width,this.buff.height=this.height,this.text=new PIXI.Text("Buff",{fill:16777215}),this.text.position.set(t,s),i.stage.addChild(this.buff),i.stage.addChild(this.text)}get(i){i.shooting.setFireVelocity=3,i.velocity=3,setTimeout(()=>{i.shooting.setFireVelocity=1,i.velocity=2},this.buffDuration)}update(i){if(this.buff.destroyed)return;let t=i.player.getBounds(),s=this.buff.getBounds();if(t.x+t.width>s.x&&t.x<s.x+s.width&&t.y+t.height>s.y&&t.y<s.y+s.height&&this.buff.visible){this.destroy(),this.get(i);let h=setInterval(()=>{this.createBuff({app:this.app}),clearInterval(h)},1e4)}}destroy(){this.buff.destroy(),this.text.destroy()}},X=m;function W(a,i,t){return t={path:i,exports:{},require:function(s,n){return R(s,n==null?t.path:n)}},a(t,t.exports),t.exports}function R(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}var q=W(function(a,i){a.exports=t;function t(e,o){if(!(this instanceof t))return new t(e,o);this.x=e||0,this.y=o||0}t.fromArray=function(e){return new t(e[0]||0,e[1]||0)},t.fromObject=function(e){return new t(e.x||0,e.y||0)},t.prototype.addX=function(e){return this.x+=e.x,this},t.prototype.addY=function(e){return this.y+=e.y,this},t.prototype.add=function(e){return this.x+=e.x,this.y+=e.y,this},t.prototype.addScalar=function(e){return this.x+=e,this.y+=e,this},t.prototype.addScalarX=function(e){return this.x+=e,this},t.prototype.addScalarY=function(e){return this.y+=e,this},t.prototype.subtractX=function(e){return this.x-=e.x,this},t.prototype.subtractY=function(e){return this.y-=e.y,this},t.prototype.subtract=function(e){return this.x-=e.x,this.y-=e.y,this},t.prototype.subtractScalar=function(e){return this.x-=e,this.y-=e,this},t.prototype.subtractScalarX=function(e){return this.x-=e,this},t.prototype.subtractScalarY=function(e){return this.y-=e,this},t.prototype.divideX=function(e){return this.x/=e.x,this},t.prototype.divideY=function(e){return this.y/=e.y,this},t.prototype.divide=function(e){return this.x/=e.x,this.y/=e.y,this},t.prototype.divideScalar=function(e){return e!==0?(this.x/=e,this.y/=e):(this.x=0,this.y=0),this},t.prototype.divideScalarX=function(e){return e!==0?this.x/=e:this.x=0,this},t.prototype.divideScalarY=function(e){return e!==0?this.y/=e:this.y=0,this},t.prototype.invertX=function(){return this.x*=-1,this},t.prototype.invertY=function(){return this.y*=-1,this},t.prototype.invert=function(){return this.invertX(),this.invertY(),this},t.prototype.multiplyX=function(e){return this.x*=e.x,this},t.prototype.multiplyY=function(e){return this.y*=e.y,this},t.prototype.multiply=function(e){return this.x*=e.x,this.y*=e.y,this},t.prototype.multiplyScalar=function(e){return this.x*=e,this.y*=e,this},t.prototype.multiplyScalarX=function(e){return this.x*=e,this},t.prototype.multiplyScalarY=function(e){return this.y*=e,this},t.prototype.normalize=function(){var e=this.length();return e===0?(this.x=1,this.y=0):this.divide(t(e,e)),this},t.prototype.norm=t.prototype.normalize,t.prototype.limit=function(e,o){return Math.abs(this.x)>e&&(this.x*=o),Math.abs(this.y)>e&&(this.y*=o),this},t.prototype.randomize=function(e,o){return this.randomizeX(e,o),this.randomizeY(e,o),this},t.prototype.randomizeX=function(e,o){var p=Math.min(e.x,o.x),d=Math.max(e.x,o.x);return this.x=n(p,d),this},t.prototype.randomizeY=function(e,o){var p=Math.min(e.y,o.y),d=Math.max(e.y,o.y);return this.y=n(p,d),this},t.prototype.randomizeAny=function(e,o){return Math.round(Math.random())?this.randomizeX(e,o):this.randomizeY(e,o),this},t.prototype.unfloat=function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},t.prototype.toFixed=function(e){return typeof e=="undefined"&&(e=8),this.x=this.x.toFixed(e),this.y=this.y.toFixed(e),this},t.prototype.mixX=function(e,o){return typeof o=="undefined"&&(o=.5),this.x=(1-o)*this.x+o*e.x,this},t.prototype.mixY=function(e,o){return typeof o=="undefined"&&(o=.5),this.y=(1-o)*this.y+o*e.y,this},t.prototype.mix=function(e,o){return this.mixX(e,o),this.mixY(e,o),this},t.prototype.clone=function(){return new t(this.x,this.y)},t.prototype.copyX=function(e){return this.x=e.x,this},t.prototype.copyY=function(e){return this.y=e.y,this},t.prototype.copy=function(e){return this.copyX(e),this.copyY(e),this},t.prototype.zero=function(){return this.x=this.y=0,this},t.prototype.dot=function(e){return this.x*e.x+this.y*e.y},t.prototype.cross=function(e){return this.x*e.y-this.y*e.x},t.prototype.projectOnto=function(e){var o=(this.x*e.x+this.y*e.y)/(e.x*e.x+e.y*e.y);return this.x=o*e.x,this.y=o*e.y,this},t.prototype.horizontalAngle=function(){return Math.atan2(this.y,this.x)},t.prototype.horizontalAngleDeg=function(){return h(this.horizontalAngle())},t.prototype.verticalAngle=function(){return Math.atan2(this.x,this.y)},t.prototype.verticalAngleDeg=function(){return h(this.verticalAngle())},t.prototype.angle=t.prototype.horizontalAngle,t.prototype.angleDeg=t.prototype.horizontalAngleDeg,t.prototype.direction=t.prototype.horizontalAngle,t.prototype.rotate=function(e){var o=this.x*Math.cos(e)-this.y*Math.sin(e),p=this.x*Math.sin(e)+this.y*Math.cos(e);return this.x=o,this.y=p,this},t.prototype.rotateDeg=function(e){return e=r(e),this.rotate(e)},t.prototype.rotateTo=function(e){return this.rotate(e-this.angle())},t.prototype.rotateToDeg=function(e){return e=r(e),this.rotateTo(e)},t.prototype.rotateBy=function(e){var o=this.angle()+e;return this.rotate(o)},t.prototype.rotateByDeg=function(e){return e=r(e),this.rotateBy(e)},t.prototype.distanceX=function(e){return this.x-e.x},t.prototype.absDistanceX=function(e){return Math.abs(this.distanceX(e))},t.prototype.distanceY=function(e){return this.y-e.y},t.prototype.absDistanceY=function(e){return Math.abs(this.distanceY(e))},t.prototype.distance=function(e){return Math.sqrt(this.distanceSq(e))},t.prototype.distanceSq=function(e){var o=this.distanceX(e),p=this.distanceY(e);return o*o+p*p},t.prototype.length=function(){return Math.sqrt(this.lengthSq())},t.prototype.lengthSq=function(){return this.x*this.x+this.y*this.y},t.prototype.magnitude=t.prototype.length,t.prototype.isZero=function(){return this.x===0&&this.y===0},t.prototype.isEqualTo=function(e){return this.x===e.x&&this.y===e.y},t.prototype.toString=function(){return"x:"+this.x+", y:"+this.y},t.prototype.toArray=function(){return[this.x,this.y]},t.prototype.toObject=function(){return{x:this.x,y:this.y}};var s=180/Math.PI;function n(e,o){return Math.floor(Math.random()*(o-e+1)+e)}function h(e){return e*s}function r(e){return e/s}}),u=q;var w=class{constructor({app:i,player:t,playerSize:s}){this.app=i,this.player=t,this.playerSize=s,this.bulletSpeed=3,this.bullets=[],this.bulletRadius=5,this.fireVelocity=1,this.shooting=!1,this.sound=PIXI.sound.Sound.from("sound/shot.mp3")}fire(){this.sound.play();let i=this.player.rotation,t=new PIXI.Graphics;t.beginFill(65280,1),t.drawCircle(0,0,this.bulletRadius),t.endFill();let s=new u(Math.cos(i),Math.sin(i)).multiplyScalar(this.playerSize);t.position.set(this.player.position.x+s.x,this.player.position.y+s.y),t.velocity=new u(Math.cos(i),Math.sin(i)).multiplyScalar(this.bulletSpeed),this.bullets.push(t),this.app.stage.addChild(t)}set setFireVelocity(i){let t=this.shooting;this.shoot=!1,this.fireVelocity=i,this.shoot=t}set shoot(i){this.shooting=i,i?(this.fire(),this.interval=setInterval(()=>this.fire(),300/this.fireVelocity)):clearInterval(this.interval)}update(){this.bullets.forEach((i,t)=>{if(!(Math.abs(i.position.x)<this.app.screen.width&&Math.abs(i.position.y)<this.app.screen.height)){this.bullets[t].destroy(),this.bullets.splice(t,1);return}i.position.set(i.position.x+i.velocity.x,i.position.y+i.velocity.y)})}},k=w;var g=class{constructor({app:i,username:t}){c(this,"setMousePosition",(i,t)=>{this.mouseX=i,this.mouseY=t});c(this,"keydown",i=>{this.key[i.key]=!0});c(this,"keyup",i=>{this.key[i.key]=!1});c(this,"movePlayer",()=>{if(this.key.w){if(this.outOfBounds("w"))return;this.player.y-=this.velocity}if(this.key.a){if(this.outOfBounds("a"))return;this.player.x-=this.velocity}if(this.key.s){if(this.outOfBounds("s"))return;this.player.y+=this.velocity}if(this.key.d){if(this.outOfBounds("d"))return;this.player.x+=this.velocity}});c(this,"lookTo",()=>{let i=Math.atan2(this.mouseY-this.player.position.y,this.mouseX-this.player.position.x);this.player.rotation=i});this.app=i,this.key={},this.points=0,this.lifes=1,this.velocity=2,this.size=20,this.username=t;let s=i.screen.width/2,n=i.screen.height/2,h=PIXI.Texture.from("./images/spaceship.png");h.rotate=6,this.player=new PIXI.Sprite(h),this.player.scale.x*=this.size/100,this.player.scale.y*=this.size/100,this.player.anchor.set(.5),this.player.position.set(s,n),this.shooting=new k({app:i,player:this.player,playerSize:this.size}),this.setMousePosition(s,0),this.app.stage.addChild(this.player),window.addEventListener("keydown",this.keydown),window.addEventListener("keyup",this.keyup)}outOfBounds(i){let t=this.player.y+this.player.height,s=this.player.x+this.player.width,{width:n,height:h}=this.app.screen,r={leftAndTop:this.size*4.5,right:n+this.size*2.5,bottom:h+this.size*2.5};switch(i){case"w":return t<r.leftAndTop;case"a":return s<r.leftAndTop;case"s":return t>r.bottom;case"d":return s>r.right;default:return!0}}update(){this.lookTo(),this.movePlayer(),this.shooting.update()}},E=g;var I=class{constructor({app:i,enemyRadius:t,speed:s,color:n}){this.app=i,this.speed=s,this.enemyRadius=t,this.enemy=new PIXI.Graphics,this.enemy.beginFill(n,1),this.enemy.drawCircle(0,0,t),this.enemy.endFill(),this.resetPosition(),i.stage.addChild(this.enemy)}resetPosition(){let i=this.randomPosition();this.enemy.position.set(i.x,i.y)}randomPosition(){let{width:i,height:t}=this.app.screen,s=Math.floor(Math.random()*4),n=new u(0,0);switch(s){case 0:n.x=i*Math.random();break;case 1:n.x=i,n.y=t*Math.random();break;case 2:n.x=i*Math.random(),n.y=t;break;case 3:n.y=t*Math.random();break;default:break}return n}removePlayerLife(i,t){i.lifes-=1,t.reset()}goToPlayer(i,t){let s=i.player,n=new u(this.enemy.position.x,this.enemy.position.y),h=new u(s.position.x,s.position.y);if(n.distance(h)<s.width/2){this.removePlayerLife(i,t);return}let o=h.subtract(n).normalize().multiplyScalar(this.speed);this.enemy.position.set(this.enemy.position.x+o.x,this.enemy.position.y+o.y)}kill(){this.enemy.destroy()}update(i,t){this.enemy.destroyed||this.goToPlayer(i,t)}},z=I;var P=class{constructor({app:i,player:t}){this.app=i,this.player=t,this.initialInterval=this.spawnInterval=3e3,this.spawns=[],this.startingSpawns=2,this.interval=setInterval(()=>this.spawn(t),this.initialInterval)}spawnLimit(){let i=20,t=Math.floor(this.player.points/i)||1;return this.startingSpawns+t}spawnTime(i){clearInterval(this.interval),this.spawnInterval=Math.max(this.spawnInterval-100,0),this.interval=setInterval(()=>this.spawn(i),this.spawnInterval)}enemyType(){switch(Math.floor(Math.random()*4)+1){case 1:return{speed:.5,color:197372,enemyRadius:18};case 2:return{speed:1,color:6488222,enemyRadius:17};case 3:return{speed:1.5,color:10551645,enemyRadius:16};case 4:return{speed:2,color:16646146,enemyRadius:15};default:break}}spawn(i){if(this.spawns.length>=this.spawnLimit()||i.lifes<1)return;this.spawnTime(i);let{app:t,enemyRadius:s}=this,n=this.enemyType(),h=new z({app:t,enemyRadius:s,...n});this.spawns.push(h)}reset(){this.spawns.forEach(i=>i.kill()),this.spawns=[]}},A=P;var H=(a,i,t,s)=>{a.forEach(n=>{i.forEach((h,r)=>{let e=h.enemy.position.x-n.position.x,o=h.enemy.position.y-n.position.y;Math.sqrt(e*e+o*o)<t+h.enemyRadius&&(i.splice(r,1),h.kill(),s.points+=1,s.points%10==0&&PIXI.sound.Sound.from("sound/reward.mp3").play())})})},B=H;var l={};L(l,{MODE:()=>U,NODE_ENV:()=>K,SNOWPACK_PUBLIC_API_URL_DEV:()=>F,SNOWPACK_PUBLIC_API_URL_PROD:()=>N,SSR:()=>$});var N="https://top-down-shooter-backend.vercel.app/",F="http://localhost:3000",U="production",K="production",$=!1;var G={};G.env=l;var J=()=>{let{SNOWPACK_PUBLIC_API_URL_PROD:a,SNOWPACK_PUBLIC_API_URL_DEV:i,MODE:t}=l;return console.log(a,i),t==="production"?a:i},y=J;var C=class{constructor({app:i,player:t}){this.app=i,this.player=t;let s={fill:16777215};this.textPoints=new PIXI.Text(`Pontos: ${this.player.points}`,s),this.textPoints.position.set(0,0),this.textLifes=new PIXI.Text(`Vidas: ${this.player.lifes}`,s),this.textLifes.position.set(0,30),this.textLifes=new PIXI.Text("Pausado",s),this.textLifes.position.set(0,30);let n=i.screen.width/2,h=i.screen.height/6;this.textEnd=new PIXI.Text("Game Over",s),this.textEnd.visible=!1,this.textEnd.position.set(n,h),this.textEnd.anchor.set(.5),this.textPaused=new PIXI.Text("Pausado",s),this.textPaused.position.set(n,h),this.textPaused.anchor.set(.5),this.textPaused.visible=!1,this.app.stage.addChild(this.textPaused),this.deathSound=PIXI.sound.Sound.from("sound/death.mp3"),this.dead=!1}set showPaused(i){this.textPaused.visible=i}async sendScore(){let i=y();await fetch(i,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify({name:this.player.username,points:this.player.points})})}endgameCheck(){this.player.lifes<1?(this.textEnd.visible=!0,this.dead||(this.dead=!0,this.deathSound.play(),this.sendScore())):this.dead=!1}update(){this.textPoints.text=`Pontos: ${this.player.points}`,this.textLifes.text=`Vidas: ${this.player.lifes}`,this.endgameCheck(),this.app.stage.addChild(this.textPoints),this.app.stage.addChild(this.textLifes),this.app.stage.addChild(this.textEnd)}},_=C;var b=class{constructor({app:i,username:t}){let s=!1,n=!1,h={x:0,y:0},r=new E({app:i,mousePosition:h,username:t}),e=new _({app:i,player:r}),o=new X({app:i}),p=new A({app:i,player:r});i.ticker.add(()=>{e.update(),r.lifes<1&&(i.stage.removeChildren(),e.update()),r.update(),o.update(r),p.spawns.forEach(d=>d.update(r,p)),B(r.shooting.bullets,p.spawns,r.shooting.bulletRadius,r)}),i.renderer.view.onmousemove=function(d){r.setMousePosition(d.clientX,d.clientY)},i.renderer.view.onpointerdown=function(d){s||r.lifes<1||(r.shooting.shoot=!0,r.shooting.update())},i.renderer.view.onpointerup=function(d){s||(r.shooting.shoot=!1,r.shooting.update())},window.addEventListener("keydown",d=>{if(!![" ","m"].includes(d.key))switch(d.key){case" ":e.showPaused=!s,i.render(),s?i.start():i.stop(),s=!s;break;case"m":PIXI.sound.volumeAll=n?1:0,n=!n;break;default:break}})}},Y=b;var v=class{constructor({app:i,menu:t}){this.app=i,this.menu=t,this.scoreContainer=new PIXI.Container,this.showScore().then(()=>{this.backButton(),this.app.stage.addChild(this.scoreContainer)})}backButton(){let i=this.app.screen.width/2,t=this.app.screen.height/10,s=new PIXI.Sprite(PIXI.Texture.WHITE);s.tint=16777215,s.anchor.set(.5),s.position.set(i,t),s.width=160,s.height=40,s.interactive=!0,s.cursor="pointer",s.on("click",()=>{document.body.removeChild(document.getElementById("scoreboard")),this.app.stage.removeChild(this.scoreContainer),this.menu.show()});let n=new PIXI.Text("Voltar",{fill:0,fontSize:30});n.position.set(i,t),n.anchor.set(.5),this.scoreContainer.addChild(s),this.scoreContainer.addChild(n)}async getScore(){let i=y();return console.log(i),await(await fetch(i)).json()}drawTable(){let i=document.createElement("table");return i.id="scoreboard",i.style.position="absolute",i.style.top="40%",i.style.left="50%",i.style.transform="translate(-50%, -50%)",i.style.backgroundColor="white",i.style.fontSize="50px",i}drawTableHead(){let i=document.createElement("tr"),t=document.createElement("th"),s=document.createElement("th"),n=document.createElement("th");return t.innerText="Rank",s.innerText="Nome",n.innerText="Pontos",i.appendChild(t),i.appendChild(s),i.appendChild(n),i}drawTableLine(i,t,s){let n=document.createElement("tr"),h=document.createElement("td"),r=document.createElement("td"),e=document.createElement("td");return h.style.textAlign="center",h.innerText=i,r.style.textAlign="center",r.innerText=t,e.style.textAlign="center",e.innerText=s,n.appendChild(h),n.appendChild(r),n.appendChild(e),n}async showScore(){let i=await this.getScore(),t=this.drawTable();t.appendChild(this.drawTableHead()),i.map(({name:s,points:n},h)=>{t.appendChild(this.drawTableLine(h+1,s,n))}),document.body.appendChild(t)}},j=v;var S=class{constructor({app:i}){this.x=i.screen.width/2,this.y=i.screen.height/6,this.app=i,this.menuContainer=new PIXI.Container,this.username=localStorage.getItem("username"),this.drawNameInput(),this.drawWelcomeText(),this.drawMenuOptions(),this.app.stage.addChild(this.menuContainer)}drawNameInput(){let i=new PIXI.TextInput({input:{fontSize:"25pt",padding:"14px",width:"200px",color:"#000000"},box:{default:{fill:15264243,rounded:16,stroke:{color:13356768,width:4}}}});this.username&&(i.text=this.username,i.disabled=!0),i.placeholder="Nome",i.x=this.x-115,i.y=this.y+50,i.on("input",t=>{this.username=t,localStorage.setItem("username",t),t?(this.menuContainer.children[2].tint=16777215,this.menuContainer.children[3].style.fill=0):(this.menuContainer.children[2].tint=13421772,this.menuContainer.children[3].style.fill=6710886)}),this.menuContainer.addChild(i),i.focus()}drawWelcomeText(){this.welcomeText=new PIXI.Text("Bem Vindo",{fill:16777215,fontSize:50}),this.welcomeText.position.set(this.x,this.y),this.welcomeText.anchor.set(.5),this.menuContainer.addChild(this.welcomeText)}drawMenuButton(i,t,s,n,h,r,e=16777215,o=0){let p=new PIXI.Sprite(PIXI.Texture.WHITE);p.tint=e,p.anchor.set(.5),p.interactive=!0,p.cursor="pointer",p.position.set(t,s),p.width=n,p.height=h,p.on("click",r);let d=new PIXI.Text(i,{fill:o,fontSize:50});d.position.set(t,s),d.anchor.set(.5),this.menuContainer.addChild(p),this.menuContainer.addChild(d)}drawMenuOptions(){this.drawMenuButton("Jogar",this.x,this.y+200,150,60,()=>{!this.username||this.play()},this.username?void 0:13421772,this.username?void 0:6710886),this.drawMenuButton("Score",this.x,this.y+300,160,60,()=>this.showScore()),this.drawMenuButton("Controles",this.x,this.y+400,220,60,()=>this.showControls())}hide(){this.app.stage.removeChild(this.menuContainer)}show(){this.app.stage.addChild(this.menuContainer)}play(){this.hide(),new Y({app:this.app,username:this.username})}showControls(){this.hide(),new M({app:this.app,menu:this})}showScore(){this.hide(),new j({app:this.app,menu:this})}},O=S;var Z=document.getElementById("mycanvas"),Q=new PIXI.Application({view:Z,width:window.innerWidth,height:window.innerHeight});new O({app:Q});
//# sourceMappingURL=index.js.map
