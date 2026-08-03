import { InstructorProfileDetailsService } from './instructor-profile-details.service';

describe('InstructorProfileDetailsService', () => {
  it('replaces qualifications and experiences independently for one profile', async () => {
    const qualificationRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn((items) => Promise.resolve(items)),
    };
    const experienceRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn((items) => Promise.resolve(items)),
    };
    const service = new InstructorProfileDetailsService(
      qualificationRepository as never,
      experienceRepository as never,
    );
    const qualifications = [{ TenTruong: 'University', TenBangCap: 'Bachelor' }];
    const experiences = [{ TenDonVi: 'Edumeo', ChucVu: 'Instructor' }];

    const result = await service.replaceDetails(12, { qualifications, experiences });

    expect(qualificationRepository.delete).toHaveBeenCalledWith({ MaHoSo: 12 });
    expect(experienceRepository.delete).toHaveBeenCalledWith({ MaHoSo: 12 });
    expect(qualificationRepository.create).toHaveBeenCalledWith({ MaHoSo: 12, ThuTu: 0, ...qualifications[0] });
    expect(experienceRepository.create).toHaveBeenCalledWith({ MaHoSo: 12, ThuTu: 0, ...experiences[0] });
    expect(result.qualifications).toHaveLength(1);
    expect(result.experiences).toHaveLength(1);
    expect(result.qualifications?.[0]).toMatchObject(qualifications[0]);
    expect(result.experiences?.[0]).toMatchObject(experiences[0]);
  });

  it('does not clear a list that is omitted from a partial update', async () => {
    const qualificationRepository = { delete: jest.fn(), create: jest.fn(), save: jest.fn() };
    const experienceRepository = { delete: jest.fn(), create: jest.fn(), save: jest.fn() };
    const service = new InstructorProfileDetailsService(
      qualificationRepository as never,
      experienceRepository as never,
    );

    await service.replaceDetails(12, { experiences: [] });

    expect(qualificationRepository.delete).not.toHaveBeenCalled();
    expect(experienceRepository.delete).toHaveBeenCalledWith({ MaHoSo: 12 });
  });

  it('accepts JSON strings from multipart profile updates', async () => {
    const qualificationRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn((items) => Promise.resolve(items)),
    };
    const experienceRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn((items) => Promise.resolve(items)),
    };
    const service = new InstructorProfileDetailsService(
      qualificationRepository as never,
      experienceRepository as never,
    );

    await service.replaceDetails(12, {
      qualifications: JSON.stringify([{ TenTruong: 'University', TenBangCap: 'Bachelor' }]) as never,
      experiences: JSON.stringify([{ TenDonVi: 'Edumeo', ChucVu: 'Instructor' }]) as never,
    });

    expect(qualificationRepository.create).toHaveBeenCalledWith({
      MaHoSo: 12,
      ThuTu: 0,
      TenTruong: 'University',
      TenBangCap: 'Bachelor',
    });
    expect(experienceRepository.create).toHaveBeenCalledWith({
      MaHoSo: 12,
      ThuTu: 0,
      TenDonVi: 'Edumeo',
      ChucVu: 'Instructor',
    });
  });
});
