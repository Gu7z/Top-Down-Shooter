var z=Object.defineProperty;var j=(o,e,i)=>e in o?z(o,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):o[e]=i;var l=(o,e,i)=>(j(o,typeof e!="symbol"?e+"":e,i),i);function A(o,e){var i=Math.random()*(e-o)+o;return Math.floor(i)}var m=A;var w=class{constructor({app:e}){this.app=e,this.width=50,this.height=50,this.buffDuration=5e3,this.createBuff({app:e})}createBuff({app:e}){let i=m(this.width,this.app.screen.width-this.width),n=m(this.height,this.app.screen.height-this.height);this.buff=new PIXI.Sprite(PIXI.Texture.WHITE),this.buff.position.set(i,n),this.buff.tint=16755200,this.buff.width=this.width,this.buff.height=this.height,this.text=new PIXI.Text("Buff",{fill:16777215}),this.text.position.set(i,n),e.stage.addChild(this.buff),e.stage.addChild(this.text)}get(e){e.shooting.setFireVelocity=3,e.velocity=3,setTimeout(()=>{e.shooting.setFireVelocity=1,e.velocity=2},this.buffDuration)}update(e){if(this.buff.destroyed)return;let i=e.player.getBounds(),n=this.buff.getBounds();if(i.x+i.width>n.x&&i.x<n.x+n.width&&i.y+i.height>n.y&&i.y<n.y+n.height&&this.buff.visible){this.destroy(),this.get(e);let a=setInterval(()=>{this.createBuff({app:this.app}),clearInterval(a)},1e4)}}destroy(){this.buff.destroy(),this.text.destroy()}},X=w;function q(o,e,i){return i={path:e,exports:{},require:function(n,r){return C(n,r==null?i.path:r)}},o(i,i.exports),i.exports}function C(){throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs")}var D=q(function(o,e){o.exports=i;function i(t,s){if(!(this instanceof i))return new i(t,s);this.x=t||0,this.y=s||0}i.fromArray=function(t){return new i(t[0]||0,t[1]||0)},i.fromObject=function(t){return new i(t.x||0,t.y||0)},i.prototype.addX=function(t){return this.x+=t.x,this},i.prototype.addY=function(t){return this.y+=t.y,this},i.prototype.add=function(t){return this.x+=t.x,this.y+=t.y,this},i.prototype.addScalar=function(t){return this.x+=t,this.y+=t,this},i.prototype.addScalarX=function(t){return this.x+=t,this},i.prototype.addScalarY=function(t){return this.y+=t,this},i.prototype.subtractX=function(t){return this.x-=t.x,this},i.prototype.subtractY=function(t){return this.y-=t.y,this},i.prototype.subtract=function(t){return this.x-=t.x,this.y-=t.y,this},i.prototype.subtractScalar=function(t){return this.x-=t,this.y-=t,this},i.prototype.subtractScalarX=function(t){return this.x-=t,this},i.prototype.subtractScalarY=function(t){return this.y-=t,this},i.prototype.divideX=function(t){return this.x/=t.x,this},i.prototype.divideY=function(t){return this.y/=t.y,this},i.prototype.divide=function(t){return this.x/=t.x,this.y/=t.y,this},i.prototype.divideScalar=function(t){return t!==0?(this.x/=t,this.y/=t):(this.x=0,this.y=0),this},i.prototype.divideScalarX=function(t){return t!==0?this.x/=t:this.x=0,this},i.prototype.divideScalarY=function(t){return t!==0?this.y/=t:this.y=0,this},i.prototype.invertX=function(){return this.x*=-1,this},i.prototype.invertY=function(){return this.y*=-1,this},i.prototype.invert=function(){return this.invertX(),this.invertY(),this},i.prototype.multiplyX=function(t){return this.x*=t.x,this},i.prototype.multiplyY=function(t){return this.y*=t.y,this},i.prototype.multiply=function(t){return this.x*=t.x,this.y*=t.y,this},i.prototype.multiplyScalar=function(t){return this.x*=t,this.y*=t,this},i.prototype.multiplyScalarX=function(t){return this.x*=t,this},i.prototype.multiplyScalarY=function(t){return this.y*=t,this},i.prototype.normalize=function(){var t=this.length();return t===0?(this.x=1,this.y=0):this.divide(i(t,t)),this},i.prototype.norm=i.prototype.normalize,i.prototype.limit=function(t,s){return Math.abs(this.x)>t&&(this.x*=s),Math.abs(this.y)>t&&(this.y*=s),this},i.prototype.randomize=function(t,s){return this.randomizeX(t,s),this.randomizeY(t,s),this},i.prototype.randomizeX=function(t,s){var y=Math.min(t.x,s.x),c=Math.max(t.x,s.x);return this.x=r(y,c),this},i.prototype.randomizeY=function(t,s){var y=Math.min(t.y,s.y),c=Math.max(t.y,s.y);return this.y=r(y,c),this},i.prototype.randomizeAny=function(t,s){return Math.round(Math.random())?this.randomizeX(t,s):this.randomizeY(t,s),this},i.prototype.unfloat=function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},i.prototype.toFixed=function(t){return typeof t=="undefined"&&(t=8),this.x=this.x.toFixed(t),this.y=this.y.toFixed(t),this},i.prototype.mixX=function(t,s){return typeof s=="undefined"&&(s=.5),this.x=(1-s)*this.x+s*t.x,this},i.prototype.mixY=function(t,s){return typeof s=="undefined"&&(s=.5),this.y=(1-s)*this.y+s*t.y,this},i.prototype.mix=function(t,s){return this.mixX(t,s),this.mixY(t,s),this},i.prototype.clone=function(){return new i(this.x,this.y)},i.prototype.copyX=function(t){return this.x=t.x,this},i.prototype.copyY=function(t){return this.y=t.y,this},i.prototype.copy=function(t){return this.copyX(t),this.copyY(t),this},i.prototype.zero=function(){return this.x=this.y=0,this},i.prototype.dot=function(t){return this.x*t.x+this.y*t.y},i.prototype.cross=function(t){return this.x*t.y-this.y*t.x},i.prototype.projectOnto=function(t){var s=(this.x*t.x+this.y*t.y)/(t.x*t.x+t.y*t.y);return this.x=s*t.x,this.y=s*t.y,this},i.prototype.horizontalAngle=function(){return Math.atan2(this.y,this.x)},i.prototype.horizontalAngleDeg=function(){return a(this.horizontalAngle())},i.prototype.verticalAngle=function(){return Math.atan2(this.x,this.y)},i.prototype.verticalAngleDeg=function(){return a(this.verticalAngle())},i.prototype.angle=i.prototype.horizontalAngle,i.prototype.angleDeg=i.prototype.horizontalAngleDeg,i.prototype.direction=i.prototype.horizontalAngle,i.prototype.rotate=function(t){var s=this.x*Math.cos(t)-this.y*Math.sin(t),y=this.x*Math.sin(t)+this.y*Math.cos(t);return this.x=s,this.y=y,this},i.prototype.rotateDeg=function(t){return t=p(t),this.rotate(t)},i.prototype.rotateTo=function(t){return this.rotate(t-this.angle())},i.prototype.rotateToDeg=function(t){return t=p(t),this.rotateTo(t)},i.prototype.rotateBy=function(t){var s=this.angle()+t;return this.rotate(s)},i.prototype.rotateByDeg=function(t){return t=p(t),this.rotateBy(t)},i.prototype.distanceX=function(t){return this.x-t.x},i.prototype.absDistanceX=function(t){return Math.abs(this.distanceX(t))},i.prototype.distanceY=function(t){return this.y-t.y},i.prototype.absDistanceY=function(t){return Math.abs(this.distanceY(t))},i.prototype.distance=function(t){return Math.sqrt(this.distanceSq(t))},i.prototype.distanceSq=function(t){var s=this.distanceX(t),y=this.distanceY(t);return s*s+y*y},i.prototype.length=function(){return Math.sqrt(this.lengthSq())},i.prototype.lengthSq=function(){return this.x*this.x+this.y*this.y},i.prototype.magnitude=i.prototype.length,i.prototype.isZero=function(){return this.x===0&&this.y===0},i.prototype.isEqualTo=function(t){return this.x===t.x&&this.y===t.y},i.prototype.toString=function(){return"x:"+this.x+", y:"+this.y},i.prototype.toArray=function(){return[this.x,this.y]},i.prototype.toObject=function(){return{x:this.x,y:this.y}};var n=180/Math.PI;function r(t,s){return Math.floor(Math.random()*(s-t+1)+t)}function a(t){return t*n}function p(t){return t/n}}),d=D;var g=class{constructor({app:e,player:i}){this.app=e,this.player=i,this.bulletSpeed=3,this.bullets=[],this.bulletRadius=5,this.fireVelocity=1,this.shooting=!1}fire(){let e=new PIXI.Graphics;e.position.set(this.player.position.x,this.player.position.y),e.beginFill(255,1),e.drawCircle(0,0,this.bulletRadius),e.endFill();let i=this.player.rotation;e.velocity=new d(Math.cos(i),Math.sin(i)).multiplyScalar(this.bulletSpeed),this.bullets.push(e),this.app.stage.addChild(e)}set setFireVelocity(e){let i=this.shooting;this.shoot=!1,this.fireVelocity=e,this.shoot=i}set shoot(e){this.shooting=e,e?(this.fire(),this.interval=setInterval(()=>this.fire(),300/this.fireVelocity)):clearInterval(this.interval)}update(){this.bullets.forEach((e,i)=>{if(!(Math.abs(e.position.x)<this.app.screen.width&&Math.abs(e.position.y)<this.app.screen.height)){this.bullets[i].destroy(),this.bullets.splice(i,1);return}e.position.set(e.position.x+e.velocity.x,e.position.y+e.velocity.y)})}},k=g;var v=class{constructor({app:e}){l(this,"setMousePosition",(e,i)=>{this.mouseX=e,this.mouseY=i});l(this,"keydown",e=>{this.key[e.key]=!0});l(this,"keyup",e=>{this.key[e.key]=!1});l(this,"movePlayer",()=>{if(this.key.w){if(this.outOfBounds("w"))return;this.player.y-=this.velocity}if(this.key.a){if(this.outOfBounds("a"))return;this.player.x-=this.velocity}if(this.key.s){if(this.outOfBounds("s"))return;this.player.y+=this.velocity}if(this.key.d){if(this.outOfBounds("d"))return;this.player.x+=this.velocity}});l(this,"lookTo",()=>{let e=Math.atan2(this.mouseY-this.player.position.y,this.mouseX-this.player.position.x);this.player.rotation=e});this.app=e,this.key={},this.points=0,this.lifes=1;let i=32,n=e.screen.width/2,r=e.screen.height/2;this.player=new PIXI.Sprite(PIXI.Texture.WHITE),this.player.anchor.set(.5),this.player.position.set(n,r),this.player.width=this.player.height=i,this.player.tint=15374429,this.velocity=2,this.shooting=new k({app:e,player:this.player}),this.setMousePosition(n,0),this.app.stage.addChild(this.player),window.addEventListener("keydown",this.keydown),window.addEventListener("keyup",this.keyup)}outOfBounds(e){let i=this.player.y+this.player.height,n=this.player.x+this.player.width,{width:r,height:a}=this.app.screen,p={leftAndTop:60,right:r,bottom:a};switch(e){case"w":return i<p.leftAndTop;case"a":return n<p.leftAndTop;case"s":return i>p.bottom;case"d":return n>p.right;default:return!0}}update(){this.lookTo(),this.movePlayer(),this.shooting.update()}},S=v;var P=class{constructor({app:e,enemyRadius:i}){this.app=e,this.speed=1,this.enemy=new PIXI.Graphics,this.enemy.beginFill(16711680,1),this.enemy.drawCircle(0,0,i),this.enemy.endFill(),this.resetPosition(),e.stage.addChild(this.enemy)}resetPosition(){let e=this.randomPosition();this.enemy.position.set(e.x,e.y)}randomPosition(){let{width:e,height:i}=this.app.screen,n=Math.floor(Math.random()*4),r=new d(0,0);switch(n){case 0:r.x=e*Math.random();break;case 1:r.x=e,r.y=i*Math.random();break;case 2:r.x=e*Math.random(),r.y=i;break;case 3:r.y=i*Math.random();break;default:break}return r}removePlayerLife(e,i){e.lifes-=1,i.reset()}goToPlayer(e,i){let n=e.player,r=new d(this.enemy.position.x,this.enemy.position.y),a=new d(n.position.x,n.position.y);if(r.distance(a)<n.width/2){this.removePlayerLife(e,i);return}let s=a.subtract(r).normalize().multiplyScalar(this.speed);this.enemy.position.set(this.enemy.position.x+s.x,this.enemy.position.y+s.y)}kill(){this.enemy.destroy()}update(e,i){this.enemy.destroyed||this.goToPlayer(e,i)}},Y=P;var b=class{constructor({app:e,player:i}){this.app=e,this.player=i,this.initialInterval=this.spawnInterval=3e3,this.enemyRadius=16,this.spawns=[],this.startingSpawns=2,this.interval=setInterval(()=>this.spawn(i),this.initialInterval)}spawnLimit(){let e=20,i=Math.floor(this.player.points/e)||1;return this.startingSpawns+i}spawnTime(e){clearInterval(this.interval),this.spawnInterval=Math.max(this.spawnInterval-100,0),this.interval=setInterval(()=>this.spawn(e),this.spawnInterval)}spawn(e){if(this.spawns.length>=this.spawnLimit()||e.lifes<1)return;this.spawnTime(e);let{app:i,enemyRadius:n}=this,r=new Y({app:i,enemyRadius:n});this.spawns.push(r)}reset(){this.spawns.forEach(e=>e.kill()),this.spawns=[]}},T=b;var V=(o,e,i,n,r)=>{o.forEach(a=>{e.forEach((p,t)=>{let s=p.enemy.position.x-a.position.x,y=p.enemy.position.y-a.position.y;Math.sqrt(s*s+y*y)<i+n&&(e.splice(t,1),p.kill(),r.points+=1)})})},E=V;var I=class{constructor({app:e,player:i}){this.app=e,this.player=i;let n={fill:16777215};this.textPoints=new PIXI.Text(`Pontos: ${this.player.points}`,n),this.textPoints.position.set(0,0),this.textLifes=new PIXI.Text(`Vidas: ${this.player.lifes}`,n),this.textLifes.position.set(0,30),this.textLifes=new PIXI.Text("Pausado",n),this.textLifes.position.set(0,30);let r=e.screen.width/2,a=e.screen.height/6;this.textEnd=new PIXI.Text("Game Over",n),this.textEnd.visible=!1,this.textEnd.position.set(r,a),this.textEnd.anchor.set(.5),this.textPaused=new PIXI.Text("Pausado",n),this.textPaused.position.set(r,a),this.textPaused.anchor.set(.5),this.textPaused.visible=!1,this.app.stage.addChild(this.textPaused)}set showPaused(e){this.textPaused.visible=e}update(){this.textPoints.text=`Pontos: ${this.player.points}`,this.textLifes.text=`Vidas: ${this.player.lifes}`,this.player.lifes<1&&(this.textEnd.visible=!0),this.app.stage.addChild(this.textPoints),this.app.stage.addChild(this.textLifes),this.app.stage.addChild(this.textEnd)}},B=I;var F=document.getElementById("mycanvas"),u=new PIXI.Application({view:F,width:window.innerWidth,height:window.innerHeight}),f=!1,H={x:0,y:0},h=new S({app:u,mousePosition:H}),M=new B({app:u,player:h}),L=new X({app:u}),x=new T({app:u,player:h});u.ticker.add(()=>{M.update(),h.lifes<1&&(u.stage.removeChildren(),M.update()),h.update(),L.update(h),x.spawns.forEach(o=>o.update(h,x)),E(h.shooting.bullets,x.spawns,h.shooting.bulletRadius,x.enemyRadius,h)});u.renderer.view.onmousemove=function(o){h.setMousePosition(o.clientX,o.clientY)};u.renderer.view.onpointerdown=function(o){h.lifes<1||(h.shooting.shoot=!0,h.shooting.update())};u.renderer.view.onpointerup=function(o){h.shooting.shoot=!1,h.shooting.update()};window.addEventListener("keydown",o=>{o.key===" "&&(M.showPaused=!f,u.render(),f?u.start():u.stop(),f=!f)});export{u as app,h as player};
//# sourceMappingURL=index.js.map
