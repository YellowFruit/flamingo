/*
 * Copyright (C) 2011 B3Partners B.V.
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
package nl.b3p.viewer.config.services;

import java.net.URL;
import java.util.Map;
import javax.persistence.*;
import nl.b3p.geotools.data.arcims.ArcIMSServer;
import nl.b3p.geotools.data.arcims.AxlField;
import nl.b3p.geotools.data.arcims.AxlLayerInfo;
import nl.b3p.web.WaitPageStatus;
import org.geotools.data.ServiceInfo;
import org.json.JSONException;
import org.json.JSONObject;
import org.stripesstuff.stripersist.Stripersist;

/**
 *
 * @author Matthijs Laan
 */
@Entity
@DiscriminatorValue(ArcIMSService.PROTOCOL)
public class ArcIMSService extends GeoService {
    public static final String PROTOCOL = "arcims";
    
    public static final String PARAM_SERVICENAME = "ServiceName";
    
    @Basic
    private String serviceName;

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    @Override
    public GeoService loadFromUrl(String url, Map params, WaitPageStatus status) throws Exception {
        try {
            status.setCurrentAction("Ophalen informatie...");
            
            serviceName = (String)params.get(PARAM_SERVICENAME);
            ArcIMSServer gtims = new ArcIMSServer(new URL(url), serviceName);

            ArcIMSService ims = new ArcIMSService();

            ServiceInfo si = gtims.getInfo();
            ims.setName(si.getTitle());
            ims.setServiceName(gtims.getServiceName());
            ims.setUrl(url);

            status.setProgress(30);
            status.setCurrentAction("Inladen layers...");
            status.setProgress(70);
            
            /* Automatically create featuresource */
            ArcXMLFeatureSource fs = new ArcXMLFeatureSource();
            fs.setLinkedService(ims);
            fs.setServiceName(ims.getServiceName());
            
            String fsName = ims.getName();
            int uniqueCounter = 0;
            while(true) {
                String testName;
                if(uniqueCounter == 0) {
                    testName = fsName;
                } else {
                    testName = fsName + " (" + uniqueCounter + ")";
                }
                try {
                    Stripersist.getEntityManager().createQuery("select 1 from FeatureSource where name = :name")
                        .setParameter("name", testName)
                        .setMaxResults(1)
                        .getSingleResult();
                    
                    uniqueCounter++;
                } catch(NoResultException nre) {
                    fsName = testName;
                    break;
                }
            }
            fs.setName(fsName);
            fs.setUrl(url);
            
            /* ArcIMS has a flat layer structure, create a virtual top layer */
            
            Layer top = new Layer();
            
            top.setVirtual(true);
            top.setTitle("Layers");
            top.setService(ims);

            for(AxlLayerInfo axlLayerInfo: gtims.getAxlServiceInfo().getLayers()) {
                top.getChildren().add(parseAxlLayerInfo(axlLayerInfo, ims, fs));
            }
            ims.setTopLayer(top);
            
            if(!fs.getFeatureTypes().isEmpty()) {
                Stripersist.getEntityManager().persist(fs);
            }
            
            return ims;
        } finally {
            status.setCurrentAction("");
            status.setProgress(100);
            status.setFinished(true);
        }
    }
    
    @Override
    public JSONObject toJSONObject() throws JSONException {
        JSONObject o = super.toJSONObject();
        if(serviceName != null) {
            o.put("ServiceName", serviceName);
        }
        return o;
    }
    
    private Layer parseAxlLayerInfo(AxlLayerInfo axl, GeoService service, ArcXMLFeatureSource fs) {
        Layer l = new Layer();
        l.setService(service);
        l.setFilterable(AxlLayerInfo.TYPE_FEATURECLASS.equals(axl.getType()));
        l.setQueryable(true);
        l.setName(axl.getId());
        l.setTitle(axl.getName());
        l.getDetails().put("axl_type", axl.getType());
        String s = axl.getMinscale();
        if(s != null) {
            try {
                l.setMinScale(Double.parseDouble(s.replace(',', '.')));
            } catch(NumberFormatException nfe) {
            }
        }
        s = axl.getMaxscale();
        if(s != null) {
            try {
                l.setMaxScale(Double.parseDouble(s.replace(',', '.')));
            } catch(NumberFormatException nfe) {
            }
        }
        
        if(axl.getFclass() != null) {
            SimpleFeatureType sft = new SimpleFeatureType();
            sft.setFeatureSource(fs);
            sft.setTypeName(axl.getId());
            sft.setWriteable(false);
            sft.setDescription(axl.getName());

            for(AxlField axlField: axl.getFclass().getFields()) {
                AttributeDescriptor att = new AttributeDescriptor();
                sft.getAttributes().add(att);
                att.setName(axlField.getName());

                String type;
                switch(axlField.getType()) {
                    case AxlField.TYPE_SHAPE: 
                        if(sft.getGeometryAttribute() == null) {
                            sft.setGeometryAttribute(att.getName());
                        }
                        type = AttributeDescriptor.TYPE_GEOMETRY;
                        break;
                    case AxlField.TYPE_BOOLEAN:
                        type = AttributeDescriptor.TYPE_BOOLEAN;
                        break;
                    case AxlField.TYPE_ROW_ID:
                    case AxlField.TYPE_BIG_INTEGER:
                    case AxlField.TYPE_SMALL_INTEGER:
                    case AxlField.TYPE_INTEGER:
                        type = AttributeDescriptor.TYPE_INTEGER;
                        break;
                    case AxlField.TYPE_DOUBLE:
                    case AxlField.TYPE_FLOAT:
                        type = AttributeDescriptor.TYPE_DOUBLE;
                        break;
                    case AxlField.TYPE_DATE:
                        type = AttributeDescriptor.TYPE_DATE;
                        break;
                    case AxlField.TYPE_CHAR:
                    case AxlField.TYPE_STRING:
                    default:
                        type = AttributeDescriptor.TYPE_STRING;
                }
                att.setType(type);
            }
            fs.getFeatureTypes().add(sft);
            l.setFeatureType(sft);
        }
                        
        return l;
    }
}
