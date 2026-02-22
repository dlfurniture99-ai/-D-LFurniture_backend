import { Router } from "express";
import {getProductsForHomepage} from '../components/users/userController';

const routes = Router();
routes.get("/furniture", getProductsForHomepage);

export default routes;