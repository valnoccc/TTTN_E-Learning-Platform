import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('accepts the supported profile fields with whitelist validation enabled', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      hoTen: 'Nguyen Van A',
      anhDaiDien: 'https://example.com/avatar.png',
      soDienThoai: '0900000000',
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });
});
