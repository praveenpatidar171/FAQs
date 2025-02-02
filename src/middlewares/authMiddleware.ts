import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET as string;

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {

    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
        res.status(401).json({ message: "No token, send correct token", success: false });
        return;
    }

    try {
        const token = req.headers.authorization.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Forbidden: Admins only" })
            return;
        }
        (req as any).userId = decoded.userId;

        next();

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error in Authorization, Invalid token", success: false });
        return;
    }
}

export default authMiddleware;