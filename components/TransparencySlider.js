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
 * HTML component
 * Creates a html component
 * @author <a href="mailto:meinetoonen@b3partners.nl">Meine Toonen</a>
 */

Ext.define ("viewer.components.TransparencySlider",{
    extend: "viewer.components.Component",
    config:{
        sliders : []
    },
    sliderObjects : [],
    constructor: function (conf){        
        viewer.components.TransparencySlider.superclass.constructor.call(this, conf);
        this.initConfig(conf);        
        
        for(var i = 0 ; i < this.sliders.length ; i ++){
            
            var config = Ext.Object.merge(conf, this.sliders[i]);
            var slider =Ext.create("viewer.components.Slider", config);
            this.sliderObjects.push(slider);
        }
        return this;
    }      
});

