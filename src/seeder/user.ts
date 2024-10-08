import { faker } from '@faker-js/faker';
import { User } from '../models/user.model';

export const createUser = async (numberOfUser: number) => {
    try {
        const userPromise = [];
        for (let i = 0; i < numberOfUser; i++) {
            const temp = User.create({
                fullName: faker.person.fullName(),
                userName: faker.internet.userName(),
                email: faker.internet.email(),
                password: "12345678",
                avatar: {
                    publicId: faker.image.avatar(),
                    url: faker.system.fileName()
                }
            })

            userPromise.push(temp);
        }
         
        await Promise.all(userPromise);
        process.exit(1);
    
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};