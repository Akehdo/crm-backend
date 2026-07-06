import { Injectable } from "@nestjs/common";
import { Prisma, User } from "../../prisma/generated";
import { PrismaService } from "../../prisma/prisma.service";
import { UserAlreadyExistsException } from "./exceptions/user-already-exists.exception";
import { UserNotFoundException } from "./exceptions/user-not-found.exception";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    email: string,
    passwordHash: string,
    role: string,
  ): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new UserAlreadyExistsException();
      }

      throw error;
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      select: { id: true },
      where: { email },
    });

    return Boolean(user);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
