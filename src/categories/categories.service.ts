import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<CreateCategoryDto> {
    const categoriaExistente = await this.prisma.category.findFirst({
      where: {
        name: dto.name,
        type: dto.type,
      },
    });

    if (categoriaExistente) {
      throw new BadRequestException(
        'Já existe uma categoria com esse nome e tipo.',
      );
    }

    return this.prisma.category.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
