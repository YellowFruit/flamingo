/**
 * @class 
 * @augments MapComponent
 * @description MapComponent subclass for Flamingo
 * @author <a href="mailto:meinetoonen@b3partners.nl">Meine Toonen</a>
 * @author <a href="mailto:roybraam@b3partners.nl">Roy Braam</a>
 **/
Ext.define("viewer.viewercontroller.FlamingoMapComponent",{
    extend: "viewer.viewercontroller.MapComponent",
    viewerObject : null,
    toolGroupId: "toolgroup",
    toolGroupCreated: false,
    flamingoId: "flamingo",
    mainContainerId: "mainContainer",
    toolMargin: 30,
    viewerController: null,
    enabledEvents: new Object(),
    /**
     * 
     * @constructur
     */
    constructor :function (viewerController, domId){
        viewer.viewercontroller.FlamingoMapComponent.superclass.constructor.call(this, viewerController,domId);
        this.viewerController = viewerController;
        var so = new SWFObject( contextPath + "/flamingo/flamingo.swf?config=config.xml", "flamingo", "100%", "100%", "8", "#FFFFFF");
        so.addParam("wmode", "transparent");
        so.write(domId);
        this.viewerObject = document.getElementById("flamingo");
        return this;
    },
    /**
     * Initialize the events. These events are specific for flamingo.
     */
    initEvents : function(){
        this.eventList[viewer.viewercontroller.controller.Event.ON_EVENT_DOWN]              	= "onEvent";
        this.eventList[viewer.viewercontroller.controller.Event.ON_EVENT_UP]                	= "onEvent";
        this.eventList[viewer.viewercontroller.controller.Event.ON_GET_CAPABILITIES]        	= "onGetCapabilities";
        this.eventList[viewer.viewercontroller.controller.Event.ON_CONFIG_COMPLETE]         	= "onConfigComplete";
        this.eventList[viewer.viewercontroller.controller.Event.ON_FEATURE_ADDED]		= "onGeometryDrawFinished";
        this.eventList[viewer.viewercontroller.controller.Event.ON_REQUEST]			= "onRequest";
        this.eventList[viewer.viewercontroller.controller.Event.ON_SET_TOOL]                   = "onSetTool";
        this.eventList[viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO]		= "onIdentify";
        this.eventList[viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_PROGRESS]		= "onIdentifyProgress";        
        this.eventList[viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_DATA]	= "onIdentifyData";
        this.eventList[viewer.viewercontroller.controller.Event.ON_ALL_LAYERS_LOADING_COMPLETE] = "onUpdateComplete";
        this.eventList[viewer.viewercontroller.controller.Event.ON_FINISHED_CHANGE_EXTENT]     = "onReallyChangedExtent";
        this.eventList[viewer.viewercontroller.controller.Event.ON_CHANGE_EXTENT]              = "onChangeExtent";
        this.eventList[viewer.viewercontroller.controller.Event.ON_LAYER_ADDED]                = "onAddLayer";
        this.eventList[viewer.viewercontroller.controller.Event.ON_LAYER_REMOVED]                = "onRemoveLayer";
        this.eventList[viewer.viewercontroller.controller.Event.ON_MAPTIP_DATA]                = "onMaptipData";
        this.eventList[viewer.viewercontroller.controller.Event.ON_MAPTIP]                = "onMaptip";
        this.eventList[viewer.viewercontroller.controller.Event.ON_MAPTIP_CANCEL]                = "onMaptipCancel";        
        this.eventList[viewer.viewercontroller.controller.Event.ON_MAP_CLICKED]                = "onMapClicked";        
        this.eventList[viewer.viewercontroller.controller.Event.ON_ACTIVE_FEATURE_CHANGED]                = "onActiveFeatureChange";
    },
    /**
     *Creates a Openlayers.Map object for this framework. See the openlayers.map docs
     *@param id the id of the map that is configured in the configuration xml
     *@param options Options for the map
     *@returns a FlamingoMapComponent
     */
    createMap : function(id,options){       
        options.id=id;
        options.mapComponent=this;
        var map = new viewer.viewercontroller.flamingo.FlamingoMap(options);
        //var maxExtent = options["maxExtent"];
        // map.setMaxExtent(maxExtent);
        return map;
    },
    /**
     *See @link MapComponent.createWMSLayer
     */
    createWMSLayer : function(name, url,ogcParams,options){
        var object=new Object();
        object["name"]=name;
        object["url"]=url;
        var ide=null;
        for (var key in ogcParams){
            object[key]=ogcParams[key];
        }
        for (var key in options){
            if (key.toLowerCase()=="id"){
                ide=options[key];
            }else{
                object[key]=options[key];
            }
        }
        if(ide == null){
            ide = name;
        }
        var config = {
            id: ide,
            options: object,
            frameworkLayer : this.viewerObject
        };
        return new viewer.viewercontroller.flamingo.FlamingoWMSLayer(config);
    },
    createArcConfig: function(name,server,servlet,mapservice,options){
        /*var object=new Object();
        object["name"]=name;
        object["server"]=server;
        object["servlet"]=servlet;
        object["mapservice"]=mapservice;*/
        var ide=options.id;
        delete options.id;
        options.name=name;
        options.server=server;
        options.servlet=servlet;
        options.mapservice=mapservice;
        var config ={
            id: ide,
            options: options,
            frameworkLayer : this.viewerObject
        };
        return config;
    },
    createArcIMSLayer : function(name,server,servlet,mapservice,options){
        var config=this.createArcConfig(name,server,servlet,mapservice,options);
        return new viewer.viewercontroller.flamingo.FlamingoArcIMSLayer(config);
    },
    createArcServerLayer : function(name,server,servlet,mapservice,options){    
        var newMapservice= servlet.substring(21,servlet.toLowerCase().indexOf("/mapserver"));
        mapservice=newMapservice;
        var config=this.createArcConfig(name,server,servlet,mapservice,options);
        //xxx for REST remove the next line.
        delete config.options.servlet;        
        config.options.esriArcServerVersion="9.3";
        config.options.dataframe="layers";        
        return new viewer.viewercontroller.flamingo.FlamingoArcServerLayer(config);
    },
    /**
     * Create a tool that is useable in Flamingo-mc
     * @See MapComponent.createTool
     * @param toolComponent the toolcomponent that must be created in flamingo as a useable tool 
     */
    createTool: function (conf){   
        if (Ext.isEmpty(conf.listenTo)){
            conf.listenTo=this.getMap().getId();
        }
        var tool = new viewer.viewercontroller.flamingo.FlamingoTool(conf);
        /*if(conf.type == Tool.GET_FEATURE_INFO){
            this.registerEvent(viewer.viewercontroller.controller.ON_GET_FEATURE_INFO, this.getMap(), options["handlerBeforeGetFeatureHandler"]);
            this.registerEvent(viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_DATA, this.getMap(), options["handlerGetFeatureHandler"]);
        }*/
        return tool;
    },
    /**
     *Create a flamingo component.
     *@param Configuration object
     *@see viewer.viewercontroller.flamingo.FlamingoComponent#constructor
     */
    createComponent: function (conf){  
        //set the listen to as default to the map
        if (Ext.isEmpty(conf.listenTo)){
            conf.listenTo=this.getMap().getId();
        }
        //set the name as id.
        if (Ext.isEmpty(conf.id)){
            conf.id=conf.name;
        }        
        var component = new viewer.viewercontroller.flamingo.FlamingoComponent(conf);        
        return component;
    },
    /**
     * See @link MapComponent.createVectorLayer
     */
    createVectorLayer : function (config){        
        config.frameworkLayer = this.viewerObject
        return new viewer.viewercontroller.flamingo.FlamingoVectorLayer(config);
    },
    /**
     * Creates a ToolGroup that is needed to add tools.
     * @param configuration has all the xml configurations that are passed to the flamingo call.
     */
    createToolGroup : function(configuration){
        var xml="";
        xml+="<fmc:ToolGroup ";
        for (var key in configuration){
            xml+=key+"=\""+configuration[key]+"\" ";
        }
        xml+="></fmc:ToolGroup>";
        this.viewerObject.callMethod(this.mainContainerId,'addComponent',xml);        
    },
    /**
     *See @link MapComponent.addTool
     */
    addTool : function(tool){        
        if (!(tool instanceof viewer.viewercontroller.flamingo.FlamingoTool)){
            Ext.Error.raise({
                msg: "The given tool is not of type 'FlamingoTool'"               
            });
        }
        //Set the left if no left or right is set
        if (tool.getLeft()==null && tool.getRight()==null){
            tool.setLeft(this.tools.length * this.toolMargin);
        }        
        this.getToolGroup(tool);
        viewer.viewercontroller.FlamingoMapComponent.superclass.addTool.call(this,tool);
        //var isToolGroup=this.viewerObject.callMethod(this.flamingoId,'isLoaded',this.toolGroupId,true);        
        
        var toolXml="<fmc:ToolGroup id='"+this.toolGroupId+"'>";
        toolXml+=tool.toXML();
        toolXml+="</fmc:ToolGroup>";        
        this.viewerObject.callMethod(this.flamingoId,'addComponent',toolXml);         
        if (this.tools.length ==1){
            this.activateTool(tool.getId());
        }
    },
    getToolGroup : function(tool){
        if (!this.toolGroupCreated){
            var lt = this.getMap().id;
            if ( lt==undefined || lt==null ){
                lt=tool.getListenTo();
            }
            this.createToolGroup({
                id: this.toolGroupId,
                listento: lt,
                width: "100%",
                height: "100",
                left: "10",
                top: "10"                
            });
            this.toolGroupCreated=true;
        }
        return this.toolGroupId;
    },
    /**
     * Adds a container to flamingo.
     * @param component the FlamingoComponent that must be added.
     */
    addComponent: function(component){
        if (!(component instanceof viewer.viewercontroller.flamingo.FlamingoComponent)){
            Ext.Error.raise({
                msg: "The given Component is not of type 'FlamingoComponent'"               
            });
        }
        viewer.viewercontroller.FlamingoMapComponent.superclass.addComponent.call(this,component);
        this.viewerObject.callMethod(this.mainContainerId,'addComponent',component.toXML()); 
        if (component.type==viewer.viewercontroller.controller.Component.MAPTIP){
            //if it's a maptip check for the maptipdelay. If not set, set it.
            var maptipdelay= this.viewerObject.callMethod(this.getMap().id,'getMaptipdelay');             
            if (maptipdelay==undefined){
                this.viewerObject.callMethod(this.getMap().id,'setMaptipdelay',component.getMaptipdelay()); 
            }
        }
    },
    /**
     */
    addComponentXml: function (xml){
        this.viewerObject.callMethod(this.mainContainerId,'addComponent',xml); 
    },
    /**
     * See @link MapComponent.activateTool
     */
    activateTool : function (id){
        this.viewerObject.call(this.toolGroupId, "setTool", id);
    },
    /**
     * See @link MapComponent.removeTool
     **/
    removeTool : function (tool){
        if (!(tool instanceof viewer.viewercontroller.flamingo.FlamingoTool)){
            Ext.Error.raise({msg: "The given tool is not of type 'FlamingoTool'"});
        }
        this.viewerObject.callMethod(tool.getId(),'setVisible',false);
        MapComponent.prototype.removeTool.call(this,tool);
    },
    /**
     *Add a map to the MapComponent.
     *For know only 1 map supported.
     */
    addMap : function (map){
        if (!(map instanceof viewer.viewercontroller.flamingo.FlamingoMap)){
            Ext.Error.raise({msg: "FlamingoMapComponent.addMap(): The given map is not of the type 'FlamingoMap'"});
        }
        this.maps.push(map);
    },
    /**
     * See @link MapComponent.removeToolById
     */
    removeToolById : function (id){
        var tool = this.getTool(id);
        if(tool == null || !(tool instanceof viewer.viewercontroller.flamingo.FlamingoTool)){
            Ext.Error.raise({msg: "The given tool is not of type 'FlamingoTool' or the given id does not exist"});
        }
        this.removeTool(tool);
    },
    /**
     *Get the map by id. If no id is given and 1 map is available that map wil be returned
     *@param mapId the mapId
     *@returns the Map with the id, or the only map.
     */
    getMap : function (mapId){
        if (mapId==undefined && this.maps.length==1){
            return this.maps[0];
        }
        var availableMaps="";
        for (var i=0; i < this.maps.length; i++){
            if (i!=0)
                availableMaps+=",";
            availableMaps+=this.maps[i].getId();
            if (this.maps[i].getId()==mapId){
                return this.maps[i];
            }
        }
        return null;
        //Ext.Error.raise({msg: "FlamingoMapComponent.getMap(): Map with id: "+mapId+" not found! Available maps: "+availableMaps});
    },
    /****************************************************************Event handling***********************************************************/

    /**
     * Registers an event to a handler, on a object. Flamingo doesn't implement per component eventhandling,
     * so this MapComponent stores the event in one big array.
     * This array is a two-dimensional array: the first index is the eventname (the generic one! Actually, not a name, but the given id).
     * The second index is the id of the object. 
     */
    registerEvent : function (event,object,handler,scope){
        if(object instanceof Ext.util.Observable){
            if(object == this){
                this.addListener(event,handler,scope);
            }else{
                object.registerEvent(event,handler,scope);
            }
        }else{
            alert("Unmapped event:",event);
            if( this.events[event] == undefined){
                this.events[event] = new Object();
            }
        
            if (this.events[event][object.getId()]==undefined){
                this.events[event][object.getId()]=new Array();
            }
            this.events[event][object.getId()].push(handler);
        }
    },
    /**
     *Unregister the event @link see MapComponent.unRegisterEvent
     */
    unRegisterEvent : function (event,object,handler){
        var newHandlerArray=new Array();
        for (var i=0; i < this.events[event][object.getId()].length; i++){
            if (handler != this.events[event][object.getId()][i]){
                newHandlerArray.push(this.events[event][object.getId()][i]);
            }
        }    
        if (newHandlerArray.length==0){
            delete this.events[event][object.getId()];
        }else{
            this.events[event][object.getId()]=newHandlerArray;
        }
    
    },
    getObject : function(name){
        if( name instanceof Array){
            name = name[0];
        } 
        name=""+name;                
        if(this.getMap(name)!= null){
            return this.getMap(name);
        }else if (this.getMap().getLayer(name)!=null){
            return this.getMap().getLayer(name);
        }else if(name.indexOf(this.getMap().getId()+"_")==0 && this.getMap().getLayer( (name.replace(this.getMap().getId() + "_" ,""))) != null){        
            return this.getMap().getLayer( (name.replace(this.getMap().getId() + "_" ,"")));
        }else if(this.getTool(name) != null){
            return this.getTool(name);
        }else if(name == this.getId()){
            return this;
        }else if(this.getMap().editMapId){
        }else{
            return null;
        }
    },
    /**
     * Handles all the events. This function retrieves the function registered to this event.
     * Flamingo doesn't understand per object eventhandling, but instead it fires an event, with a id of the object (and a bunch of parameters).
     * In this function we translate the events to per object events, and more specific events (button up/down)
     */
    handleEvents : function (event, component){
        var id = component[0];
        var object = this.getObject(id);
        // onEvent is a general event, fired when a jsButton is hovered over, pressed or released. Here we specify which it was.
        if(event == "onEvent"){
            if(component[1]["down"]){
                event = viewer.viewercontroller.controller.Event.ON_EVENT_DOWN;
            }else{
                // TODO: specify more events. This is not ONLY ON_EVENT_UP, but also hover.
                event = viewer.viewercontroller.controller.Event.ON_EVENT_UP;
            }
        }else{
            // Translate the specific name to the generic name. 
            event = this.getGenericEventName(event);
            if(event==null)
                return;
        }
        if (event==viewer.viewercontroller.controller.Event.ON_REQUEST){
            var obj=component[2];
            if (obj.requesttype=="GetMap"){
                var tokens = component[0].split("_");

                /* TODO kijken of we de functie kunnen uitbreiden zodat dit werkt met meer
                 * dan 3 tokens en of dat nut heeft. Kun je weten aan de hand van aantal tokens
                 * om wat voor layer het gaat ? */
                if (tokens.length == 2){
                    this.getMap(tokens[0]).getLayer(tokens[1]).setURL(obj.url);
                }
            
                if (tokens.length == 3){
                    this.getMap(tokens[0]).getLayer(tokens[1]+"_"+tokens[2]).setURL(obj.url);
                }
            }        
        }else if(event==viewer.viewercontroller.controller.Event.ON_SET_TOOL){
            //onchange tool is called for a tool group but event is registerd on the MapComponent
            id=this.getId();
            object = this.getObject(id);
        }else if( event == viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO){            
            component = {extent: component[1]};
        }else if ( event == viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_PROGRESS){
            component= {
                nr: component[1],
                total: component[2]
            };
        }else if( event == viewer.viewercontroller.controller.Event.ON_GET_FEATURE_INFO_DATA){
            var newComponent = new Object();
            var layerId=component[1];            
            newComponent.layer = this.getMap().getLayerByFlamingoId(layerId);
            newComponent.data = component[2];
            newComponent.extent= component[3];
            newComponent.nr = component[4];
            newComponent.total=component[5];
            component = newComponent;
        }else if (event == viewer.viewercontroller.controller.Event.ON_LAYER_ADDED){
            var layerId=component[1];
            //remove id_ from the layer id
            if (layerId.indexOf(id+"_")==0){
                layerId = layerId.substring(id.length+1);
            }
            var layer=object.getLayer(layerId);
            component=layer;
        }else if(event == viewer.viewercontroller.controller.Event.ON_LAYER_REMOVED){
            var layerId=component[1];
            //remove id_ from the layer id
            if (layerId.indexOf(id+"_")==0){
                layerId = layerId.substring(id.length+1);
            }
            var layer=object.getLayer(layerId);            
            component= new Object()
            component.layer=layer;
        }else if (event == viewer.viewercontroller.controller.Event.ON_MAPTIP_DATA){            
            var comp=new Object();
            comp.extent=component[2];
            comp.data=component[1];
            component=comp;
        }else if(event == viewer.viewercontroller.controller.Event.ON_ACTIVE_FEATURE_CHANGED ||event == viewer.viewercontroller.controller.Event.ON_FEATURE_ADDED){
            var layerName = component[1].fmc_layername;
            var layerObj = this.getMap().getLayer(layerName);
            var featureObj = Ext.create("viewer.viewercontroller.controller.Feature",component[1]);
            component = featureObj;
            object = layerObj;
        }
        if(object != undefined){
            object.fire(event,component);
        }
    },
    fire : function (event,options){
        this.fireEvent (event,this,options);
    },
    /**
     * Overwrites the addListener function. Add's the event to allowexternalinterface of flamingo
     * so flamingo is allowed to broadcast the event.
     */
    addListener : function(event,handler,scope){
        viewer.viewercontroller.FlamingoMapComponent.superclass.addListener.call(this,event,handler,scope);
        //enable flamingo event broadcasting
        if (this.viewerObject!=undefined && typeof this.viewerObject.callMethod == 'function' && this.eventList!=undefined){
            var flamEvent=this.eventList[event];
            if (flamEvent!=undefined){
                //if not enabled yet, enable
                if (this.enabledEvents[flamEvent]==undefined){
                    this.viewerObject.callMethod(this.getId(),"addAllowExternalInterface",this.getId()+"."+flamEvent);
                    this.enabledEvents[flamEvent]=true;                    
                }
            }     
        }else{
            var thisObj=this;
            setTimeout(function(){
                thisObj.addListener(event,handler,scope);
            },100);
        }
    }
});

/**
    * Entrypoint for flamingoevents. This function propagates the events to the webMapController (handleEvents).
    */
function dispatchEventJS(event, comp) {
    if(comp [0]== null){
            comp[0] = viewerController.mapComponent.getId();
        comp[1] = new Object();
    }
    try{
        viewerController.mapComponent.handleEvents(event,comp);    
    }catch(e){
        if (window.console && console.log)
            console.log(e);
    }
}
