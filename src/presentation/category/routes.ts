import { Router } from 'express';
import { CategoryController } from './controller';
import { CategoryService } from '../services/category.service';

export class CategoryRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new CategoryController(new CategoryService());

    // Definir las rutas
    router.get('/', controller.getCategories);
    router.post('/', controller.createCategory);

    return router;
  }
}
