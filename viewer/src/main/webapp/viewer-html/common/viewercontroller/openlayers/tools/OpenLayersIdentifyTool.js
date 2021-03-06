/* 
 * Copyright (C) 2012-2013 B3Partners B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * @class 
 * @constructor
 * @description An identify tool
 */
Ext.define("viewer.viewercontroller.openlayers.tools.OpenLayersIdentifyTool",{
    extend: "viewer.viewercontroller.openlayers.OpenLayersTool",
    map: null,
    deactivatedControls: null,
    wmsGetFeatureInfoControl:null,
    wmsGetFeatureInfoFormat: null,
    useWMSGetFeatureInfo:null,
    /**
     * Constructor
     * @param conf the configuration object
     * @param frameworkTool the openlayers control
     * @param map the viewer.viewercontroller.openlayers.OpenLayersMap
     */
    constructor : function (conf){
        this.wmsGetFeatureInfoFormat="application/vnd.ogc.gml";
        this.useWMSGetFeatureInfo=false;
        //this.wmsGetFeatureInfoFormat="text/plain";
        
        var frameworkOptions = {
            displayClass: "olControlIdentify",
            type: OpenLayers.Control.TYPE_TOOL,
            title: conf.tooltip
        };        
        var frameworkTool= new OpenLayers.Control(frameworkOptions);
        viewer.viewercontroller.openlayers.tools.OpenLayersIdentifyTool.superclass.constructor.call(this,conf,frameworkTool);
        this.map=this.viewerController.mapComponent.getMap();
        
        this.mapClick=new viewer.viewercontroller.openlayers.ToolMapClick({
            id: "mapclick_"+this.id,
            viewerController: this.viewerController,
            handler: {
                    fn: this.handleClick,
                    scope: this
            },
            handlerOptions: {                
                'stopSingle': true
            }
        });
        if(this.useWMSGetFeatureInfo){
            // add wms get featureInfo
            this.wmsGetFeatureInfoControl = new OpenLayers.Control.WMSGetFeatureInfo({
                drillDown: true,
                queryVisible: false,
                infoFormat: this.wmsGetFeatureInfoFormat
            });  
            this.wmsGetFeatureInfoControl.events.register("getfeatureinfo",this,this.raiseOnDataEvent);
            this.map.getFrameworkMap().addControl(this.wmsGetFeatureInfoControl);
        }
        // activate/deactivate
        this.getFrameworkTool().events.register("activate",this,this.activate);
        this.getFrameworkTool().events.register("deactivate",this,this.deactivate);
        return this;
    },
    activate: function(){
        //if mobile: disable the navigation control. To make sure the click can be handled
        //Click won't be handled if there is a navigation controller enabled (for mobile) 
        if (MobileManager.isMobile()){
            if (this.deactivatedControls==null){
                this.deactivatedControls=[];
            }
            var navigationTools= this.map.getFrameworkMap().getControlsByClass("OpenLayers.Control.Navigation");
            for (var i=0; i < navigationTools.length; i++){
                if (navigationTools[i].active){
                    this.deactivatedControls.push(navigationTools[i]);
                    navigationTools[i].deactivate();
                }
            }
        }
        //set dragPan.activate();
        //this.map.getFrameworkMap().events.register("click", this, this.handleClick);    
        this.mapClick.activateTool();
        if (this.wmsGetFeatureInfoControl!=null){
            this.wmsGetFeatureInfoControl.activate();
        }
    },
    deactivate: function(){
        //if mobile: enable the disactivated controls again
        if (MobileManager.isMobile()){
            while (!Ext.isEmpty(this.deactivatedControls)){
                var disCont = this.deactivatedControls.pop();
                disCont.activate();
            }
        }
        //this.map.getFrameworkMap().events.unregister("click", this, this.handleClick);
        this.mapClick.deactivateTool();
        //
        if (this.wmsGetFeatureInfoControl!=null){
            this.wmsGetFeatureInfoControl.deactivate();
        }
    },
    handleClick: function(tool,options){                
        this.map.fire(viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO,options);
    }, 
    //called when wms layers return data.           
    raiseOnDataEvent: function(evt){
        var options = new Object();  
        options.x = evt.xy.x;
        options.y = evt.xy.y;
        var coord = new Object();
        var c = this.map.pixelToCoordinate(options.x,options.y);
        coord.x = c.x;
        coord.y = c.y;        
        options.coord=coord;
        var data=[];
        for (var i=0; i< evt.features.length; i++){
            var features=[];
            features.push(evt.features[i].attributes);
            data[i]={
                request : {
                    appLayer: null,
                    serviceLayer: evt.features[i].type
                },
                features: features
            };
            i++;
        } 
        options.data=data;
        this.map.fire(viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_DATA,options);
    }
    
});