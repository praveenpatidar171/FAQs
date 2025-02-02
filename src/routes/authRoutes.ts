import express from 'express';
import { signin, signup } from '../controllers/authControllers';


const router = express.Router();

//register a new user
router.post('/signup', signup);

//login user
router.post('/login', signin);

export default router;