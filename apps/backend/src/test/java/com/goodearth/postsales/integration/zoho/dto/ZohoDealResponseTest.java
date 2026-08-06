package com.goodearth.postsales.integration.zoho.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ZohoDealResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testAllLookupObjectMappings() throws Exception {
        String json = """
            {
              "data": [
                {
                  "id": "6638590000147509027",
                  "Deal_Name": "uumang2-260826",
                  "Project_Site": {
                    "id": "6638590000147509001",
                    "name": "umang"
                  },
                  "Unit_Name": {
                    "id": "6638590000147509005",
                    "name": "uumang2"
                  },
                  "Contact_Name": {
                    "id": "6638590000146778051",
                    "name": "Jay s"
                  },
                  "Owner": {
                    "id": "6638590000000345001",
                    "name": "GoodEarth Bangalore",
                    "email": "bangalore@goodearth.org.in"
                  },
                  "Created_By": {
                    "id": "6638590000000345001",
                    "name": "GoodEarth Bangalore",
                    "email": "bangalore@goodearth.org.in"
                  },
                  "Modified_By": {
                    "id": "6638590000000345001",
                    "name": "GoodEarth Bangalore",
                    "email": "bangalore@goodearth.org.in"
                  },
                  "$layout_id": {
                    "id": "6638590000000091023",
                    "name": "Standard",
                    "display_label": "Standard"
                  }
                }
              ]
            }
            """;

        ZohoDealResponse response = objectMapper.readValue(json, ZohoDealResponse.class);
        assertNotNull(response);
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());

        ZohoDealResponse.ZohoDeal deal = response.getData().get(0);
        assertEquals("6638590000147509027", deal.getId());
        assertEquals("uumang2-260826", deal.getDealName());
        assertEquals("umang", deal.getProjectName());

        assertNotNull(deal.getUnitName());
        assertEquals("6638590000147509005", deal.getUnitName().getId());
        assertEquals("uumang2", deal.getUnitName().getName());
        assertEquals("uumang2", deal.getResolvedUnitName());

        assertNotNull(deal.getContactName());
        assertEquals("6638590000146778051", deal.getContactName().getId());
        assertEquals("Jay s", deal.getContactName().getName());

        assertNotNull(deal.getOwner());
        assertEquals("6638590000000345001", deal.getOwner().getId());
        assertEquals("GoodEarth Bangalore", deal.getOwner().getName());

        assertNotNull(deal.getCreatedBy());
        assertEquals("GoodEarth Bangalore", deal.getCreatedBy().getName());

        assertNotNull(deal.getModifiedBy());
        assertEquals("GoodEarth Bangalore", deal.getModifiedBy().getName());

        assertNotNull(deal.getLayout());
        assertEquals("Standard", deal.getLayout().getName());
        assertEquals("Standard", deal.getLayout().getDisplayLabel());
    }

    @Test
    void testStringFallbackMapping() throws Exception {
        String json = """
            {
              "data": [
                {
                  "id": "12345",
                  "Deal_Name": "Deal 1",
                  "Project_Name": "Legacy Project",
                  "Unit_Name": "Legacy Unit"
                }
              ]
            }
            """;

        ZohoDealResponse response = objectMapper.readValue(json, ZohoDealResponse.class);
        assertNotNull(response);
        ZohoDealResponse.ZohoDeal deal = response.getData().get(0);
        assertEquals("Legacy Project", deal.getProjectName());
        assertNotNull(deal.getUnitName());
        assertEquals("Legacy Unit", deal.getUnitName().getName());
    }
}

