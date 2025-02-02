import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import translate from "@iamtraction/google-translate";
import redis from "../utils/redis";

const prisma = new PrismaClient();


export const getFAQs = async (req: Request, res: Response): Promise<void> => {
    try {
        const lang = (req.query.lang as string) || "en";

        const cacheKey = `faqs:${lang}`;  // unique key for each language

        //checking if already present serve directly 
        const cachedFAQs = await redis.get(cacheKey);
        if (cachedFAQs) {
            res.status(200).json({ success: true, faqs: JSON.parse(cachedFAQs) });
            return;
        }


        // Fetch existing FAQs in the requested language
        let faqs = await prisma.fAQ.findMany({
            where: { lang },
            include: { admin: { select: { email: true } } },
        });

        if (lang === "en") {
            // Store in cache for 1 hour
            await redis.set(cacheKey, JSON.stringify(faqs), "EX", 3600);
            res.status(200).json({ success: true, faqs });
            return;
        }

        // Get all English FAQs
        const englishFAQs = await prisma.fAQ.findMany({ where: { lang: "en" } });

        // Fetch already translated FAQs
        const existingTranslations = await prisma.fAQ.findMany({
            where: {
                lang,
                createdBy: { in: englishFAQs.map(faq => faq.createdBy) } // Match by creator ID instead
            }
        });

        // filtering FAQs which are not translated yet
        const existingTranslatedIds = new Set(existingTranslations.map(faq => faq.originalId));
        const untranslatedFAQs = englishFAQs.filter(faq => !existingTranslatedIds.has(faq.id));

        // If there are missing translations, translate them
        if (untranslatedFAQs.length > 0) {
            const translatedFAQs = await Promise.all(
                untranslatedFAQs.map(async (faq) => {
                    try {
                        const translatedQuestion = await translate(faq.question, { to: lang });
                        const translatedAnswer = await translate(faq.answer, { to: lang });

                        return prisma.fAQ.create({
                            data: {
                                question: translatedQuestion.text,
                                answer: translatedAnswer.text,
                                lang,
                                createdBy: faq.createdBy,
                                originalId: faq.id
                            },
                        });
                    } catch (translationError) {
                        console.error(`Translation failed for FAQ ${faq.id}:`, translationError);
                        return null;
                    }
                })
            );

            await Promise.all(translatedFAQs.filter(Boolean));
        }

        // Fetch the latest FAQs in the requested language after translations
        faqs = await prisma.fAQ.findMany({
            where: { lang },
            include: { admin: { select: { email: true } } },
        });


        // store the FAQs in cache for 1 hour
        await redis.set(cacheKey, JSON.stringify(faqs), "EX", 3600);

        res.status(200).json({ success: true, faqs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch FAQs", success: false });
    }
};

interface createFAQBody {
    question: string,
    answer: string,
}

export const createFAQ = async (req: Request, res: Response): Promise<void> => {
    try {
        const { question, answer }: createFAQBody = req.body;

        if (!question || !answer) {
            res.status(400).json({ message: "Please send all the fields to create a FAQ", success: false })
            return;
        }

        const adminId = (req as any).userId;

        const faq = await prisma.fAQ.create({
            data: { question, answer, lang: "en", createdBy: adminId },
        });

        // Now remove all the caches so that the fresh one can be included in all the langs
        const keys = await redis.keys("faqs:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }

        res.status(201).json({ message: "FAQ created successfully", faq, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Failed to create FAQ", success: false
        });
    }
};

export const updateFAQ = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { question, answer }: createFAQBody = req.body;


        // Finding existing FAQ 
        const existingFAQ = await prisma.fAQ.findUnique({ where: { id: Number(id) } });

        if (!existingFAQ) {
            res.status(404).json({ message: "FAQ not found", success: false });
            return;
        }

        const faq = await prisma.fAQ.update({
            where: { id: Number(id) },
            data: { question, answer },
        });

       // Now remove all the caches so that the fresh one can be included in all the langs
       const keys = await redis.keys("faqs:*");
       if (keys.length > 0) {
           await redis.del(...keys);
       }

        res.json({ message: "FAQ updated successfully", faq, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update FAQ", success: false });
    }
};

export const deleteFAQ = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Finding existing FAQ
        const existingFAQ = await prisma.fAQ.findUnique({ where: { id: Number(id) } });

        if (!existingFAQ) {
            res.status(404).json({ message: "FAQ not found", success: false });
            return;
        }

        await prisma.fAQ.delete({ where: { id: Number(id) } });

        // Now remove all the caches so that the only fresh FAQs will be included in all the langs
        const keys = await redis.keys("faqs:*");
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        res.status(200).json({ message: "FAQ deleted successfully", success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to delete FAQ", success: true });

    }
};
