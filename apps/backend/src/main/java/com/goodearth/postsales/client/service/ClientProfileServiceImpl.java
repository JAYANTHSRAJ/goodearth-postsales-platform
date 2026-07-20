package com.goodearth.postsales.client.service;

import com.goodearth.postsales.auth.entity.User;
import com.goodearth.postsales.auth.repository.UserRepository;
import com.goodearth.postsales.client.dto.ClientProfileDto;
import com.goodearth.postsales.client.entity.ClientProfile;
import com.goodearth.postsales.client.repository.ClientProfileRepository;
import com.goodearth.postsales.common.enumeration.OnboardingStage;
import com.goodearth.postsales.common.exception.CustomException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientProfileServiceImpl implements ClientProfileService {

    private final UserRepository userRepository;
    private final ClientProfileRepository clientProfileRepository;

    public ClientProfileServiceImpl(UserRepository userRepository, ClientProfileRepository clientProfileRepository) {
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ClientProfileDto getProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    ClientProfile newProfile = new ClientProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        return mapToDto(user, profile);
    }

    @Override
    @Transactional
    public ClientProfileDto updateProfile(String email, ClientProfileDto dto) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        ClientProfile profile = clientProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    ClientProfile newProfile = new ClientProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        if (dto.getFullName() != null && !dto.getFullName().trim().isEmpty()) {
            user.setFullName(dto.getFullName().trim());
        }

        profile.setPhone(dto.getPhone());
        profile.setPanNumber(dto.getPanNumber());
        profile.setAddress(dto.getAddress());
        profile.setCity(dto.getCity());
        profile.setState(dto.getState());
        profile.setCountry(dto.getCountry());
        profile.setPostalCode(dto.getPostalCode());

        clientProfileRepository.save(profile);
        userRepository.save(user);

        int completion = calculateCompletion(user, profile);
        if (completion == 100 && user.getOnboardingStage() == OnboardingStage.PROFILE_PENDING) {
            user.setOnboardingStage(OnboardingStage.KYC_PENDING);
            userRepository.save(user);
        }

        return mapToDto(user, profile);
    }

    private int calculateCompletion(User user, ClientProfile profile) {
        int filledCount = 0;
        int totalCount = 8;

        if (isNotBlank(user.getFullName())) filledCount++;
        if (isNotBlank(profile.getPhone())) filledCount++;
        if (isNotBlank(profile.getPanNumber())) filledCount++;
        if (isNotBlank(profile.getAddress())) filledCount++;
        if (isNotBlank(profile.getCity())) filledCount++;
        if (isNotBlank(profile.getState())) filledCount++;
        if (isNotBlank(profile.getCountry())) filledCount++;
        if (isNotBlank(profile.getPostalCode())) filledCount++;

        return (int) (((double) filledCount / totalCount) * 100);
    }

    private boolean isNotBlank(String str) {
        return str != null && !str.trim().isEmpty();
    }

    private ClientProfileDto mapToDto(User user, ClientProfile profile) {
        ClientProfileDto dto = new ClientProfileDto();
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(profile.getPhone());
        dto.setPanNumber(profile.getPanNumber());
        dto.setAddress(profile.getAddress());
        dto.setCity(profile.getCity());
        dto.setState(profile.getState());
        dto.setCountry(profile.getCountry());
        dto.setPostalCode(profile.getPostalCode());
        dto.setCompletionPercent(calculateCompletion(user, profile));
        dto.setOnboardingStage(user.getOnboardingStage().name());
        return dto;
    }
}
