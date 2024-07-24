import { NextFunction, Request, Response } from 'express';
import { JwtAdapter } from '../../config';
import { UserModel } from '../../data';
import { UserEntity } from '../../domain';

export class AuthMiddleware {
  static async validateJWT(req: Request, res: Response, next: NextFunction) {
    const authorizaction = req.header('Authorization');
    if (!authorizaction)
      return res.status(401).json({ error: 'no token provieded' });
    if (!authorizaction.startsWith('Bearer '))
      return res.status(404).json({ error: 'Invalid Bearer token' });

    const token = authorizaction.split(' ').at(1) || '';

    try {
      const payload = await JwtAdapter.validateToken<{ id: string }>(token);
      if (!payload) return res.status(401).json({ error: 'Invalid token' });

      const user = await UserModel.findById(payload.id);
      if (!user) return res.status(401).json({ error: 'Invalid token - user' });

      //TODO: validate if user isActive

      req.body.user = UserEntity.fromObject(user);

      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
