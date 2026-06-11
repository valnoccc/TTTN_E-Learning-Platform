import { Controller, Get, Param } from '@nestjs/common';
import { InstructorsService } from '../services/instructors.service';

@Controller('public/instructors')
export class PublicInstructorsController {
  constructor(private readonly instructorsService: InstructorsService) {}

  @Get()
  async getAllPublicInstructors() {
    return this.instructorsService.getAllPublicInstructors();
  }

  @Get(':id')
  async getPublicInstructorById(@Param('id') id: string) {
    return this.instructorsService.getPublicInstructorById(Number(id));
  }
}
