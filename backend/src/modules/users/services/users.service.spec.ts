import { UsersService } from './users.service';

describe('UsersService', () => {
  const userRepository = {
    find: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const service = new UsersService(userRepository as never);

  beforeEach(() => {
    userRepository.find.mockReset();
    userRepository.update.mockReset();
    userRepository.findOne.mockReset();
  });

  it('maps profile updates into the legacy user schema', async () => {
    userRepository.update.mockResolvedValueOnce(undefined);
    userRepository.findOne.mockResolvedValueOnce({
      maND: 7,
      hoTen: 'Nguyen Van A',
      anhDaiDien: 'https://example.com/avatar.png',
      soDienThoai: '0900000000',
    });

    await expect(
      service.update(7, {
        name: 'Nguyen Van A',
        avatarUrl: 'https://example.com/avatar.png',
        soDienThoai: '0900000000',
      }),
    ).resolves.toEqual({
      maND: 7,
      hoTen: 'Nguyen Van A',
      anhDaiDien: 'https://example.com/avatar.png',
      soDienThoai: '0900000000',
    });

    expect(userRepository.update).toHaveBeenCalledWith(7, {
      hoTen: 'Nguyen Van A',
      anhDaiDien: 'https://example.com/avatar.png',
      soDienThoai: '0900000000',
    });
  });
});
