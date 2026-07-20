package com.goodearth.postsales.system.service;

import com.goodearth.postsales.common.exception.CustomException;
import com.goodearth.postsales.system.dto.SystemSettingDto;
import com.goodearth.postsales.system.entity.SystemSetting;
import com.goodearth.postsales.system.repository.SystemSettingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SystemSettingServiceTest {

    @Mock
    private SystemSettingRepository repository;

    @InjectMocks
    private SystemSettingServiceImpl service;

    @Test
    public void testGetAllSettings() {
        SystemSetting s1 = new SystemSetting();
        s1.setKey("KEY1");
        s1.setValue("VAL1");
        s1.setDescription("DESC1");

        SystemSetting s2 = new SystemSetting();
        s2.setKey("KEY2");
        s2.setValue("VAL2");
        s2.setDescription("DESC2");

        when(repository.findAll()).thenReturn(Arrays.asList(s1, s2));

        List<SystemSettingDto> result = service.getAllSettings();

        assertEquals(2, result.size());
        assertEquals("KEY1", result.get(0).getKey());
        assertEquals("VAL1", result.get(0).getValue());
        assertEquals("DESC1", result.get(0).getDescription());
        assertEquals("KEY2", result.get(1).getKey());
    }

    @Test
    public void testGetSetting_Success() {
        SystemSetting setting = new SystemSetting();
        setting.setKey("SYNC");
        setting.setValue("60");

        when(repository.findById("SYNC")).thenReturn(Optional.of(setting));

        SystemSettingDto result = service.getSetting("SYNC");

        assertNotNull(result);
        assertEquals("SYNC", result.getKey());
        assertEquals("60", result.getValue());
    }

    @Test
    public void testGetSetting_NotFound() {
        when(repository.findById("MISSING")).thenReturn(Optional.empty());

        assertThrows(CustomException.class, () -> service.getSetting("MISSING"));
    }

    @Test
    public void testUpdateSetting_Success() {
        SystemSetting setting = new SystemSetting();
        setting.setKey("SYNC");
        setting.setValue("60");

        when(repository.findById("SYNC")).thenReturn(Optional.of(setting));
        when(repository.save(any(SystemSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SystemSettingDto result = service.updateSetting("SYNC", "120");

        assertNotNull(result);
        assertEquals("SYNC", result.getKey());
        assertEquals("120", result.getValue());
        verify(repository).save(setting);
    }
}
