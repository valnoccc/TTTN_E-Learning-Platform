import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    return this.userRepository.findOne({ where: { maND: id } });
  }

  async update(id: number, updateUserDto: any) {
    const updateData: any = {};
    if (updateUserDto.hoTen) updateData.hoTen = updateUserDto.hoTen;
    if (updateUserDto.anhDaiDien) {
      updateData.anhDaiDien = updateUserDto.anhDaiDien;
    }
    if (updateUserDto.name) updateData.hoTen = updateUserDto.name;
    if (updateUserDto.fullName) updateData.hoTen = updateUserDto.fullName;
    if (updateUserDto.avatarUrl) {
      updateData.anhDaiDien = updateUserDto.avatarUrl;
    }
    if (updateUserDto.soDienThoai !== undefined) {
      updateData.soDienThoai = updateUserDto.soDienThoai;
    }

    if (Object.keys(updateData).length > 0) {
      await this.userRepository.update(id, updateData);
    }
    return this.userRepository.findOne({ where: { maND: id } });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
