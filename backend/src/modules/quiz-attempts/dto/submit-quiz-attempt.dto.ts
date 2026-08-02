import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';

export class QuizAnswerDto {
  @Type(() => Number)
  @IsInt()
  maCauHoi!: number;

  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  dapAnChon!: 'A' | 'B' | 'C' | 'D' | null;
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
