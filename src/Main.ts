//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class Main extends eui.UILayer {

    private loadingView:LoadingUI;

    private world: p2.World;
    private time:number;
    private _isDebug:boolean = false;
    protected createChildren(): void {
        super.createChildren();

        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }

        //inject the custom material parser
        //注入自定义的素材解析器
        let assetAdapter = new AssetAdapter();
        egret.registerImplementation("eui.IAssetAdapter", assetAdapter);
        egret.registerImplementation("eui.IThemeAdapter", new ThemeAdapter());

        this.runGame().catch(e => {
            console.log(e);
        })
    }

    private async runGame() {
        await this.loadResource()
        this.createGameScene();
    }

    private async loadResource() {
        try {
            const loadingView = new LoadingUI();
            this.stage.addChild(loadingView);
            await RES.loadConfig("resource/default.res.json", "resource/");
            await this.loadTheme();
            await RES.loadGroup("preload", 0, loadingView);
            this.stage.removeChild(loadingView);
        }
        catch (e) {
            console.error(e);
        }
    }

    private loadTheme() {
        return new Promise((resolve, reject) => {
            // load skin theme configuration file, you can manually modify the file. And replace the default skin.
            //加载皮肤主题配置文件,可以手动修改这个文件。替换默认皮肤。
            let theme = new eui.Theme("resource/default.thm.json", this.stage);
            theme.addEventListener(eui.UIEvent.COMPLETE, () => {
                resolve();
            }, this);

        })
    }

    private textfield: egret.TextField;
    /**
     * 创建场景界面
     * Create scene interface
     */
    protected createGameScene(): void {
        var intervalID = setInterval(onTick, 30);
        function onTick(dt){
            world.step(30 / 1000);
            if (!self._isDebug) {
                var stageHeight:number = 100;
                var l = world.bodies.length;
                for (var i:number = 0; i < l; i++) {
                    var boxBody:p2.Body = world.bodies[i];
                    var box:egret.DisplayObject = boxBody.displays[0];
                    if (box) {
                        box.x = boxBody.position[0] * factor;
                        box.y = stageHeight - boxBody.position[1] * factor;
                        box.rotation = 360 - boxBody.angle * 180 / Math.PI;
                        if (boxBody.sleepState == p2.Body.SLEEPING) {
                            box.alpha = 0.5;
                        }
                        else {
                            box.alpha = 1;
                        }
                    }
                }
            }   
        }

        var factor:number = 50;

        //创建world
        var world:p2.World = new p2.World();
        world.sleepMode = p2.World.BODY_SLEEPING;
        //创建plane
        var planeShape:p2.Plane = new p2.Plane();
        var planeBody:p2.Body = new p2.Body({position:[0, -15]});
        planeBody.addShape(planeShape);
        planeBody.displays = [];

        world.addBody(planeBody);

        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, onTouch, this);

        function onTouch(e:egret.TouchEvent):void {
            var positionX:number = Math.floor(e.stageX / factor);
            var positionY:number = Math.floor((e.stageY) / factor);
			addOneBox(positionX, positionY);
        }
        var self = this;
        function addOneBox(positionX,positionY) {
			if (Math.random() > 0.5) {
                //添加方形刚体
                var boxShape:p2.Shape = new p2.Box({width:2, height:1});
                var boxBody:p2.Body = new p2.Body({ mass: 1, position: [positionX, positionY], angularVelocity: 1});
                boxBody.addShape(boxShape);
                world.addBody(boxBody);

                var display:egret.DisplayObject = self.createBitmapByName("rect_png");
                display.width = (<p2.Box>boxShape).width * factor;
                display.height = (<p2.Box>boxShape).height * factor;
            }
            else {
                //添加圆形刚体
                var boxShape:p2.Shape = new p2.Circle({radius:1});
                var boxBody:p2.Body = new p2.Body({ mass: 1, position: [positionX, positionY]});
                boxBody.addShape(boxShape);
                world.addBody(boxBody);

                var display:egret.DisplayObject = self.createBitmapByName("circle_png");
                display.width = (<p2.Circle>boxShape).radius * 2 * factor;
                display.height = (<p2.Circle>boxShape).radius * 2 * factor;
            }

            if (!self._isDebug) {
                display.anchorOffsetX = display.width / 2
				display.anchorOffsetY = display.height / 2;
                boxBody.displays = [display];
                self.addChild(display);
            }
		}
		for(var i=0;i<8;i++){
			addOneBox(2*i+2,2*i+5);
		}
		
		var bitmapFont:egret.BitmapFont = RES.getRes("font_fnt");

		var bitmapText:egret.BitmapText = new egret.BitmapText();

		bitmapText.text = "Click!"
	
		bitmapText.font = bitmapFont;
		bitmapText.anchorOffsetX = bitmapText.width / 2;
		bitmapText.anchorOffsetY = bitmapText.height / 2;
		bitmapText.x = this.stage.stageWidth / 2;
		bitmapText.y = this.stage.stageHeight / 2;
		this.addChild(bitmapText);
		bitmapText.touchEnabled = true;
		bitmapText.addEventListener(egret.TouchEvent.TOUCH_TAP,(event:egret.TouchEvent)=>{
			this.removeChild(bitmapText);
		},this);
    }

    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string): egret.Bitmap {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }
}