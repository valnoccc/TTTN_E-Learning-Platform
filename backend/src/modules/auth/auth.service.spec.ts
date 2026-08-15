import { AuthService } from './auth.service';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  const savedUser = {
    maND: 17,
    hoTen: 'Học viên mới',
    email: 'new-student@example.com',
    vaiTro: UserRole.STUDENT,
    ngayTao: new Date('2026-08-15T00:00:00.000Z'),
    matKhau: 'hashed-password',
  };

  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const jwtService = { sign: jest.fn() };
  const service = new AuthService(userRepository as any, jwtService as any);

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findOne.mockResolvedValue(null);
    userRepository.create.mockReturnValue(savedUser);
    userRepository.save.mockResolvedValue(savedUser);
    jwtService.sign.mockReturnValue('new-user-jwt');
  });

  it('creates a session for the newly registered account', async () => {
    const result = await service.register(
      'new-student@example.com',
      'password123',
      'Học viên mới',
    );

    expect(result).toEqual({
      access_token: 'new-user-jwt',
      user: expect.objectContaining({
        maND: 17,
        email: 'new-student@example.com',
        vaiTro: UserRole.STUDENT,
      }),
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 17,
      email: 'new-student@example.com',
      vaiTro: UserRole.STUDENT,
    });
  });
});
