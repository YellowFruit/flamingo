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
 * Logger component.
 * @author <a href="mailto:roybraam@b3partners.nl">Roy Braam</a>
 */
Ext.define ("viewer.components.LogMessage",{    
    statics:{
        ERROR: "error",
        WARNING: "warning",
        INFO: "info",
        DEBUG: "debug"
    },
    config:{
        type: "",
        message: ""
    },
    date: null,
    /**
     * @constructor for logger
     */
    constructor: function (conf){        
        this.initConfig(conf);        
        this.date = new Date();
    },
    toHtmlElement: function(){
        var el=new Ext.Element(document.createElement("div"));        
        el.addCls('logger_'+this.getType());
        el.insertHtml("beforeEnd",this.date.toString()+": <br/>"+this.getMessage());
        return el;
    }
});
