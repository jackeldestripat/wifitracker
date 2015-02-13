
var WifiSystem, WifiTracker;

function compare(a,b){
    if(a.level < b.level) return 1;
    if(a.level > b.level) return -1;
    return 0;
}

function WifiSystem(){
    this.scanResult = false;
    this.scanDataResult = false;
    this.dataScanResult = [];
}

WifiSystem.prototype = {
    winScan: function(){this.scanResult = true;},
    failScan: function(){this.scanResult = false;},
    
    winDataResult: function(data){
        WS.dataScanResult = data;
        this.scanDataResult = true;
    },
    
    failDataResult: function(){
        this.dataScanResult = [];
        this.scanDataResult = false;
    },
    
    getRawData: function(){return this.dataScanResult;},
    
    getWifiSignals: function(n){
        alert("SCAN INIT");
        WifiWizard.startScan(this.winScan, this.failScan);
        alert("SCAN ENDED");
        if(this.scanResult){
            WifiWizard.getScanResults({numLevels: false},this.winDataResult, this.failDataResult);
            if(this.scanDataResult){
                var temp = WS.getRawData();
                temp.sort(compare);
                return temp;
            }else{
                console.log("WifiSystem: SCAN RESULTS FAILED!");
            }
            
        }else{
            console.log("WifiSystem: SCAN FAILED!");
        }
        return [];
    }
};



function WifiTracker()
{
    this.fieldData = undefined;
    this.userData = undefined;
    this.oldCoords = undefined;
    this.newCoords = undefined;
    this.flagNewCoords = false;
}

WifiTracker.prototype = {
    //Set information about field
    configureField: function(field){
        if(field != undefined)
        {
            this.fieldData = field;
        }
    },
    configureServer: function(server){
        if(server != undefined)
        {
            this.serverData = server;
        }
    },
    configureUser: function(user){
        if(user != undefined)
        {
            this.userData = user;
        }
    },
    //Get 3 wifi sticks with better signal and get XY positions
    getWifiSticks: function(n){
        alert("GET WIFI STICKS");
        var result = WS.getWifiSignals(n|false);
        result = result.slice(0, 3);
        for(var i in result) console.log(result[i].SSID);
        var wifisticks = [];
        for(var i in result)
        {
            wifisticks.push({"name":result[i].SSID, "signal": -result[i].level, "x":this.fieldData.wifiSticks[result[i].SSID].x, "y":this.fieldData.wifiSticks[result[i].SSID].y});
        }
        return wifisticks;
    },
    //Get coords in relation with 3 wifisticks
    refreshCoords: function(sticks){

        if(sticks.length == 3){
            this.flagNewCoords = true;
            var pos = [];
            for(var i in sticks)
            {
                pos.push(sticks[i].x);
                pos.push(sticks[i].y);
                pos.push(sticks[i].signal*this.fieldData.conversionKey);
            }
            
            var a = pos[0], b = pos[1], r1 = pos[2],
                c = pos[3], d = pos[4], r2 = pos[5],
                e = pos[6], f = pos[7], r3 = pos[8];
            var a2 = a*a, b2 = b*b, r12 = r1*r1,
                c2 = c*c, d2 = d*d, r22 = r2*r2,
                e2 = e*e, f2 = f*f, r32 = r3*r3;
            
            var x = (2*(b-d)*(a2+b2-e2-f2-r12+r22)-2*(b-f)*(a2+b2-c2-d2-r12+r32));
            x /= (4*(-1*(b-f)*(a-c)+(a-e)*(b-d)));
            
            var y = -2*x*(a-c)+a2+b2-c2-d2-r12+r22;
            
            var tmp = 2*(b-d);
            if(tmp == 0) tmp = 0.1;
            y *= tmp;
            //y /= 2*(b-d);
            
            this.oldCoords = this.newCoords;
            this.newCoords = {};
            this.newCoords.x = x;
            this.newCoords.y = y;
            this.flagNewCoords = true;
        }else{
            this.flagNewCoords = false;
        }
    },
    //Allows send information about coords to server
    send: function(func){
        var packet = {};
        packet.user = this.userData;
        packet.coords = this.newCoords;
        func(packet);
    }
};
WS = new WifiSystem();
WT = new WifiTracker();
WT.configureField({
    "name":"Campo de pruebas",
    "conversionKey":0.8,
    "refreshTime": 5,
    "wifiSticks":{
        "palo1":{"name":"palo1", "x":0, "y":0},
        "palo2":{"name":"palo2", "x":75, "y":0},
        "palo3":{"name":"palo3", "x":75/2, "y":64.951},
    }
});