import productModel from '../../models/productModel';
import type {Request, Response} from 'express';

export const getProductsForHomepage = async (req: Request, res: Response) => {
    try {
        const { type, category } = req.query;
        
        if (type === "all-furniture") {
            const data = await productModel.find({}).sort({ createdAt: -1 });
            res.status(200).json({ success: true, message: "All products", data });
        } else if (type === "featured-furniture") {
            const data = await productModel.find({}).sort({ productDiscount: -1 }).limit(8);
            res.status(200).json({ success: true, message: "Featured products", data });
        } else if (category) {
            const data = await productModel.find({ productType: category });
            res.status(200).json({ success: true, message: `${category} products`, data });
        } else {
            const data = await productModel.find({}).sort({ productReview: -1 });
            res.status(200).json({ success: true, message: "Top rated products", data });
        }
    } catch (err: any) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
}
