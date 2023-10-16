import bcrypt from 'bcrypt'
import {PrismaClient} from "@connectors/prisma"

export type User = {
    id: number,
    email: string,
    password: string,
    createdAt: string
};

export default class UserRepository {
    private db = new PrismaClient();
    async createUser (user: Pick<User, "email" | "password">) {
        user.password = await bcrypt.hash(user.password, 10);
        return (await this.db.user.create({
            data: user
        }));
    }

    async findUserById (id: number) {
        return (await this.db.user.findUnique({
            where: {
                id
            }
        }));
    }

    async findUserByEmail (email: string) {
        return (await this.db.user.findUnique({
            where: {
                email
            }
        }));
    }

    async updateUserById (id: number, email: User["email"]) {
        return (await this.db.user.update({
            where: {
                id
            },
            data: {
                email
            }
        }));
    }

    async destroyUserById (id: number) {
        return (await this.db.user.delete({
            where: {
                id
            }
        }));
    }
}