import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { QuizAnswerKey } from '../entities/quiz-question.entity';

export class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  noiDung!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  dapAnA!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  dapAnB!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  dapAnC!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  dapAnD!: string;

  @IsEnum(QuizAnswerKey)
  dapAnDung!: QuizAnswerKey;

  @IsInt()
  @Min(1)
  thuTu!: number;
}
