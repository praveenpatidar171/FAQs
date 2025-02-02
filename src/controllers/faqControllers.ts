import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import translate from "@iamtraction/google-translate";

const prisma = new PrismaClient();


export const getFAQs = async (req: Request, res: Response): Promise<void> => {
    try {
        const lang = (req.query.lang as string) || "en";

        // Fetch existing FAQs in the requested language
        let faqs = await prisma.fAQ.findMany({
            where: { lang },
            include: { admin: { select: { email: true } } },
        });

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

        const faq = await prisma.fAQ.update({
            where: { id: Number(id) },
            data: { question, answer },
        });

        res.json({ message: "FAQ updated successfully", faq, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update FAQ", success: false });
    }
};

export const deleteFAQ = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.fAQ.delete({ where: { id: Number(id) } });

        res.status(200).json({ message: "FAQ deleted successfully", success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to delete FAQ", success: true });

    }
};
