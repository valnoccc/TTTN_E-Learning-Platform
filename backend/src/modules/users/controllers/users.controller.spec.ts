import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const usersService = {
    update: jest.fn(),
  };

  const controller = new UsersController(usersService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a JWT for profile updates', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      UsersController.prototype.update,
    );

    expect(guards).toContain(JwtAuthGuard);
  });

  it('rejects a profile update for another user', () => {
    expect(() =>
      (controller.update as any)(
        '8',
        { hoTen: 'Người dùng khác' },
        { user: { sub: 7 } },
      ),
    ).toThrow(ForbiddenException);
  });

  it('updates the profile when the JWT owner matches the requested user', () => {
    const updateUserDto = { hoTen: 'Người dùng hiện tại' };
    usersService.update.mockResolvedValue({ maND: 7, ...updateUserDto });

    const result = (controller.update as any)(
      '7',
      updateUserDto,
      { user: { sub: 7 } },
    );

    expect(usersService.update).toHaveBeenCalledWith(7, updateUserDto);
    expect(result).resolves.toEqual({ maND: 7, ...updateUserDto });
  });
});
