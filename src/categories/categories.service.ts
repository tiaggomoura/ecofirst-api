import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-categoria.dto';

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

  async update(id: number, dto: UpdateCategoryDto): Promise<UpdateCategoryDto> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found.');

    const duplicate = await this.prisma.category.findFirst({
      where: {
        name: dto.name,
        type: dto.type,
        NOT: { id },
      },
    });
    if (duplicate)
      throw new BadRequestException(
        'Category with same name and type already exists.',
      );

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }
}
