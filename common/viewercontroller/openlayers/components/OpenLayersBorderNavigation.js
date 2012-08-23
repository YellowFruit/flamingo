/* 
 * Copyright (C) 2012 B3Partners B.V.
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
 * OpenLayers BorderNavigation Component
 * Creates a BorderNavigation component for OpenLayers with the buttons at the border
 * @author <a href="mailto:roybraam@b3partners.nl">Roy Braam</a>
 */ 
Ext.define ("viewer.viewercontroller.openlayers.components.OpenLayersBorderNavigation",{
    extend: "viewer.viewercontroller.openlayers.OpenLayersComponent",
    north: null,
    south: null,
    east: null,
    west: null,
    
    timer:null,
    
    constructor: function (conf){        
        //arguments.push();
        this.callParent(arguments);
        this.frameworkObject=new OpenLayers.Control.PanPanel();
        return this;
    },
    /**
     * Can be overwritten to do something after the component is added.
     */
    doAfterAdd : function (){
        this.north = Ext.select(".olControlPanNorthItemInactive");        
        this.south = Ext.select(".olControlPanSouthItemInactive");
        this.east = Ext.select(".olControlPanEastItemInactive");
        this.west = Ext.select(".olControlPanWestItemInactive");     
        Ext.select(".olControlPanPanel").setStyle("left","0px");
        Ext.select(".olControlPanPanel").setStyle("top","0px");
        var me = this;
        Ext.EventManager.onWindowResize(function (){me.resizeOnceAfter(100);});
        this.resize();
    },
    /**
     * Make sure to resize only once after 'time' milisecs
     * If this function is called in the mean time, the timer is started again.
     * @param time time in milisecs
     */
    resizeOnceAfter: function (time){       
        var me=this;
        if (this.timer){
            clearTimeout(this.timer);
        }
        this.timer=setTimeout(function(){me.resize()},time);
        return;
    },
    /**
     * resize the component
     */
    resize: function(){
        var height  = Ext.select(".olMap").item(0).getHeight();
        var width  = Ext.select(".olMap").item(0).getWidth();
        var buttonSize=18;
        var halfwayHeight = Number((height-buttonSize)/2);
        var halfwayWidth = Number((width-buttonSize)/2);
        this.north.setStyle("top","0px");
        this.north.setStyle("left",halfwayWidth+"px");
        this.south.setStyle("top",height-buttonSize+"px");
        this.south.setStyle("left",halfwayWidth+"px");
        this.west.setStyle("top",halfwayHeight+"px");
        this.west.setStyle("left","0px");
        this.east.setStyle("top",halfwayHeight+"px");
        this.east.setStyle("left",width-buttonSize+"px");
    }
});


