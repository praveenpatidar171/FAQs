import { Request, Response } from "express";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

interface SignupBody {
    fullName: string,
    email: string,
    password: string,
    role?: string
}

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, role }: SignupBody = req.body;
        if (!fullName || !email || !password) {
            res.status(404).json({ message: "Please send all the fields in signup" });
            return;
        }
        const userRole = role === 'admin' ? 'admin' : 'user';

        const userExist = await prisma.user.findUnique({ where: { email } });
        if (userExist) {
            res.status(400).json({ message: "Email Already Used", success: false })
            return;
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName, email, password: hashedPassword, role: userRole,
            }
        });

        if (user) {
            res.status(201).json({ message: "User created successfully", success: true })
            return;
        }
        else {
            res.status(400).json({ message: "User not created", success: false })
            return;
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error creating user", success: false });
    }
}

interface SigninBody {
    email: string,
    password: string
}

export const signin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password }: SigninBody = req.body;

        if (!email || !password) {
            res.status(400).json({ message: "Please send all the fields in signin", success: false })
            return;
        }
        // check if user not exist
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "Invalid credentials", success: false });
            return;
        }

        // check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials", success: false });
            return;
        }

        //generate token
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ message: "Login Successful", success: true, token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error login user", success: false });
    }
}