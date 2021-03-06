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
 * Print component
 * Creates a AttributeList component
 * @author <a href="mailto:roybraam@b3partners.nl">Roy Braam</a>
 */
Ext.define ("viewer.components.Print",{
    extend: "viewer.components.Component",  
    panel: null,
    printForm: null,
    vl:null,
    minQuality: 128,
    minWidth: 550,
    combineImageService: null,
    legends:null,
    config:{
        name: "Print",
        title: "",
        titlebarIcon : "",
        tooltip : "",
        default_format: null,
        orientation: null,
        legend: null,
        max_imagesize: "2048",
        label: ""
    },
    /**
     * @constructor
     * creating a print module.
     */
    constructor: function (conf){  
        //set minwidth:
        if(conf.details.width < this.minWidth || !Ext.isDefined(conf.details.width)) conf.details.width = this.minWidth; 
        
        viewer.components.Print.superclass.constructor.call(this, conf);
        this.initConfig(conf);    
        this.legends={};
        
        this.combineImageService = Ext.create("viewer.CombineImage",{});
        
        var me = this;
        this.renderButton({
            handler: function(){
                me.buttonClick();
            },
            text: me.title,
            icon: me.titlebarIcon,
            tooltip: me.tooltip,
            label: me.label
        });
        
        this.viewerController.mapComponent.getMap().addListener(viewer.viewercontroller.controller.Event.ON_LAYER_VISIBILITY_CHANGED,this.layerVisibilityChanged,this);
        this.viewerController.mapComponent.getMap().addListener(viewer.viewercontroller.controller.Event.ON_LAYER_ADDED,this.layerAdded,this);
        this.viewerController.mapComponent.getMap().addListener(viewer.viewercontroller.controller.Event.ON_LAYER_REMOVED,this.layerRemoved,this);
        
        return this;
    },
    // Handler for changes to the visibility of layers
    layerVisibilityChanged : function (map,object ){
        var layer = object.layer;
        var vis = object.visible;
        if(vis){
            this.loadLegend(layer);
        }else{
           this.removeLegend(layer);
        }
    },
    /**
     *Called when layer is added to the map
     *@param map the map
     *@param object event object.
     */
    layerAdded: function (map,object){
        var layer = object.layer;
        var vis = layer.getVisible();
        if (vis){
            this.loadLegend(layer);
        }else{
            this.removeLegend(layer);
        }
    },
    /**
     *Called when a layer is removed
     */
    layerRemoved : function(map, object){
        var layer = object.layer;
        this.removeLegend(layer);
    },
    /** 
     * Called when a layer is added
     * @param layer the map layer of type viewer.viewerController.controller.Layer
     */
    loadLegend : function (layer){
        var appLayer = this.viewerController.getAppLayerById(layer.appLayerId);
        if (appLayer==undefined || appLayer==null){
            return;
        }
        //make the var ready, so we now it's loading.
        this.legends[appLayer.id]={};
        var me = this;
        this.viewerController.getLayerLegendInfo(appLayer,function(appLayer,legendObject){
                me.addLegend(appLayer,legendObject)
            },
            function(appLayer){
                me.failLegend(appLayer)
            });
        
        /*if (url!=null){
            var legend = {
                url: url,
                id: layer.appLayerId,
                name: layerTitle
            };
            this.legends.push(legend);
        }*/
    },
    
    removeLegend: function (layer){
        if (layer!=null){
            delete this.legends[layer.appLayerId];
        }
        if (!this.legendLoading()){
            this.createLegendSelector();
        }
    },
    /**
     * when Legend is succesfully loaded, add it to the legend object.
     */
    addLegend: function (appLayer,legendObject){
        if (this.legends[appLayer.id]!=undefined){           
            this.legends[appLayer.id]= legendObject;            
        }
        if (!this.legendLoading()){
            this.createLegendSelector();
        }
    },
    /**
     * When getting the legend failed, remove the var.
     */
    failLegend: function(appLayer){
        delete this.legends[appLayer.id];
        if (!this.legendLoading()){
            this.createLegendSelector();
        }
    },
    /**
     * Checks if there are still some legends loading
     * @return true if legends are loaded and false if loading legend finished.
     */
    legendLoading: function (){
        for (var key in this.legends){
            //if there is a var for the legend, it's not yet succesfully loaded nor it failed
            if (this.legends[key]==null){
                return true;
            }
        }
        return false;
    },
    /**
     * Called when the button is clicked. Opens the print window (if not already opened) and creates a form.
     * If the window was invisible the preview will be redrawn
     */
    buttonClick: function(){
        var restart=false;
        if(!this.popup.popupWin.isVisible()){
            this.popup.show();
            restart=true;
        }
        if (this.panel==null)
            this.createForm();
            this.setQuality();
        if (restart){            
            this.redrawPreview();
            this.createLegendSelector();
        }
    },
    /**
     * Create the print form.
     */
    createForm: function(){
        var me = this;
        
        var qualitySliderId = Ext.id();
        var rotateSliderId = Ext.id();
        this.panel = Ext.create('Ext.panel.Panel', {
            frame: false,
            bodyPadding: 5,
            width: "100%",
            height: "100%",
            border: 0,
            renderTo: me.getContentDiv(),
            layout: {
                type: 'vbox',
                align: 'stretch',
                pack: 'start'
                
            },            
            items: [{
                //top container (1)
                xtype: 'container',
                height: 200,
                layout: 'hbox',
                width: '100%',
                items: [/*{
                    xtype: "label",
                    text: "Kaart voorbeeld: "
                }*/{
                    xtype: 'container',
                    id: 'legendContainer',
                    height: 200,
                    flex: 0.4,
                    items: [{}]
                },{
                    xtype: 'container',
                    flex: 0.6,
                    height: 200,
                    html: '<div id="previewImg" style="width: 100%; height: 100%;"></div>'
                }]                
            },{
                //bottom container (2)
                xtype: 'container',
                layout: {
                    type: 'column'
                },
                style: {
                    marginTop: '15px'
                },
                width: '100%',
                items: [{
                    //bottom left (3)
                    xtype: 'container',
                    columnWidth: 0.4,
                    items: [{                        
                        xtype: "label",
                        text: "Titel"
                    },{
                        xtype: 'textfield',
                        width: '100%',                        
                        name: 'title',
                        value: ""
                    },{                        
                        xtype: "label",
                        text: "Subtitel"
                    },{
                        xtype: 'textfield',
                        name: 'subtitle',
                        value: ""
                    },{                        
                        xtype: "label",
                        text: "Optionele Tekst"
                    },{
                        xtype: 'textfield',
                        name: 'extraTekst',
                        value: ""
                    }]
                },{
                    //bottom right (4)
                    xtype: 'container',
                    columnWidth: 0.6,
                    items: [{
                        //kwality row (5)
                        xtype: 'container',                        
                        width: '100%',
                        items: [{                        
                            xtype: "label",
                            text: "Kwaliteit"
                        },{
                            xtype: 'container',
                            layout: {
                                type: 'column'
                            },
                            width: '100%',
                            items: [{
                                xtype: 'container',
                                html: '<div id="' + qualitySliderId + '"></div>',
                                columnWidth: 1
                            },{
                                xtype: 'button',
                                text: '<',
                                width: MobileManager.isMobile() ? 50 : 30,
                                componentCls: 'mobileLarge',
                                listeners: {
                                    click:{
                                        scope: this,
                                        fn: function (){
                                            this.qualitySlider.setValue(this.getMapQuality());
                                        }
                                    }
                                }  
                                //todo handle reset
                            }]
                        }]
                    },{
                        // (6)
                        xtype: 'container',
                        layout: {type: 'column'},
                        items: [{
                            //(7)
                            xtype: 'container',
                            columnWidth: 0.5,        
                            items: [{                                
                                xtype: 'label',
                                text: 'Orientatie'
                            },{
                                xtype: 'radiogroup',
                                name: "orientation", 
                                width: MobileManager.isMobile() ? 185 : 125,
                                items: [{
                                    boxLabel: 'Liggend', 
                                    name: 'orientation', 
                                    inputValue: 'landscape', 
                                    checked: me.getOrientation()=='landscape'
                                },{
                                    boxLabel: 'Staand', 
                                    name: 'orientation', 
                                    inputValue: 'portrait', 
                                    checked: !(me.getOrientation()=='landscape') 
                                }]                            
                            },{
                                xtype: 'checkbox',
                                name: 'includeLegend',
                                checked: me.getLegend(),
                                inputValue: true,
                                boxLabel: 'Legenda toevoegen'
                            }]                        
                        },{
                            //(8)
                            xtype: 'container',
                            columnWidth: 0.5,
                            items: [{
                                xtype: 'label',  
                                text: "Pagina formaat"  
                            },{
                                xtype: "flamingocombobox",                                
                                name: 'pageformat',
                                emptyText:'Maak uw keuze',
                                store: [['a4','A4'],['a3','A3']],
                                width: 100,
                                value: me.getDefault_format()? me.getDefault_format(): "a4"
                            },{
                                xtype: 'container',
                                html: '<div id="' + rotateSliderId + '"></div>'
                            }] 
                        }]
                    }]                        
                }]
            },{
                 xtype: 'label',
                 style: {
                     marginTop: "15px"
                 },
                 text: "* Door het draaien van de kaart kan niet de maximale kwaliteit worden opgehaald."  
            },{
                //button container 2b
                xtype: 'container',
                frame: false,
                style: {
                    marginTop: "15px"
                },
                items: [{
                    xtype: 'button',
                    text: 'Sluiten',
                    componentCls: 'mobileLarge',
                    style: {
                        "float": "right",
                        marginLeft: '5px'
                    },
                    listeners: {
                        click:{
                            scope: this,
                            fn: function (){
                                this.popup.hide()
                            }
                        }
                    }  
                },{
                    xtype: 'button',
                    text: 'Opslaan als RTF'  ,
                    componentCls: 'mobileLarge',
                    style: {
                        "float": "right",
                        marginLeft: '5px'
                    },
                    listeners: {
                        click:{
                            scope: this,
                            fn: function (){
                                this.submitSettings("saveRTF")
                            }
                        }
                    }                  
                },{
                    xtype: 'button',
                    text: 'Opslaan als PDF'  ,
                    componentCls: 'mobileLarge',
                    style: {
                        "float": "right",
                        marginLeft: '5px'
                    },
                    listeners: {
                        click:{
                            scope: this,
                            fn: function (){
                                this.submitSettings("savePDF")
                            }
                        }
                    }                    
                },{
                    xtype: 'button',
                    text: 'Printen via PDF',
                    componentCls: 'mobileLarge',
                    style: {
                        "float": "right",
                        marginLeft: '5px'
                    },
                    listeners: {
                        click:{
                            scope: this,
                            fn: function (){
                                this.submitSettings("printPDF")
                            }
                        }
                    }  
                }]                
            }]
        });
        
        this.qualitySlider = Ext.create(MobileManager.isMobile() ? 'viewer.components.MobileSlider' : 'Ext.slider.Single', {
            renderTo: qualitySliderId,
            name: "quality",
            value: 11,
            increment: 1,
            minValue: me.minQuality,
            maxValue: me.max_imagesize,
            width: Ext.get(qualitySliderId).getWidth(),
            listeners: {
                changecomplete: {
                    scope: this,
                    fn: function (slider,newValue){
                        this.qualityChanged(newValue);
                    }
                }
            }
        });
        
        this.rotateSlider = Ext.create(MobileManager.isMobile() ? 'viewer.components.MobileSlider' : 'Ext.slider.Single', {
            renderTo: rotateSliderId,
            name: 'angle',
            value: 0,
            increment: 1,
            minValue: 0,
            maxValue: 360,
            width: 100,
            labelAlign: "top",
            fieldLabel: 'Kaart draaien *',
            tipText: function(tumb){
                return tumb.value+"º";
            },
            listeners: {
                changecomplete: {
                    scope: this,
                    fn: function (slider,newValue){
                        this.angleChanged(newValue);
                    }
                }
            }
        });
        
        this.printForm = Ext.create('Ext.form.Panel', {            
            renderTo: me.getContentDiv(),
            url: actionBeans["print"],
            border: 0,
            visible: false,
            standardSubmit: true,
            items: [{
                xtype: "hidden",
                name: "params",
                id: 'formParams'
            }]
        });
    },
    /**
    * Call to redraw the preview
    */
    redrawPreview: function (){
        document.getElementById('previewImg').innerHTML = 'Loading...';
        var properties = this.getProperties();
        this.combineImageService.getImageUrl(Ext.JSON.encode(properties),this.imageSuccess,this.imageFailure);
    },
    /**
     * 
     */
    createLegendSelector: function(){       
        //only create legend when legends are loaded and the panel is created.        
        if (!this.legendLoading() && this.panel!=null){
            var checkboxes= new Array();      
            checkboxes.push({
                xtype: "label",
                text: "Opnemen in legenda:"
            });
            for (var key in this.legends){
                var appLayer =this.viewerController.getAppLayerById(key);
                var title = appLayer.alias;
                checkboxes.push({
                    xtype: "checkbox",
                    boxLabel: title,
                    name: 'legendUrl',
                    inputValue: Ext.JSON.encode(this.legends[key]),
                    id: 'legendCheckBox'+key,
                    checked: true
                });
            } 
            Ext.getCmp('legendContainer').removeAll();
            Ext.getCmp('legendContainer').add(checkboxes);        
            Ext.getCmp('legendContainer').doLayout();
        }
    },
    /**
     * Set the quality from the map in the slider
     */
    setQuality: function(){
        this.qualitySlider.setValue(this.getMapQuality(),false);
    },
    /**
     *Gets the map 'quality'
     *@return the 'quality' of the map (the biggest dimension: height or width)
     */
    getMapQuality: function(){
        var width = this.viewerController.mapComponent.getMap().getWidth();
        var height = this.viewerController.mapComponent.getMap().getHeight();
        return width > height? width : height;
    },
    /**
     * Called when quality is changed.
     */
    qualityChanged: function(newValue){
        var angle=this.rotateSlider.getValue();
        if (angle>0){
            this.correctQuality(angle);
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
            
    },
    /**
     * Called when the angle is changed.
     */
    angleChanged: function (newValue){
        if (newValue>0){
            this.correctQuality(newValue);
        } 
        this.redrawPreview();
    },
    /**
     * Corrects the quality slider to the max quality possible with the given angle
     * @param angle the angle that is set.
     */
    correctQuality: function(angle){
        //get the max quality that is allowed with the given angle
        var maxQuality =this.getMaxQualityWithAngle(angle);        
        var sliderQuality = this.qualitySlider.getValue();
        if (sliderQuality > maxQuality){
            this.qualitySlider.setValue(maxQuality);
        }
    },
    /**
     * Get the maximum quality that is possible with the given angle
     */
    getMaxQualityWithAngle: function(angle){
        //only if a rotation must be done.
        if (angle==0 || angle==360)
            return this.max_imagesize;
        
        var width = this.viewerController.mapComponent.getMap().getWidth();
        var height = this.viewerController.mapComponent.getMap().getHeight();
        var sliderQuality = this.qualitySlider.getValue();
        var ratio = width/height;
        //calculate the new widht and height with the quality
        if (height> width){
            height = sliderQuality;
            width = sliderQuality * ratio;
        }else{
            width = sliderQuality;
            height = sliderQuality/ratio;
        }
        //calc divide only twice
        var width2 = width/2;
        var height2 = height/2;
        
        var newCoords = new Array();        
        //calculate rotation with the rotation point transformed to 0,0
        newCoords[0] = this.calcRotationX(angle,-width2,-height2);
        newCoords[1] = this.calcRotationX(angle,width2,-height2);
        newCoords[2] = this.calcRotationX(angle,width2,height2);
        newCoords[3] = this.calcRotationX(angle,-width2,height2);
        //transform the rectangle (or square) back
        for (var c in newCoords){
            var coord=newCoords[c];
            coord.x= coord.x + width2;
            coord.y= coord.y + height2;
        }
        //get the bbox of both the extents. (original and rotated)
        var totalBBox= new viewer.viewercontroller.controller.Extent(0,0,width,height);
        for (var c in newCoords){
            var coord = newCoords[c];
            if (coord.x > totalBBox.maxx){
                totalBBox.maxx=coord.x;
            }if (coord.x < totalBBox.minx){
                totalBBox.minx=coord.x;
            }if (coord.y > totalBBox.maxy){
                totalBBox.maxy=coord.y;
            }if (coord.y < totalBBox.miny){
                totalBBox.miny=coord.y;
            } 
        }
        //calculate the new widht and height en check what the size would be in pixels
        var newWidth= totalBBox.maxx - totalBBox.minx;
        var newHeight= totalBBox.maxy - totalBBox.miny;
        var maxQuality = newWidth > newHeight ? newWidth : newHeight;
        
        //if the quality is bigger then the max allowed the original quality would be lower.
        if (maxQuality > this.max_imagesize){
            maxQuality = (this.max_imagesize*this.max_imagesize)/maxQuality;
        }        
        //because its in pixels floor.
        return Math.floor(maxQuality);
    },
    /**
     * Calculate the new x,y when a rotation is done with angle. The rotation point must be transformed to 0
     * @param angle the angle of rotation in degree
     * @param x the x coord
     * @param y the y coord
     */    
    calcRotationX: function (angle,x,y){
        //first calc rad
        var rad=Math.PI / 180 * angle;
        //x=x*cos(angle)-y*sin(angle) 
        //y=x*sin(angle)+y*cos(angle) 
        var returnValue= new Object();
        returnValue.x= x * Math.cos(rad) - y * Math.sin(rad);
        returnValue.y= x * Math.sin(rad) + y * Math.cos(rad);
        return returnValue;
    },
    /**
    * Called when a button is clicked and the form must be submitted.
    */
    submitSettings: function(action){        
        var properties = this.getProperties();
        properties.action=action;
        Ext.getCmp('formParams').setValue(Ext.JSON.encode(properties));
        //this.combineImageService.getImageUrl(Ext.JSON.encode(properties),this.imageSuccess,this.imageFailure);        
        this.printForm.submit({            
            target: '_blank'
        });
    },
    /**
     *Called when the imageUrl is succesfully returned
     *@param imageUrl the url to the image
     */
    imageSuccess: function(imageUrl){        
        if(Ext.isEmpty(imageUrl) || !Ext.isDefined(imageUrl)) imageUrl = null;
        if(imageUrl === null) document.getElementById('previewImg').innerHTML = 'Afbeelding laden mislukt';
        else {
            var image = new Image();
            image.onload = function() {
                var img = document.createElement('img');
                img.src = imageUrl;
                img.style.border = "1px solid gray";
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100%";
                var preview = document.getElementById('previewImg');
                preview.innerHTML = '';
                preview.appendChild(img);
            }
            image.src = imageUrl;
        }
    },
    /**
     *Called when the imageUrl is succesfully returned
     *@param error the error message
     */
    imageFailure: function(error){
        console.log(error);
    },
    /**
     *Get all the properties from the map and the print form
     */
    getProperties: function(){
        var properties = this.getValuesFromContainer(this.panel);
        properties.angle = this.rotateSlider.getValue();
        properties.quality = this.qualitySlider.getValue();
        properties.appId = this.viewerController.app.id;
        var mapProperties=this.getMapValues();        
        Ext.apply(properties, mapProperties);
        return properties;
    },
    /**
     *Get all the map properties/values
     */
    getMapValues: function(){
        var values = new Object();
        var printLayers = new Array();
        var wktGeoms= new Array();
        //get last getmap request from all layers
        var layers=this.viewerController.mapComponent.getMap().getLayers();        
        for (var i=0; i < layers.length; i ++){
            var layer = layers[i];
            if (layer.getVisible()){
                if (layer.getType()== viewer.viewercontroller.controller.Layer.VECTOR_TYPE){
                    var features=layer.getAllFeatures();
                    for (var f =0; f < features.length; f++){
                        var feature=features[f];
                        if (feature.getWktgeom()!=null){
                            wktGeoms.push(feature);
                        }
                    }
                }else{
                    var requests=layer.getLastMapRequest();                
                    for (var r in requests){
                        var request= requests[r];
                        if (request){
                            request.protocol=layer.getType();
                            var alpha=layer.getAlpha();
                            if (alpha!=null)
                                request.alpha = alpha;           
                            printLayers.push(request);
                            //do a to string for the extent.
                            if (request.extent){
                                request.extent=request.extent.toString();
                            }
                            //TODO tiling is now added as images, needs te be added as a tiling server
                            if (layer.getType()== viewer.viewercontroller.controller.Layer.TILING_TYPE){
                                request.protocol=viewer.viewercontroller.controller.Layer.IMAGE_TYPE;                                
                            }
                        }
                    }
                }
            }
        }
        values.requests=printLayers;        
        var bbox=this.viewerController.mapComponent.getMap().getExtent();
        if (bbox){
            values.bbox = bbox.minx+","+bbox.miny+","+bbox.maxx+","+bbox.maxy;
        }
        values.width = this.viewerController.mapComponent.getMap().getWidth();
        values.height = this.viewerController.mapComponent.getMap().getHeight();
        values.geometries = wktGeoms;
        return values;
    },
    /**
     * Get the item values of the given container.
     */
    getValuesFromContainer: function(container){
        var config=new Object();
        for( var i = 0 ; i < container.items.length ; i++){
            //if its a radiogroup get the values with the function and apply the values to the config.
            if ("radiogroup"==container.items.get(i).xtype){
                Ext.apply(config, container.items.get(i).getValue());       
            }else if ("container"==container.items.get(i).xtype || "fieldcontainer"==container.items.get(i).xtype){
                Ext.apply(config,this.getValuesFromContainer(container.items.get(i)));
            }else if (container.items.get(i).name!=undefined){
                var value=container.items.get(i).getValue();
                if ("checkbox"==container.items.get(i).xtype){
                    if (value==true){
                        value = container.items.get(i).getSubmitValue();
                    }else{
                        value=null;
                    }
                }                    
                if (value==null)
                    continue;
                if (config[container.items.get(i).name]==undefined){
                    config[container.items.get(i).name] = value;
                }else if (config[container.items.get(i).name] instanceof Array){
                    config[container.items.get(i).name].push(value);
                }else{
                    var tmp = new Array();
                    tmp.push(config[container.items.get(i).name]);
                    tmp.push(value);
                    config[container.items.get(i).name]=tmp;
                }
                
            }
        }
        return config;
    },

    getExtComponents: function() {
        return [ (this.panel !== null) ? this.panel.getId() : '' ];
    }
});

