import { NotFoundException } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';
import { InstructorApplicationsService } from './instructor-applications.service';

describe('InstructorApplicationsService', () => {
  const profile = {
    MaHoSo: 4,
    MaND: 7,
    TieuSu: 'Developer',
    ChuyenMon: 'Backend',
    SoTaiKhoan: '123456',
    MaNganHang: 'VCB',
    TenNganHang: 'Vietcombank',
    TenChuTaiKhoan: 'NGUYEN VAN A',
  };
  const dto = {
    TieuSu: 'Developer',
    ChuyenMon: 'Backend',
    SoTaiKhoan: '123456',
    MaNganHang: 'VCB',
    TenNganHang: 'Vietcombank',
    TenChuTaiKhoan: 'NGUYEN VAN A',
    FacebookURL: 'https://facebook.com/example',
  };
  let userRepository: { findOne: jest.Mock; save: jest.Mock };
  let profileRepository: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let authService: { createAuthResponseForUser: jest.Mock };
  let profileDetailsService: { replaceDetails: jest.Mock };
  let service: InstructorApplicationsService;

  beforeEach(() => {
    userRepository = { findOne: jest.fn(), save: jest.fn() };
    profileRepository = { findOne: jest.fn(), create: jest.fn((value) => value), save: jest.fn() };
    authService = { createAuthResponseForUser: jest.fn().mockReturnValue({ access_token: 'new-token' }) };
    profileDetailsService = { replaceDetails: jest.fn().mockResolvedValue(undefined) };
    service = new InstructorApplicationsService(userRepository as never, profileRepository as never, authService as never, profileDetailsService as never);
  });

  it('creates a profile, promotes the user, and returns a fresh auth response', async () => {
    const user = { maND: 7, vaiTro: UserRole.STUDENT };
    userRepository.findOne.mockResolvedValue(user);
    profileRepository.findOne.mockResolvedValue(null);
    profileRepository.save.mockResolvedValue({ ...profile, ...dto });
    userRepository.save.mockResolvedValue({ ...user, vaiTro: UserRole.INSTRUCTOR });

    const result = await service.apply(7, dto);

    expect(profileRepository.create).toHaveBeenCalledWith(expect.objectContaining({ MaND: 7, ...dto }));
    expect(user.vaiTro).toBe(UserRole.INSTRUCTOR);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(authService.createAuthResponseForUser).toHaveBeenCalledWith(user);
    expect(profileDetailsService.replaceDetails).not.toHaveBeenCalled();
    expect(result).toEqual({ access_token: 'new-token' });
  });

  it('updates an existing instructor profile instead of creating a duplicate', async () => {
    const user = { maND: 7, vaiTro: UserRole.INSTRUCTOR };
    const existingProfile = { ...profile };
    userRepository.findOne.mockResolvedValue(user);
    profileRepository.findOne.mockResolvedValue(existingProfile);
    profileRepository.save.mockResolvedValue(existingProfile);

    await service.apply(7, { ...dto, BangCaps: [], KinhNghiems: [] });

    expect(profileRepository.create).not.toHaveBeenCalled();
    expect(profileRepository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
    expect(profileDetailsService.replaceDetails).toHaveBeenCalledWith(4, {
      qualifications: [],
      experiences: [],
    });
  });

  it('rejects an unknown user', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.apply(7, dto)).rejects.toBeInstanceOf(NotFoundException);
  });
});
